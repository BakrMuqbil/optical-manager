import { db, normalizeMoney } from "@/lib/db";
import { getClosureForDate } from "./cashClosure";
import { getFinancialSummary } from "./summary";

export function getDailyDashboardStats(date: string) {
  const summary = getFinancialSummary(date, date);
  const closure = getClosureForDate(date);

  const totalDebts = db
    .prepare(
      `SELECT COALESCE(SUM(remaining),0) as total
       FROM invoices
       WHERE status IN ('UNPAID','PARTIALLY_PAID')
       AND status <> 'CANCELLED'`,
    )
    .get() as { total: number };

  return {
    ...summary,
    totalDebts: normalizeMoney(totalDebts.total),
    isClosed: closure?.status === "CLOSED",
  };
}
