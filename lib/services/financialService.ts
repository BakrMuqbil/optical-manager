import { db, normalizeMoney } from "@/lib/db";
import {
  getCashClosureById,
  getCashClosuresPage,
  getClosureForDate,
  getFinancialSummary,
  getOutstandingDebtsPage,
  getTransactionsPage,
  isDayClosed,
} from "@/lib/finance";

export function getFinancialOverview(params: {
  from: string;
  to: string;
  transactionPage: number;
  debtPage: number;
  limit: number;
}) {
  const summary = getFinancialSummary(params.from, params.to);
  const transactions = getTransactionsPage(
    params.from,
    params.to,
    params.transactionPage,
    params.limit,
  );
  const debts = getOutstandingDebtsPage(params.debtPage, params.limit);
  const closure = getClosureForDate(params.to);

  return {
    summary,
    transactions: transactions.transactions,
    transactionPagination: transactions.pagination,
    debts: debts.debts,
    debtPagination: debts.pagination,
    closure,
    periodClosed: isDayClosed(params.to),
  };
}

export function getClosureRecord(params: { id?: string | null; date?: string | null; page?: number; limit?: number }) {
  if (params.id) return getCashClosureById(params.id);
  if (params.date) return db.prepare("SELECT * FROM cash_closures WHERE business_date = ?").get(params.date);
  return getCashClosuresPage(params.page || 1, params.limit || 10);
}

export function closeCashDay(date: string, actualCash: number, openingBalance: number) {
  if (isDayClosed(date)) throw new Error("اليوم مغلق مسبقًا");

  const summary = getFinancialSummary(date, date);
  const expected = openingBalance + summary.collections - summary.expenses;
  const difference = normalizeMoney(actualCash - expected);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO cash_closures (
      id, business_date, opened_at, closed_at, opening_balance,
      total_sales, total_collections, total_expenses, expected_cash,
      actual_cash, difference, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CLOSED')
    ON CONFLICT(business_date) DO UPDATE SET
      closed_at = excluded.closed_at,
      opening_balance = excluded.opening_balance,
      total_sales = excluded.total_sales,
      total_collections = excluded.total_collections,
      total_expenses = excluded.total_expenses,
      expected_cash = excluded.expected_cash,
      actual_cash = excluded.actual_cash,
      difference = excluded.difference,
      status = 'CLOSED'
  `).run(
    `cls_${crypto.randomUUID()}`,
    date,
    now,
    now,
    openingBalance,
    summary.sales,
    summary.collections,
    summary.expenses,
    expected,
    actualCash,
    difference,
  );

  return { expected, difference };
}
