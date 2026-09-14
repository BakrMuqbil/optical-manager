import { db } from "./connection";
import { todayISO } from "@/lib/utils/formatDate";

export function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nextNumber(
  prefix: string,
  table: "customers" | "invoices" | "financial_transactions",
  field: string,
) {
  const rows = db
    .prepare(`SELECT ${field} AS value FROM ${table} WHERE ${field} LIKE ?`)
    .all(`${prefix}-%`) as Array<{ value?: string }>;

  const max = rows.reduce((highest, row) => {
    const number = Number(row.value?.match(/(\d+)$/)?.[1] || 0);
    return Math.max(highest, Number.isFinite(number) ? number : 0);
  }, 0);

  return `${prefix}-${String(max + 1).padStart(6, "0")}`;
}

export function nextCustomerNumber() {
  return nextNumber("CUS", "customers", "customer_number");
}

export function nextInvoiceNumber(invoiceDate = todayISO()) {
  const year = invoiceDate.slice(0, 4);
  const rows = db.prepare("SELECT invoice_number FROM invoices WHERE invoice_number LIKE ?").all(`${year}-%`) as Array<{ invoice_number?: string }>;
  const max = rows.reduce((highest, row) => {
    const number = Number(row.invoice_number?.match(/^(?:\d{4})-(\d+)$/)?.[1] || 0);
    return Math.max(highest, Number.isFinite(number) ? number : 0);
  }, 0);
  return `${year}-${String(max + 1).padStart(4, "0")}`;
}

export function nextTransactionNumber() {
  return nextNumber("TX", "financial_transactions", "transaction_number");
}

export function normalizeMoney(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? Math.round(number * 100) / 100
    : 0;
}

export function normalizeOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeOptionalInt(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}
