import { db } from "@/lib/db";

export function getOutstandingDebts(): Array<Record<string, unknown>> {
  return db
    .prepare(
      `SELECT i.id,
              i.invoice_number,
              i.invoice_date,
              i.total,
              i.paid,
              i.remaining,
              c.name as customer_name,
              c.phone as customer_phone
       FROM invoices i
       JOIN customers c ON c.id = i.customer_id
       WHERE i.status IN ('UNPAID','PARTIALLY_PAID')
       AND i.status <> 'CANCELLED'
       ORDER BY i.invoice_date DESC`,
    )
    .all() as Array<Record<string, unknown>>;
}

export function getCustomerStatement(
  customerId: string,
): Array<Record<string, unknown>> {
  const invoices = db
    .prepare(
      `SELECT invoice_date as date,
              invoice_number as ref,
              'فاتورة' as type,
              total as debit,
              0 as credit
       FROM invoices
       WHERE customer_id = ?
       AND status <> 'CANCELLED'`,
    )
    .all(customerId) as Array<{
    date: string;
    ref: string;
    type: string;
    debit: number;
    credit: number;
  }>;

  const payments = db
    .prepare(
      `SELECT t.transaction_date as date,
              t.transaction_number as ref,
              'دفعة' as type,
              0 as debit,
              t.amount as credit
       FROM financial_transactions t
       WHERE t.customer_id = ?
       AND t.type = 'PAYMENT'
       AND t.status = 'ACTIVE'`,
    )
    .all(customerId) as Array<{
    date: string;
    ref: string;
    type: string;
    debit: number;
    credit: number;
  }>;

  const rows = [...invoices, ...payments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let balance = 0;

  return rows.map((r) => {
    balance += r.debit - r.credit;

    return {
      ...r,
      balance,
    };
  });
}

