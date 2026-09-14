import type Database from "better-sqlite3";

export function initializeSchema(db: Database.Database) {
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
  exam_number TEXT,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  exam_date TEXT NOT NULL,
  od_sph REAL, od_cyl REAL, od_axis INTEGER, od_add REAL,
  od_prism REAL, od_base TEXT,
  os_sph REAL, os_cyl REAL, os_axis INTEGER, os_add REAL,
  os_prism REAL, os_base TEXT,
  pd REAL, near_pd REAL,
  notes TEXT, examiner TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exams_customer_date ON exams(customer_id, exam_date DESC);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_date TEXT NOT NULL,
  exam_date TEXT,
  od_sph REAL, od_cyl REAL, od_axis INTEGER, od_add REAL,
  os_sph REAL, os_cyl REAL, os_axis INTEGER, os_add REAL,
  pd REAL, near_pd REAL,
  examiner TEXT, exam_notes TEXT,
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
CREATE INDEX IF NOT EXISTS idx_invoices_date_status ON invoices(invoice_date, status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  transaction_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type TEXT NOT NULL CHECK(type IN ('PAYMENT','EXPENSE')),
  amount REAL NOT NULL DEFAULT 0,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE RESTRICT,
  customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
  description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);
CREATE INDEX IF NOT EXISTS idx_ft_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ft_invoice ON financial_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ft_customer ON financial_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_ft_type ON financial_transactions(type);

CREATE TABLE IF NOT EXISTS financial_period_closures (
  id TEXT PRIMARY KEY,
  period_type TEXT NOT NULL CHECK(period_type IN ('MONTH','YEAR')),
  period_key TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  report_printed_at TEXT,
  opening_balance REAL NOT NULL DEFAULT 0,
  total_sales REAL NOT NULL DEFAULT 0,
  total_collections REAL NOT NULL DEFAULT 0,
  total_expenses REAL NOT NULL DEFAULT 0,
  expected_cash REAL NOT NULL DEFAULT 0,
  actual_cash REAL,
  difference REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')),
  UNIQUE(period_type, period_key)
);
CREATE INDEX IF NOT EXISTS idx_period_closures_key ON financial_period_closures(period_type, period_key);

CREATE TABLE IF NOT EXISTS cash_closures (
  id TEXT PRIMARY KEY,
  business_date TEXT NOT NULL UNIQUE,
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  opening_balance REAL NOT NULL DEFAULT 0,
  total_sales REAL NOT NULL DEFAULT 0,
  total_collections REAL NOT NULL DEFAULT 0,
  total_expenses REAL NOT NULL DEFAULT 0,
  expected_cash REAL NOT NULL DEFAULT 0,
  actual_cash REAL,
  difference REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED'))
);
`);
}
