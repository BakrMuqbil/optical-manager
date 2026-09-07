import { db, normalizeMoney, uid } from "./db";

export function isDayClosed(date: string): boolean {
  const row = db
    .prepare(
      "SELECT status FROM cash_closures WHERE business_date = ?",
    )
    .get(date) as { status: string } | undefined;

  return row?.status === "CLOSED";
}

export function getOrCreateCashClosure(
  date: string,
): Record<string, unknown> {
  const existing = db
    .prepare(
      "SELECT * FROM cash_closures WHERE business_date = ?",
    )
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

export function recalculateInvoiceBalance(
  invoiceId: string,
): void {
  const totalPaid = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM financial_transactions
       WHERE invoice_id = ?
       AND type = 'PAYMENT'
       AND status = 'ACTIVE'`,
    )
    .get(invoiceId) as { total: number };

  const invoice = db
    .prepare("SELECT total FROM invoices WHERE id = ?")
    .get(invoiceId) as { total: number } | undefined;

  if (!invoice) return;

  const paid = normalizeMoney(totalPaid.total);
  const remaining = normalizeMoney(invoice.total - paid);

  const status: string =
    remaining === 0
      ? "PAID"
      : paid > 0
        ? "PARTIALLY_PAID"
        : "UNPAID";

  db.prepare(
    `UPDATE invoices
     SET paid = ?,
         remaining = ?,
         status = ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(
    paid,
    remaining,
    status,
    new Date().toISOString(),
    invoiceId,
  );
}

export function getFinancialSummary(date: string) {
  const sales = db
    .prepare(
      `SELECT COALESCE(SUM(total),0) as total
       FROM invoices
       WHERE invoice_date = ?
       AND status <> 'CANCELLED'`,
    )
    .get(date) as { total: number };

  const collections = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM financial_transactions
       WHERE transaction_date = ?
       AND type = 'PAYMENT'
       AND status = 'ACTIVE'`,
    )
    .get(date) as { total: number };

  const expenses = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM financial_transactions
       WHERE transaction_date = ?
       AND type = 'EXPENSE'
       AND status = 'ACTIVE'`,
    )
    .get(date) as { total: number };

  const oldDebtCollection = db
    .prepare(
      `SELECT COALESCE(SUM(t.amount),0) as total
       FROM financial_transactions t
       JOIN invoices i ON i.id = t.invoice_id
       WHERE t.transaction_date = ?
       AND t.type = 'PAYMENT'
       AND t.status = 'ACTIVE'
       AND i.invoice_date <> ?`,
    )
    .get(date, date) as { total: number };

  const todayPaymentsOnNewInvoices = db
    .prepare(
      `SELECT COALESCE(SUM(t.amount),0) as total
       FROM financial_transactions t
       JOIN invoices i ON i.id = t.invoice_id
       WHERE t.transaction_date = ?
       AND t.type = 'PAYMENT'
       AND t.status = 'ACTIVE'
       AND i.invoice_date = ?`,
    )
    .get(date, date) as { total: number };

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

export function getClosureForDate(
  date: string,
): Record<string, unknown> | undefined {
  return db
    .prepare(
      "SELECT * FROM cash_closures WHERE business_date = ?",
    )
    .get(date) as Record<string, unknown> | undefined;
}

export function getCashClosureById(
  id: string,
): Record<string, unknown> | undefined {
  return db
    .prepare(
      "SELECT * FROM cash_closures WHERE id = ?",
    )
    .get(id) as Record<string, unknown> | undefined;
}

/**
 * جلب صفحة واحدة من سجل إغلاقات الصندوق.
 *
 * Pagination يتم على مستوى SQLite وليس في React.
 */
export function getCashClosuresPage(
  page = 1,
  limit = 10,
) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(
    10,
    Math.max(1, Math.floor(limit)),
  );

  const totalRow = db
    .prepare(
      "SELECT COUNT(*) as total FROM cash_closures",
    )
    .get() as { total: number };

  const total = Number(totalRow.total || 0);

  const totalPages =
    total === 0
      ? 1
      : Math.ceil(total / safeLimit);

  const normalizedPage = Math.min(
    safePage,
    totalPages,
  );

  const normalizedOffset =
    (normalizedPage - 1) * safeLimit;

  const closures = db
    .prepare(
      `SELECT *
       FROM cash_closures
       ORDER BY business_date DESC, closed_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(
      safeLimit,
      normalizedOffset,
    ) as Array<Record<string, unknown>>;

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

/**
 * الاحتفاظ بالدالة القديمة للتوافق مع أي مكان آخر في المشروع.
 */
export function getAllClosures(): Array<Record<string, unknown>> {
  return db
    .prepare(
      "SELECT * FROM cash_closures ORDER BY business_date DESC",
    )
    .all() as Array<Record<string, unknown>>;
}

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
  date: string,
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
  const safeLimit = Math.min(
    10,
    Math.max(1, Math.floor(limit)),
  );

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) as total
       FROM financial_transactions
       WHERE transaction_date = ?`,
    )
    .get(date) as { total: number };

  const total = Number(totalRow.total || 0);

  const totalPages =
    total === 0
      ? 1
      : Math.ceil(total / safeLimit);

  const normalizedPage = Math.min(
    safePage,
    totalPages,
  );

  const offset =
    (normalizedPage - 1) * safeLimit;

  const transactions = db
    .prepare(
      `SELECT t.*,
              i.invoice_number,
              c.name as customer_name
       FROM financial_transactions t
       LEFT JOIN invoices i ON i.id = t.invoice_id
       LEFT JOIN customers c ON c.id = t.customer_id
       WHERE t.transaction_date = ?
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(
      date,
      safeLimit,
      offset,
    ) as Array<Record<string, unknown>>;

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
  const safeLimit = Math.min(
    10,
    Math.max(1, Math.floor(limit)),
  );

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) as total
       FROM invoices
       WHERE status IN ('UNPAID', 'PARTIALLY_PAID')
       AND status <> 'CANCELLED'`,
    )
    .get() as { total: number };

  const total = Number(totalRow.total || 0);

  const totalPages =
    total === 0
      ? 1
      : Math.ceil(total / safeLimit);

  const normalizedPage = Math.min(
    safePage,
    totalPages,
  );

  const offset =
    (normalizedPage - 1) * safeLimit;

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
    .all(
      safeLimit,
      offset,
    ) as Array<Record<string, unknown>>;

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
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime(),
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

export function getDailyDashboardStats(date: string) {
  const summary = getFinancialSummary(date);
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