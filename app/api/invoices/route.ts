import { NextResponse } from "next/server";
import {
  db,
  nextCustomerNumber,
  nextInvoiceNumber,
  normalizeMoney,
  normalizeOptionalInt,
  normalizeOptionalNumber,
  uid,
} from "@/lib/db";

export const dynamic = "force-dynamic";

function invoiceSelect() {
  return `SELECT i.*, c.name customer_name, c.phone customer_phone,
    c.address customer_address, c.customer_number
    FROM invoices i JOIN customers c ON c.id=i.customer_id`;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = params.get("q")?.trim() || "";
  const status = params.get("status")?.trim() || "";
  const statusSql = status === "DUE" ? "(i.status IN ('UNPAID','PARTIALLY_PAID'))" : "(?='' OR i.status=?)";
  const from = params.get("from")?.trim() || "";
  const to = params.get("to")?.trim() || "";
  const like = `%${q}%`;

  const rows = db.prepare(`${invoiceSelect()}
    WHERE (?='' OR i.invoice_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)
      AND ${statusSql}
      AND (?='' OR i.invoice_date>=?)
      AND (?='' OR i.invoice_date<=?)
    ORDER BY i.invoice_date DESC, i.created_at DESC`)
    .all(...(status === "DUE" ? [q,like,like,like] : [q,like,like,like,status,status]), from, from, to, to);

  const summary = db.prepare(`SELECT
      COUNT(*) count,
      COALESCE(SUM(i.total),0) total,
      COALESCE(SUM(i.paid),0) paid,
      COALESCE(SUM(i.remaining),0) remaining
    FROM invoices i JOIN customers c ON c.id=i.customer_id
    WHERE (?='' OR i.invoice_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)
      AND ${statusSql}
      AND (?='' OR i.invoice_date>=?)
      AND (?='' OR i.invoice_date<=?)`)
    .get(...(status === "DUE" ? [q,like,like,like] : [q,like,like,like,status,status]), from, from, to, to) as {
      count: number; total: number; paid: number; remaining: number;
    };

  return NextResponse.json({ success: true, data: rows, summary });
}

type InvoiceBody = {
  customerName?: string;
  customerPhone?: string;
  invoiceDate?: string;
  examDate?: string;
  examiner?: string;
  odSph?: unknown; odCyl?: unknown; odAxis?: unknown; odAdd?: unknown;
  osSph?: unknown; osCyl?: unknown; osAxis?: unknown; osAdd?: unknown;
  pd?: unknown; nearPd?: unknown;
  price?: unknown;
  discount?: unknown;
  paid?: unknown;
  notes?: string;
};

function cleanBody(b: InvoiceBody) {
  const price = normalizeMoney(b.price);
  const discount = Math.min(normalizeMoney(b.discount), price);
  const total = normalizeMoney(price - discount);
  const paid = Math.min(normalizeMoney(b.paid), total);
  const remaining = normalizeMoney(total - paid);
  return {
    customerName: String(b.customerName ?? "").trim(),
    customerPhone: String(b.customerPhone ?? "").trim(),
    invoiceDate: String(b.invoiceDate ?? "").trim() || new Date().toISOString().slice(0, 10),
    examDate: String(b.examDate ?? "").trim() || null,
    examiner: String(b.examiner ?? "").trim() || null,
    odSph: normalizeOptionalNumber(b.odSph), odCyl: normalizeOptionalNumber(b.odCyl), odAxis: normalizeOptionalInt(b.odAxis), odAdd: normalizeOptionalNumber(b.odAdd),
    osSph: normalizeOptionalNumber(b.osSph), osCyl: normalizeOptionalNumber(b.osCyl), osAxis: normalizeOptionalInt(b.osAxis), osAdd: normalizeOptionalNumber(b.osAdd),
    pd: normalizeOptionalNumber(b.pd), nearPd: normalizeOptionalNumber(b.nearPd),
    price, discount, total, paid, remaining,
    status: remaining === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID",
    notes: String(b.notes ?? "").trim() || null,
  };
}

function getOrCreateCustomer(name: string, phone: string) {
  const existing = phone
    ? db.prepare("SELECT id FROM customers WHERE phone=? AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1").get(phone) as { id: string } | undefined
    : undefined;

  const now = new Date().toISOString();
  if (existing) {
    db.prepare("UPDATE customers SET name=?, updated_at=? WHERE id=?").run(name, now, existing.id);
    return existing.id;
  }

  const id = uid("cust");
  db.prepare(`INSERT INTO customers
    (id,customer_number,name,phone,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?)`).run(id, nextCustomerNumber(), name, phone || null, "ACTIVE", now, now);
  return id;
}

export async function POST(req: Request) {
  try {
    const b = await req.json() as InvoiceBody;
    const clean = cleanBody(b);
    if (!clean.customerName) return NextResponse.json({ success: false, error: "اسم العميل مطلوب" }, { status: 400 });
    if (!clean.customerPhone) return NextResponse.json({ success: false, error: "رقم الجوال مطلوب" }, { status: 400 });
    if (clean.price <= 0) return NextResponse.json({ success: false, error: "السعر يجب أن يكون أكبر من صفر" }, { status: 400 });

    const id = uid("inv");
    const invoiceNumber = nextInvoiceNumber();
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      const customerId = getOrCreateCustomer(clean.customerName, clean.customerPhone);
      db.prepare(`INSERT INTO invoices
        (id,invoice_number,customer_id,invoice_date,exam_date,
         od_sph,od_cyl,od_axis,od_add,os_sph,os_cyl,os_axis,os_add,
         pd,near_pd,examiner,exam_notes,subtotal,discount,total,paid,remaining,status,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id, invoiceNumber, customerId, clean.invoiceDate, clean.examDate,
        clean.odSph, clean.odCyl, clean.odAxis, clean.odAdd,
        clean.osSph, clean.osCyl, clean.osAxis, clean.osAdd,
        clean.pd, clean.nearPd, clean.examiner, clean.notes,
        clean.price, clean.discount, clean.total, clean.paid, clean.remaining, clean.status, clean.notes, now, now,
      );
      db.prepare(`INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,total) VALUES (?,?,?,?,?,?)`)
        .run(uid("item"), id, "الخدمة", 1, clean.price, clean.price);
    });
    tx();
    return NextResponse.json({ success: true, data: { id, invoiceNumber } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "تعذر حفظ الفاتورة" }, { status: 500 });
  }
}
