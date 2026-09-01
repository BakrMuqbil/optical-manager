import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "optical-manager.db");
const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db = globalForDb.db ?? new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'محل البصريات',
  phone TEXT,
  address TEXT,
  logo TEXT,
  currency TEXT NOT NULL DEFAULT 'ر.ي',
  invoice_footer TEXT DEFAULT 'شكرًا لزيارتكم',
  paper_size TEXT NOT NULL DEFAULT 'A4',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  customer_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  date_of_birth TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  exam_date TEXT NOT NULL,
  od_sph REAL, od_cyl REAL, od_axis INTEGER, od_add REAL, od_prism REAL, od_base TEXT,
  os_sph REAL, os_cyl REAL, os_axis INTEGER, os_add REAL, os_prism REAL, os_base TEXT,
  pd REAL, near_pd REAL,
  notes TEXT,
  examiner TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exams_customer_date ON exams(customer_id, exam_date DESC);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_date TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  remaining REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'UNPAID',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_date ON invoices(customer_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
`);

/**
 * Lightweight migrations for installations created before the current schema.
 * They intentionally use nullable columns so existing databases/data are preserved.
 */
const columns = (table: string) =>
  db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;

const hasColumn = (table: string, column: string) =>
  columns(table).some((c) => c.name === column);

if (!hasColumn("exams", "exam_number")) {
  db.exec("ALTER TABLE exams ADD COLUMN exam_number TEXT");
}

if (!hasColumn("invoices", "exam_id")) {
  db.exec(
    "ALTER TABLE invoices ADD COLUMN exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL",
  );
}

// Backfill old exams with stable human-readable numbers.
const missingExams = db
  .prepare(
    "SELECT id FROM exams WHERE exam_number IS NULL OR TRIM(exam_number) = '' ORDER BY rowid ASC",
  )
  .all() as Array<{ id: string }>;

const setExamNumber = db.prepare(
  "UPDATE exams SET exam_number = ? WHERE id = ?",
);

let examSequence = 0;
const existingMax = db
  .prepare(
    `SELECT MAX(CAST(SUBSTR(exam_number, 6) AS INTEGER)) AS n
     FROM exams
     WHERE exam_number LIKE 'EXAM-%'`,
  )
  .get() as { n?: number | null } | undefined;

examSequence = Number(existingMax?.n || 0);

const backfillTx = db.transaction(() => {
  for (const exam of missingExams) {
    examSequence += 1;
    setExamNumber.run(`EXAM-${String(examSequence).padStart(6, "0")}`, exam.id);
  }
});
if (missingExams.length) backfillTx();

db.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_exam_number ON exams(exam_number)",
);

export function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nextNumber(
  prefix: string,
  table: "customers" | "invoices",
  field: string,
) {
  const row = db
    .prepare(
      `SELECT ${field} as value FROM ${table} ORDER BY rowid DESC LIMIT 1`,
    )
    .get() as { value?: string } | undefined;
  const match = row?.value?.match(/(\d+)$/);
  const next = (match ? Number(match[1]) : 0) + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

export function nextCustomerNumber() {
  return nextNumber("CUS", "customers", "customer_number");
}

export function nextInvoiceNumber() {
  return nextNumber("INV", "invoices", "invoice_number");
}

export function nextExamNumber() {
  const row = db
    .prepare(
      `SELECT MAX(CAST(SUBSTR(exam_number, 6) AS INTEGER)) AS n
       FROM exams WHERE exam_number LIKE 'EXAM-%'`,
    )
    .get() as { n?: number | null } | undefined;
  return `EXAM-${String(Number(row?.n || 0) + 1).padStart(6, "0")}`;
}

export function getSettings() {
  return db.prepare("SELECT * FROM settings WHERE id = 1").get();
}

export function normalizeMoney(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

export function normalizeOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeOptionalInt(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}
