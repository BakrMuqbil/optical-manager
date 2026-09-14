import { isDayClosed } from "./cashClosure";
import { db, normalizeMoney, uid } from "@/lib/db";

export function recalculateInvoiceBalance(invoiceId: string): void {
  const invoice = db
    .prepare("SELECT total, status FROM invoices WHERE id = ?")
    .get(invoiceId) as { total: number; status: string } | undefined;

  if (!invoice) return;

  const totalPaid = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM financial_transactions
       WHERE invoice_id = ?
       AND type = 'PAYMENT'
       AND status = 'ACTIVE'`,
    )
    .get(invoiceId) as { total: number };

  const paid = normalizeMoney(totalPaid.total);
  const remaining = normalizeMoney(invoice.total - paid);

  // لا نسمح بإعادة حساب فاتورة ملغاة إلى PAID/UNPAID.
  if (invoice.status === "CANCELLED") {
    return;
  }

  const status: string =
    remaining === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";

  db.prepare(
    `UPDATE invoices
     SET paid = ?,
         remaining = ?,
         status = ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(paid, remaining, status, new Date().toISOString(), invoiceId);
}

/**
 * مزامنة المبلغ المدفوع في نموذج تعديل الفاتورة مع الحركات المالية.
 *
 * القواعد:
 * - لا يتم تغيير تاريخ أي دفعة موجودة.
 * - لا يتم تغيير عميل أي دفعة موجودة.
 * - عند زيادة المدفوع، ننشئ حركة جديدة بالفرق.
 * - عند تخفيض المدفوع، نخفّض/نحذف أحدث الدفعات أولًا.
 * - لا نعدّل حركة مرتبطة بيوم مالي مغلق.
 */
export function synchronizeInvoicePayment(
  invoiceId: string,
  customerId: string,
  transactionDate: string,
  desiredPaid: number,
  createTransactionNumber: () => string,
): void {
  const targetPaid = normalizeMoney(desiredPaid);

  const payments = db
    .prepare(
      `SELECT
         id,
         amount,
         transaction_date,
         created_at
       FROM financial_transactions
       WHERE invoice_id=?
         AND type='PAYMENT'
         AND status='ACTIVE'
       ORDER BY created_at ASC, id ASC`,
    )
    .all(invoiceId) as Array<{
    id: string;
    amount: number;
    transaction_date: string;
    created_at: string;
  }>;

  const currentPaid = normalizeMoney(
    payments.reduce((sum, payment) => sum + normalizeMoney(payment.amount), 0),
  );

  if (targetPaid === currentPaid) {
    return;
  }

  if (targetPaid > currentPaid) {
    const difference = normalizeMoney(targetPaid - currentPaid);

    db.prepare(
      `INSERT INTO financial_transactions
        (
          id,
          transaction_number,
          transaction_date,
          type,
          amount,
          invoice_id,
          customer_id,
          description,
          status
        )
       VALUES (?, ?, ?, 'PAYMENT', ?, ?, ?, ?, 'ACTIVE')`,
    ).run(
      uid("ftx"),
      createTransactionNumber(),
      transactionDate,
      difference,
      invoiceId,
      customerId,
      "دفعة عند تعديل الفاتورة",
    );

    return;
  }

  let reduction = normalizeMoney(currentPaid - targetPaid);

  // نبدأ من أحدث دفعة حتى لا نعيد كتابة تاريخ الدفعات الأقدم.
  for (
    let index = payments.length - 1;
    index >= 0 && reduction > 0;
    index -= 1
  ) {
    const payment = payments[index];
    const amount = normalizeMoney(payment.amount);

    if (amount <= 0) continue;

    if (isDayClosed(payment.transaction_date)) {
      throw new Error(
        "لا يمكن تخفيض المدفوع لأن إحدى الدفعات مرتبطة بيوم مالي مغلق",
      );
    }

    const amountToRemove = Math.min(amount, reduction);
    const newAmount = normalizeMoney(amount - amountToRemove);

    if (newAmount === 0) {
      db.prepare(`DELETE FROM financial_transactions WHERE id=?`).run(
        payment.id,
      );
    } else {
      // نغيّر المبلغ فقط؛ التاريخ والعميل الأصليان ثابتان.
      db.prepare(
        `UPDATE financial_transactions
         SET amount=?
         WHERE id=?`,
      ).run(newAmount, payment.id);
    }

    reduction = normalizeMoney(reduction - amountToRemove);
  }

  if (reduction > 0) {
    throw new Error("تعذر تخفيض المدفوع من الدفعات المسجلة");
  }
}

