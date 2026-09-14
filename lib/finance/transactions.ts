import { db } from "@/lib/db";

export function getTransactionsForDateRange(
  from: string,
  to: string,
): Array<Record<string, unknown>> {
  return db
    .prepare(
      `SELECT t.*, i.invoice_number, c.name as customer_name
       FROM financial_transactions t
       LEFT JOIN invoices i ON i.id = t.invoice_id
       LEFT JOIN customers c ON c.id = t.customer_id
       WHERE t.transaction_date >= ?
       AND t.transaction_date <= ?
       ORDER BY t.transaction_date DESC, t.created_at DESC`,
    )
    .all(from, to) as Array<Record<string, unknown>>;
}

/**
 * جلب صفحة واحدة من الحركات المالية.
 *
 * Pagination يتم على مستوى SQLite وليس في React.
 */
export function getTransactionsPage(
  from: string,
  to: string,
  page = 1,
  limit = 10,
): {
  transactions: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
} {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(10, Math.max(1, Math.floor(limit)));

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) as total
       FROM financial_transactions
       WHERE transaction_date >= ?
       AND transaction_date <= ?`,
    )
    .get(from, to) as { total: number };

  const total = Number(totalRow.total || 0);

  const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);

  const normalizedPage = Math.min(safePage, totalPages);

  const offset = (normalizedPage - 1) * safeLimit;

  const transactions = db
    .prepare(
      `SELECT t.*,
              i.invoice_number,
              c.name as customer_name
       FROM financial_transactions t
       LEFT JOIN invoices i ON i.id = t.invoice_id
       LEFT JOIN customers c ON c.id = t.customer_id
       WHERE t.transaction_date >= ?
       AND t.transaction_date <= ?
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(from, to, safeLimit, offset) as Array<Record<string, unknown>>;

  return {
    transactions,
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

/**
 * جلب صفحة واحدة من الفواتير غير المسددة.
 *
 * Pagination يتم على مستوى SQLite وليس في React.
 */
export function getOutstandingDebtsPage(
  page = 1,
  limit = 10,
): {
  debts: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
} {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(10, Math.max(1, Math.floor(limit)));

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) as total
       FROM invoices
       WHERE status IN ('UNPAID', 'PARTIALLY_PAID')
       AND status <> 'CANCELLED'`,
    )
    .get() as { total: number };

  const total = Number(totalRow.total || 0);

  const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);

  const normalizedPage = Math.min(safePage, totalPages);

  const offset = (normalizedPage - 1) * safeLimit;

  const debts = db
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
       WHERE i.status IN ('UNPAID', 'PARTIALLY_PAID')
       AND i.status <> 'CANCELLED'
       ORDER BY i.invoice_date DESC, i.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(safeLimit, offset) as Array<Record<string, unknown>>;

  return {
    debts,
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

