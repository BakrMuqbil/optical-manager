import { db, uid } from "@/lib/db";
import { getPeriodClosure } from "@/lib/reports";

export function isDayClosed(date: string): boolean {
  if (isPeriodClosedForDate(date)) return true;
  const row = db
    .prepare("SELECT status FROM cash_closures WHERE business_date = ?")
    .get(date) as { status: string } | undefined;

  return row?.status === "CLOSED";
}

export function isPeriodClosedForDate(date: string): boolean {
  const monthKey = date.slice(0, 7);
  const yearKey = date.slice(0, 4);
  return getPeriodClosure("MONTH", monthKey)?.status === "CLOSED" || getPeriodClosure("YEAR", yearKey)?.status === "CLOSED";
}

export function getOrCreateCashClosure(date: string): Record<string, unknown> {
  const existing = db
    .prepare("SELECT * FROM cash_closures WHERE business_date = ?")
    .get(date) as Record<string, unknown> | undefined;

  if (existing) return existing;

  const id = uid("cls");
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO cash_closures (
      id,
      business_date,
      opened_at,
      status,
      opening_balance,
      total_sales,
      total_collections,
      total_expenses,
      expected_cash,
      difference
    )
    VALUES (?, ?, ?, 'OPEN', 0, 0, 0, 0, 0, 0)`,
  ).run(id, date, now);

  return db
    .prepare("SELECT * FROM cash_closures WHERE id = ?")
    .get(id) as Record<string, unknown>;
}
export function getClosureForDate(
  date: string,
): Record<string, unknown> | undefined {
  return db
    .prepare("SELECT * FROM cash_closures WHERE business_date = ?")
    .get(date) as Record<string, unknown> | undefined;
}

export function getCashClosureById(
  id: string,
): Record<string, unknown> | undefined {
  return db.prepare("SELECT * FROM cash_closures WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
}

/**
 * جلب صفحة واحدة من سجل إغلاقات الصندوق.
 *
 * Pagination يتم على مستوى SQLite وليس في React.
 */
export function getCashClosuresPage(page = 1, limit = 10) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(10, Math.max(1, Math.floor(limit)));

  const totalRow = db
    .prepare("SELECT COUNT(*) as total FROM cash_closures")
    .get() as { total: number };

  const total = Number(totalRow.total || 0);

  const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);

  const normalizedPage = Math.min(safePage, totalPages);

  const normalizedOffset = (normalizedPage - 1) * safeLimit;

  const closures = db
    .prepare(
      `SELECT *
       FROM cash_closures
       ORDER BY business_date DESC, closed_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(safeLimit, normalizedOffset) as Array<Record<string, unknown>>;

  return {
    closures,
    pagination: {
      page: normalizedPage,
      limit: safeLimit,
      total,
      totalPages,
      hasPreviousPage: normalizedPage > 1,
      hasNextPage: normalizedPage < totalPages,
    },
  };
}
