import { NextResponse } from "next/server";
import {
  db,
  normalizeMoney,
  uid,
  nextTransactionNumber,
} from "@/lib/db";
import {
  isDayClosed,
  recalculateInvoiceBalance,
} from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();

    const invoiceId = String(
      b.invoiceId || "",
    ).trim();

    const amount = normalizeMoney(b.amount);

    const date =
      String(b.date || "").trim() ||
      new Date().toISOString().slice(0, 10);

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: "الفاتورة مطلوبة",
        },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "المبلغ يجب أن يكون أكبر من صفر",
        },
        { status: 400 },
      );
    }

    /*
     * الحركة المالية تعتمد على يوم تسجيل الدفعة.
     */
    if (isDayClosed(date)) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن تسجيل حركة في يوم مغلق",
        },
        { status: 400 },
      );
    }

    const invoice = db
      .prepare(
        `SELECT
           id,
           total,
           paid,
           remaining,
           customer_id,
           invoice_date,
           status
         FROM invoices
         WHERE id=?`,
      )
      .get(invoiceId) as
      | {
          id: string;
          total: number;
          paid: number;
          remaining: number;
          customer_id: string;
          invoice_date: string;
          status: string;
        }
      | undefined;

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "الفاتورة غير موجودة",
        },
        { status: 404 },
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن تسجيل دفعة لفاتورة ملغاة",
        },
        { status: 400 },
      );
    }

    /*
     * لا نستخدم قيمة remaining المخزنة وحدها.
     *
     * نحسب الرصيد الحقيقي من الحركات المالية.
     */
    const actualPaidRow = db
      .prepare(
        `SELECT
           COALESCE(SUM(amount), 0) AS total
         FROM financial_transactions
         WHERE invoice_id=?
           AND type='PAYMENT'
           AND status='ACTIVE'`,
      )
      .get(invoiceId) as {
        total: number;
      };

    const actualPaid = normalizeMoney(
      actualPaidRow.total,
    );

    const actualRemaining = normalizeMoney(
      invoice.total - actualPaid,
    );

    if (amount > actualRemaining) {
      return NextResponse.json(
        {
          success: false,
          error: "المبلغ يتجاوز المتبقي",
        },
        { status: 400 },
      );
    }

    const transaction = db.transaction(() => {
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
        nextTransactionNumber(),
        date,
        amount,
        invoiceId,
        invoice.customer_id,
        String(b.description || "").trim() ||
          "سداد دفعة",
      );

      /*
       * paid / remaining / status يتم حسابها من
       * financial_transactions.
       */
      recalculateInvoiceBalance(invoiceId);
    });

    transaction();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "POST /api/payments error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر تسجيل الدفعة",
      },
      { status: 500 },
    );
  }
}