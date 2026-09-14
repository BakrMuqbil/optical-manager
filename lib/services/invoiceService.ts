import { db } from "@/lib/db";

export function listInvoices(params: {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const q = params.q?.trim() || "";
  const status = params.status?.trim() || "";
  const from = params.from?.trim() || "";
  const to = params.to?.trim() || "";
  const like = `%${q}%`;
  const statusSql =
    status === "DUE"
      ? "(i.status IN ('UNPAID','PARTIALLY_PAID'))"
      : "(?='' OR i.status=?)";
  const statusArgs = status === "DUE" ? [] : [status, status];
  const searchArgs = [q, like, like, like];
  const rangeArgs = [from, from, to, to];

  const select = `
    FROM invoices i
    JOIN customers c ON c.id=i.customer_id
    WHERE (?='' OR i.invoice_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)
      AND ${statusSql}
      AND (?='' OR i.invoice_date>=?)
      AND (?='' OR i.invoice_date<=?)`;

  const rows = db
    .prepare(`
      SELECT i.*, c.name customer_name, c.phone customer_phone,
        c.address customer_address, c.customer_number
      ${select}
      ORDER BY i.invoice_date DESC, i.created_at DESC`)
    .all(...searchArgs, ...statusArgs, ...rangeArgs);

  const summary = db
    .prepare(`
      SELECT COUNT(*) count,
        COALESCE(SUM(i.total),0) total,
        COALESCE(SUM(i.paid),0) paid,
        COALESCE(SUM(i.remaining),0) remaining
      ${select}`)
    .get(...searchArgs, ...statusArgs, ...rangeArgs) as {
      count: number;
      total: number;
      paid: number;
      remaining: number;
    };

  return { rows, summary };
}
