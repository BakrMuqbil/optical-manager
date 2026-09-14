import { db, normalizeMoney, uid } from "@/lib/db";
import { todayISO } from "@/lib/utils/formatDate";

type PeriodType = "MONTH" | "YEAR";

export type PeriodClosure = {
  id: string;
  period_type: PeriodType;
  period_key: string;
  from_date: string;
  to_date: string;
  opened_at: string;
  closed_at?: string | null;
  report_printed_at?: string | null;
  opening_balance: number;
  total_sales: number;
  total_collections: number;
  total_expenses: number;
  expected_cash: number;
  actual_cash?: number | null;
  difference: number;
  status: "OPEN" | "CLOSED";
};

export type MonthlyReportRow = {
  key: string; from: string; to: string; sales: number; collections: number; expenses: number; invoiceCount: number;
};

export type ReportData = {
  invoiceCount: number; sales: number; discount: number; collections: number; expenses: number;
  oldDebtCollection: number; newInvoicePayments: number; remainingDebts: number; openingBalance: number;
  expectedCash: number; monthly: MonthlyReportRow[];
};

export type ReportPeriod = {
  type: PeriodType;
  key: string;
  from: string;
  to: string;
  label: string;
};

function pad2(n: number) { return String(n).padStart(2, "0"); }

export function monthPeriod(year: number, month: number): ReportPeriod {
  const from = `${year}-${pad2(month)}-01`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${pad2(month)}-${pad2(last)}`;
  return { type: "MONTH", key: `${year}-${pad2(month)}`, from, to, label: `شهر ${new Intl.DateTimeFormat("ar-EG", { month: "long" }).format(new Date(year, month - 1, 1))} ${year}` };
}

export function yearPeriod(year: number): ReportPeriod {
  return { type: "YEAR", key: String(year), from: `${year}-01-01`, to: `${year}-12-31`, label: `السنة المالية ${year}` };
}

export function periodFromKey(type: PeriodType, key: string): ReportPeriod {
  if (type === "MONTH") {
    const m = /^(\d{4})-(\d{2})$/.exec(key);
    if (!m) throw new Error("مفتاح الشهر غير صالح");
    return monthPeriod(Number(m[1]), Number(m[2]));
  }
  if (!/^\d{4}$/.test(key)) throw new Error("مفتاح السنة غير صالح");
  return yearPeriod(Number(key));
}

export function getReportData(period: ReportPeriod, openingBalance = 0): ReportData {
  const sales = db.prepare(`SELECT COUNT(*) count, COALESCE(SUM(total),0) total, COALESCE(SUM(discount),0) discount FROM invoices WHERE invoice_date BETWEEN ? AND ? AND status <> 'CANCELLED'`).get(period.from, period.to) as { count: number; total: number; discount: number };
  const collections = db.prepare(`SELECT COALESCE(SUM(amount),0) total FROM financial_transactions WHERE transaction_date BETWEEN ? AND ? AND type='PAYMENT' AND status='ACTIVE'`).get(period.from, period.to) as { total: number };
  const expenses = db.prepare(`SELECT COALESCE(SUM(amount),0) total FROM financial_transactions WHERE transaction_date BETWEEN ? AND ? AND type='EXPENSE' AND status='ACTIVE'`).get(period.from, period.to) as { total: number };
  const oldDebt = db.prepare(`SELECT COALESCE(SUM(t.amount),0) total FROM financial_transactions t JOIN invoices i ON i.id=t.invoice_id WHERE t.transaction_date BETWEEN ? AND ? AND t.type='PAYMENT' AND t.status='ACTIVE' AND i.status<>'CANCELLED' AND i.invoice_date < ?`).get(period.from, period.to, period.from) as { total: number };
  const newInvoicePayments = db.prepare(`SELECT COALESCE(SUM(t.amount),0) total FROM financial_transactions t JOIN invoices i ON i.id=t.invoice_id WHERE t.transaction_date BETWEEN ? AND ? AND t.type='PAYMENT' AND t.status='ACTIVE' AND i.status<>'CANCELLED' AND i.invoice_date BETWEEN ? AND ?`).get(period.from, period.to, period.from, period.to) as { total: number };
  const remaining = db.prepare(`SELECT COALESCE(SUM(remaining),0) total FROM invoices WHERE invoice_date <= ? AND status IN ('UNPAID','PARTIALLY_PAID')`).get(period.to) as { total: number };
  const expectedCash = normalizeMoney(Number(openingBalance) + Number(collections.total) - Number(expenses.total));
  const monthly = period.type === "YEAR" ? Array.from({ length: 12 }, (_, i) => {
    const m = monthPeriod(Number(period.key), i + 1);
    const mc = getReportData(m, 0);
    return { key: m.key, from: m.from, to: m.to, sales: mc.sales, collections: mc.collections, expenses: mc.expenses, invoiceCount: mc.invoiceCount };
  }) : [];
  return {
    invoiceCount: Number(sales.count || 0), sales: normalizeMoney(sales.total), discount: normalizeMoney(sales.discount),
    collections: normalizeMoney(collections.total), expenses: normalizeMoney(expenses.total), oldDebtCollection: normalizeMoney(oldDebt.total),
    newInvoicePayments: normalizeMoney(newInvoicePayments.total), remainingDebts: normalizeMoney(remaining.total), openingBalance: normalizeMoney(openingBalance), expectedCash,
    monthly,
  };
}

export function getPeriodClosure(type: PeriodType, key: string) {
  return db.prepare(`SELECT * FROM financial_period_closures WHERE period_type=? AND period_key=?`).get(type, key) as PeriodClosure | undefined;
}

export function getOpeningBalance(type: PeriodType, key: string) {
  const p = periodFromKey(type, key);
  const previous = type === "MONTH"
    ? (() => { const d = new Date(`${p.from}T00:00:00`); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`; })()
    : String(Number(key) - 1);
  const previousClosure = getPeriodClosure(type, previous);
  if (previousClosure?.actual_cash != null) return normalizeMoney(previousClosure.actual_cash);
  if (type === "MONTH") {
    const prior = db.prepare(`SELECT actual_cash FROM financial_period_closures WHERE period_type='YEAR' AND period_key=?`).get(String(Number(key.slice(0,4))-1)) as { actual_cash?: number } | undefined;
    if (prior?.actual_cash != null) return normalizeMoney(prior.actual_cash);
  }
  return 0;
}

export function getPendingPeriods(today: string) {
  const [year, month] = today.split("-").map(Number);
  const minRow = db.prepare(`SELECT MIN(d) d FROM (SELECT MIN(invoice_date) d FROM invoices UNION ALL SELECT MIN(transaction_date) d FROM financial_transactions)`).get() as { d?: string | null };
  if (!minRow?.d) return [];
  const [startYear, startMonth] = minRow.d.slice(0, 7).split("-").map(Number);
  const pending: ReportPeriod[] = [];
  for (let y = startYear; y <= year; y++) {
    const firstMonth = y === startYear ? startMonth : 1;
    const lastMonth = y < year ? 12 : month - 1;
    for (let m = firstMonth; m <= lastMonth; m++) {
      const p = monthPeriod(y, m);
      const activity = db.prepare(`SELECT EXISTS(SELECT 1 FROM invoices WHERE invoice_date BETWEEN ? AND ?) OR EXISTS(SELECT 1 FROM financial_transactions WHERE transaction_date BETWEEN ? AND ?) AS active`).get(p.from, p.to, p.from, p.to) as { active: number };
      if (!activity.active) continue;
      const c = getPeriodClosure("MONTH", p.key);
      if (!c || (c.status !== "CLOSED" && !c.report_printed_at)) pending.push(p);
    }
  }
  const previousYear = yearPeriod(year - 1);
  const annualActivity = db.prepare(`SELECT EXISTS(SELECT 1 FROM invoices WHERE invoice_date BETWEEN ? AND ?) OR EXISTS(SELECT 1 FROM financial_transactions WHERE transaction_date BETWEEN ? AND ?) AS active`).get(previousYear.from, previousYear.to, previousYear.from, previousYear.to) as { active: number };
  const annual = getPeriodClosure("YEAR", previousYear.key);
  if (annualActivity.active && (!annual || (annual.status !== "CLOSED" && !annual.report_printed_at))) pending.push(previousYear);
  return pending.slice(-24);
}

export function closePeriod(type: PeriodType, key: string, actualCash: number, openingBalance?: number) {
  const period = periodFromKey(type, key);
  const existing = getPeriodClosure(type, key);
  if (existing?.status === "CLOSED") throw new Error("الفترة مغلقة مسبقًا");
  const today = todayISO();
  if (period.to >= today) throw new Error("لا يمكن إغلاق فترة لم تكتمل بعد");
  if (type === "YEAR") {
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${key}-${pad2(m)}`;
      const monthPeriodData = monthPeriod(Number(key), m);
      const activity = db.prepare(`SELECT EXISTS(SELECT 1 FROM invoices WHERE invoice_date BETWEEN ? AND ?) OR EXISTS(SELECT 1 FROM financial_transactions WHERE transaction_date BETWEEN ? AND ?) AS active`).get(monthPeriodData.from, monthPeriodData.to, monthPeriodData.from, monthPeriodData.to) as { active: number };
      if (!activity.active) continue;
      const month = getPeriodClosure("MONTH", monthKey);
      if (month?.status !== "CLOSED") throw new Error(`لا يمكن إغلاق السنة قبل إغلاق الشهر ${monthKey}`);
    }
  }
  const opening = openingBalance == null ? getOpeningBalance(type, key) : normalizeMoney(openingBalance);
  const report = getReportData(period, opening);
  const actual = normalizeMoney(actualCash);
  const difference = normalizeMoney(actual - report.expectedCash);
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO financial_period_closures (id,period_type,period_key,from_date,to_date,opened_at,closed_at,opening_balance,total_sales,total_collections,total_expenses,expected_cash,actual_cash,difference,status,report_printed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,? ,'CLOSED',COALESCE(?,NULL)) ON CONFLICT(period_type,period_key) DO UPDATE SET closed_at=excluded.closed_at,opening_balance=excluded.opening_balance,total_sales=excluded.total_sales,total_collections=excluded.total_collections,total_expenses=excluded.total_expenses,expected_cash=excluded.expected_cash,actual_cash=excluded.actual_cash,difference=excluded.difference,status='CLOSED'`).run(uid("pcls"), type, key, period.from, period.to, now, now, opening, report.sales, report.collections, report.expenses, report.expectedCash, actual, difference, null);
  return { ...report, actualCash: actual, difference };
}

export function markReportPrinted(type: PeriodType, key: string) {
  const period = periodFromKey(type, key);
  const now = new Date().toISOString();
  const opening = getOpeningBalance(type, key);
  db.prepare(`INSERT INTO financial_period_closures (id,period_type,period_key,from_date,to_date,opened_at,report_printed_at,status,opening_balance,total_sales,total_collections,total_expenses,expected_cash,difference) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0) ON CONFLICT(period_type,period_key) DO UPDATE SET report_printed_at=excluded.report_printed_at`).run(uid("pcls"), type, key, period.from, period.to, now, now, "OPEN", opening, 0, 0, 0, 0);
}

export function listClosures(type: PeriodType): PeriodClosure[] {
  return db.prepare(`SELECT * FROM financial_period_closures WHERE period_type=? ORDER BY period_key DESC`).all(type) as PeriodClosure[];
}
