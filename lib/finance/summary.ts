import { db, normalizeMoney } from "@/lib/db";

export function getFinancialSummary(from: string, to: string) {
  const sales = db
    .prepare(
      `SELECT COALESCE(SUM(total),0) as total
       FROM invoices
       WHERE invoice_date >= ?
       AND invoice_date <= ?
       AND status <> 'CANCELLED'`,
    )
    .get(from, to) as { total: number };

  const collections = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM financial_transactions
       WHERE transaction_date >= ?
       AND transaction_date <= ?
       AND type = 'PAYMENT'
       AND status = 'ACTIVE'`,
    )
    .get(from, to) as { total: number };

  const expenses = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM financial_transactions
       WHERE transaction_date >= ?
       AND transaction_date <= ?
       AND type = 'EXPENSE'
       AND status = 'ACTIVE'`,
    )
    .get(from, to) as { total: number };

  const oldDebtCollection = db
    .prepare(
      `SELECT COALESCE(SUM(t.amount),0) as total
       FROM financial_transactions t
       JOIN invoices i ON i.id = t.invoice_id
       WHERE t.transaction_date >= ?
       AND t.transaction_date <= ?
       AND t.type = 'PAYMENT'
       AND t.status = 'ACTIVE'
       AND i.status <> 'CANCELLED'
       AND i.invoice_date < ?`,
    )
    .get(from, to, from) as { total: number };

  const todayPaymentsOnNewInvoices = db
    .prepare(
      `SELECT COALESCE(SUM(t.amount),0) as total
       FROM financial_transactions t
       JOIN invoices i ON i.id = t.invoice_id
       WHERE t.transaction_date >= ?
       AND t.transaction_date <= ?
       AND t.type = 'PAYMENT'
       AND t.status = 'ACTIVE'
       AND i.status <> 'CANCELLED'
       AND i.invoice_date >= ?
       AND i.invoice_date <= ?`,
    )
    .get(from, to, from, to) as { total: number };

  return {
    sales: normalizeMoney(sales.total),
    collections: normalizeMoney(collections.total),
    expenses: normalizeMoney(expenses.total),
    oldDebtCollection: normalizeMoney(oldDebtCollection.total),
    todayPaymentsOnNewInvoices: normalizeMoney(
      todayPaymentsOnNewInvoices.total,
    ),
  };
}
