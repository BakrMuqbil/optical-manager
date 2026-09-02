import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function getDataDir() {
  // Electron production
  // ELECTRON_DATA_DIR يتم تمريره من Electron main process
  if (process.env.ELECTRON_DATA_DIR) {
    return process.env.ELECTRON_DATA_DIR;
  }

  // Windows production fallback
  if (process.env.NODE_ENV === "production") {
    const userDataPath =
      process.env.APPDATA ||
      process.env.LOCALAPPDATA ||
      process.env.HOME ||
      process.cwd();

    return path.join(userDataPath, "optical-manager");
  }

  // Development
  return path.join(process.cwd(), "data");
}

const dataDir = getDataDir();

fs.mkdirSync(dataDir, {
  recursive: true,
});

const dbPath = path.join(dataDir, "optical-manager.db");

const globalForDb = globalThis as unknown as {
  db?: Database.Database;
};

export const db =
  globalForDb.db ??
  new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

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

CREATE INDEX IF NOT EXISTS idx_customers_name
ON customers(name);

CREATE INDEX IF NOT EXISTS idx_customers_phone
ON customers(phone);

-- جدول قديم محفوظ للتوافق مع قواعد البيانات السابقة فقط.
-- لا يتم إنشاء فحوصات جديدة من خلال النظام الحالي.
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  exam_number TEXT,
  customer_id TEXT NOT NULL
    REFERENCES customers(id)
    ON DELETE CASCADE,
  exam_date TEXT NOT NULL,

  od_sph REAL,
  od_cyl REAL,
  od_axis INTEGER,
  od_add REAL,

  od_prism REAL,
  od_base TEXT,

  os_sph REAL,
  os_cyl REAL,
  os_axis INTEGER,
  os_add REAL,

  os_prism REAL,
  os_base TEXT,

  pd REAL,
  near_pd REAL,

  notes TEXT,
  examiner TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_customer_date
ON exams(customer_id, exam_date DESC);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,

  invoice_number TEXT NOT NULL UNIQUE,

  customer_id TEXT NOT NULL
    REFERENCES customers(id)
    ON DELETE RESTRICT,

  invoice_date TEXT NOT NULL,

  -- بيانات القياسات داخل نفس الفاتورة
  exam_date TEXT,

  od_sph REAL,
  od_cyl REAL,
  od_axis INTEGER,
  od_add REAL,

  os_sph REAL,
  os_cyl REAL,
  os_axis INTEGER,
  os_add REAL,

  pd REAL,
  near_pd REAL,

  examiner TEXT,
  exam_notes TEXT,

  -- الحساب
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

CREATE INDEX IF NOT EXISTS idx_invoices_customer_date
ON invoices(customer_id, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_number
ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoices_date_status
ON invoices(invoice_date, status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,

  invoice_id TEXT NOT NULL
    REFERENCES invoices(id)
    ON DELETE CASCADE,

  description TEXT NOT NULL,

  quantity REAL NOT NULL DEFAULT 1,

  unit_price REAL NOT NULL DEFAULT 0,

  total REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice
ON invoice_items(invoice_id);
`);

const columns = (table: string) =>
  db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;

const hasColumn = (
  table: string,
  column: string,
) =>
  columns(table).some(
    (c) => c.name === column,
  );

function addColumn(
  table: string,
  column: string,
  definition: string,
) {
  if (hasColumn(table, column)) {
    return;
  }

  try {
    db.exec(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
    );
  } catch (error) {
    // SQLite may report a duplicate column if another
    // initialization path added it between the schema check
    // and ALTER TABLE.
    if (
      error instanceof Error &&
      error.message.includes("duplicate column name")
    ) {
      return;
    }

    throw error;
  }
}

/*
 * Migrations from previous versions.
 *
 * These are kept only to make sure an existing
 * database can still be opened safely.
 */

addColumn(
  "exams",
  "exam_number",
  "TEXT",
);

addColumn(
  "invoices",
  "exam_id",
  "TEXT",
);

addColumn(
  "invoices",
  "exam_date",
  "TEXT",
);

addColumn(
  "invoices",
  "od_sph",
  "REAL",
);

addColumn(
  "invoices",
  "od_cyl",
  "REAL",
);

addColumn(
  "invoices",
  "od_axis",
  "INTEGER",
);

addColumn(
  "invoices",
  "od_add",
  "REAL",
);

addColumn(
  "invoices",
  "os_sph",
  "REAL",
);

addColumn(
  "invoices",
  "os_cyl",
  "REAL",
);

addColumn(
  "invoices",
  "os_axis",
  "INTEGER",
);

addColumn(
  "invoices",
  "os_add",
  "REAL",
);

addColumn(
  "invoices",
  "pd",
  "REAL",
);

addColumn(
  "invoices",
  "near_pd",
  "REAL",
);

addColumn(
  "invoices",
  "examiner",
  "TEXT",
);

addColumn(
  "invoices",
  "exam_notes",
  "TEXT",
);

/*
 * Move old exam data into the invoice record.
 *
 * This runs only for invoices that still reference
 * an old exam and have no embedded exam data.
 */
if (hasColumn("invoices", "exam_id")) {
  const legacyRows = db
    .prepare(
      `
      SELECT
        i.id AS invoice_id,

        e.exam_date,

        e.od_sph,
        e.od_cyl,
        e.od_axis,
        e.od_add,

        e.os_sph,
        e.os_cyl,
        e.os_axis,
        e.os_add,

        e.pd,
        e.near_pd,

        e.examiner,
        e.notes AS exam_notes

      FROM invoices i

      JOIN exams e
        ON e.id = i.exam_id

      WHERE
        i.exam_id IS NOT NULL
        AND i.exam_date IS NULL
      `,
    )
    .all() as Array<
      Record<string, unknown>
    >;

  const update = db.prepare(
    `
    UPDATE invoices
    SET
      exam_date = ?,

      od_sph = ?,
      od_cyl = ?,
      od_axis = ?,
      od_add = ?,

      os_sph = ?,
      os_cyl = ?,
      os_axis = ?,
      os_add = ?,

      pd = ?,
      near_pd = ?,

      examiner = ?,
      exam_notes = ?

    WHERE id = ?
    `,
  );

  const transaction = db.transaction(
    (
      rows: Array<Record<string, unknown>>,
    ) => {
      for (const row of rows) {
        update.run(
          row.exam_date,

          row.od_sph,
          row.od_cyl,
          row.od_axis,
          row.od_add,

          row.os_sph,
          row.os_cyl,
          row.os_axis,
          row.os_add,

          row.pd,
          row.near_pd,

          row.examiner,
          row.exam_notes,

          row.invoice_id,
        );
      }
    },
  );

  if (legacyRows.length > 0) {
    transaction(legacyRows);
  }
}

export function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nextNumber(
  prefix: string,
  table: "customers" | "invoices",
  field: string,
) {
  const rows = db
    .prepare(
      `SELECT ${field} AS value
       FROM ${table}
       WHERE ${field} LIKE ?`,
    )
    .all(`${prefix}-%`) as Array<{
      value?: string;
    }>;

  const max = rows.reduce(
    (highest, row) => {
      const number = Number(
        row.value?.match(/(\d+)$/)?.[1] || 0,
      );

      return Math.max(
        highest,
        Number.isFinite(number)
          ? number
          : 0,
      );
    },
    0,
  );

  return `${prefix}-${String(max + 1).padStart(6, "0")}`;
}

export function nextCustomerNumber() {
  return nextNumber(
    "CUS",
    "customers",
    "customer_number",
  );
}

export function nextInvoiceNumber() {
  return nextNumber(
    "INV",
    "invoices",
    "invoice_number",
  );
}

export function getSettings() {
  return db
    .prepare(
      "SELECT * FROM settings WHERE id = 1",
    )
    .get();
}

export function normalizeMoney(
  value: unknown,
) {
  const number = Number(value);

  return Number.isFinite(number) &&
    number >= 0
    ? Math.round(number * 100) / 100
    : 0;
}

export function normalizeOptionalNumber(
  value: unknown,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

export function normalizeOptionalInt(
  value: unknown,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isInteger(number)
    ? number
    : null;
}
