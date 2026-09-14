import { db } from "./connection";
import { nextTransactionNumber, uid } from "./helpers";

const columns = (table: string) =>
  db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;

const hasColumn = (table: string, column: string) =>
  columns(table).some(c => c.name === column);

function addColumn(table: string, column: string, definition: string) {
  if (hasColumn(table, column)) return;
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate column name")) return;
    throw error;
  }
}

export function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS financial_period_closures (id TEXT PRIMARY KEY, period_type TEXT NOT NULL CHECK(period_type IN ('MONTH','YEAR')), period_key TEXT NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL, opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, closed_at TEXT, report_printed_at TEXT, opening_balance REAL NOT NULL DEFAULT 0, total_sales REAL NOT NULL DEFAULT 0, total_collections REAL NOT NULL DEFAULT 0, total_expenses REAL NOT NULL DEFAULT 0, expected_cash REAL NOT NULL DEFAULT 0, actual_cash REAL, difference REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')), UNIQUE(period_type, period_key));`);
addColumn("exams", "exam_number", "TEXT");
addColumn("invoices", "exam_id", "TEXT");
addColumn("invoices", "exam_date", "TEXT");
addColumn("invoices", "od_sph", "REAL");
addColumn("invoices", "od_cyl", "REAL");
addColumn("invoices", "od_axis", "INTEGER");
addColumn("invoices", "od_add", "REAL");
addColumn("invoices", "os_sph", "REAL");
addColumn("invoices", "os_cyl", "REAL");
addColumn("invoices", "os_axis", "INTEGER");
addColumn("invoices", "os_add", "REAL");
addColumn("invoices", "pd", "REAL");
addColumn("invoices", "near_pd", "REAL");
addColumn("invoices", "examiner", "TEXT");
addColumn("invoices", "exam_notes", "TEXT");

if (hasColumn("invoices", "exam_id")) {
  const legacyRows = db.prepare(`
    SELECT i.id AS invoice_id, e.exam_date,
      e.od_sph, e.od_cyl, e.od_axis, e.od_add,
      e.os_sph, e.os_cyl, e.os_axis, e.os_add,
      e.pd, e.near_pd, e.examiner, e.notes AS exam_notes
    FROM invoices i
    JOIN exams e ON e.id = i.exam_id
    WHERE i.exam_id IS NOT NULL AND i.exam_date IS NULL
  `).all() as Array<Record<string, unknown>>;

  const update = db.prepare(`
    UPDATE invoices SET exam_date=?, od_sph=?, od_cyl=?, od_axis=?, od_add=?,
      os_sph=?, os_cyl=?, os_axis=?, os_add=?, pd=?, near_pd=?, examiner=?, exam_notes=?
    WHERE id=?
  `);

  const transaction = db.transaction((rows: Array<Record<string, unknown>>) => {
    for (const row of rows) {
      update.run(
        row.exam_date, row.od_sph, row.od_cyl, row.od_axis, row.od_add,
        row.os_sph, row.os_cyl, row.os_axis, row.os_add,
        row.pd, row.near_pd, row.examiner, row.exam_notes, row.invoice_id,
      );
    }
  });

  if (legacyRows.length > 0) transaction(legacyRows);
}

const hasFinancialTransactions = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='financial_transactions'")
  .get();

if (hasFinancialTransactions) {
  const legacyPaidInvoices = db.prepare(`
    SELECT i.id AS invoice_id, i.customer_id, i.paid, i.invoice_date, i.created_at
    FROM invoices i
    WHERE i.paid > 0
      AND i.id NOT IN (
        SELECT invoice_id FROM financial_transactions WHERE invoice_id IS NOT NULL
      )
  `).all() as Array<{
    invoice_id: string;
    customer_id: string;
    paid: number;
    invoice_date: string;
    created_at: string;
  }>;

  const insertFt = db.prepare(`
    INSERT INTO financial_transactions
      (id, transaction_number, transaction_date, type, amount, invoice_id, customer_id, description, status)
    VALUES (?, ?, ?, 'PAYMENT', ?, ?, ?, 'دفعة عند إنشاء الفاتورة (ترحيل)', 'ACTIVE')
  `);

  const tx = db.transaction((rows: typeof legacyPaidInvoices) => {
    for (const inv of rows) {
      insertFt.run(
        uid("ftx"),
        nextTransactionNumber(),
        inv.invoice_date || inv.created_at.slice(0, 10),
        inv.paid,
        inv.invoice_id,
        inv.customer_id,
      );
    }
  });

  if (legacyPaidInvoices.length > 0) tx(legacyPaidInvoices);
}

}
