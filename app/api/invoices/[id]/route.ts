import { NextResponse } from "next/server";
import { db, normalizeMoney, normalizeOptionalInt, normalizeOptionalNumber, uid } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

function invoiceQuery() {
  return `SELECT i.*, c.name customer_name, c.phone customer_phone,
    c.address customer_address, c.customer_number
    FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.id=?`;
}

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const invoice = db.prepare(invoiceQuery()).get(id);
  if (!invoice) return NextResponse.json({ success: false, error: "الفاتورة غير موجودة" }, { status: 404 });
  const items = db.prepare("SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY rowid ASC").all(id);
  return NextResponse.json({ success: true, data: { invoice, items } });
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const b = await req.json();
    const current = db.prepare("SELECT id,customer_id,status FROM invoices WHERE id=?").get(id) as { id:string; customer_id:string; status:string } | undefined;
    if (!current) return NextResponse.json({ success:false,error:"الفاتورة غير موجودة" }, { status:404 });
    if (current.status === "CANCELLED") return NextResponse.json({ success:false,error:"لا يمكن تعديل فاتورة ملغاة" }, { status:400 });

    const name = String(b.customerName ?? "").trim();
    const phone = String(b.customerPhone ?? "").trim();
    if (!name) return NextResponse.json({ success:false,error:"اسم العميل مطلوب" }, { status:400 });
    if (!phone) return NextResponse.json({ success:false,error:"رقم الجوال مطلوب" }, { status:400 });

    const price = normalizeMoney(b.price);
    if (price <= 0) return NextResponse.json({ success:false,error:"السعر يجب أن يكون أكبر من صفر" }, { status:400 });
    const discount = Math.min(normalizeMoney(b.discount), price);
    const total = normalizeMoney(price - discount);
    const paid = Math.min(normalizeMoney(b.paid), total);
    const remaining = normalizeMoney(total - paid);
    const status = remaining === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      const existing = db.prepare("SELECT id FROM customers WHERE phone=? AND status='ACTIVE' AND id<>? ORDER BY created_at DESC LIMIT 1").get(phone, current.customer_id) as { id:string } | undefined;
      let customerId = current.customer_id;
      if (existing) customerId = existing.id;
      db.prepare("UPDATE customers SET name=?,phone=?,updated_at=? WHERE id=?").run(name, phone, now, customerId);

      db.prepare(`UPDATE invoices SET customer_id=?,invoice_date=?,exam_date=?,
        od_sph=?,od_cyl=?,od_axis=?,od_add=?,os_sph=?,os_cyl=?,os_axis=?,os_add=?,
        pd=?,near_pd=?,examiner=?,exam_notes=?,subtotal=?,discount=?,total=?,paid=?,remaining=?,status=?,notes=?,updated_at=? WHERE id=?`).run(
        customerId,
        String(b.invoiceDate || "").trim() || new Date().toISOString().slice(0,10),
        String(b.examDate || "").trim() || null,
        normalizeOptionalNumber(b.odSph), normalizeOptionalNumber(b.odCyl), normalizeOptionalInt(b.odAxis), normalizeOptionalNumber(b.odAdd),
        normalizeOptionalNumber(b.osSph), normalizeOptionalNumber(b.osCyl), normalizeOptionalInt(b.osAxis), normalizeOptionalNumber(b.osAdd),
        normalizeOptionalNumber(b.pd), normalizeOptionalNumber(b.nearPd),
        String(b.examiner || "").trim() || null,
        String(b.notes || "").trim() || null,
        price, discount, total, paid, remaining, status,
        String(b.notes || "").trim() || null, now, id,
      );
      db.prepare("DELETE FROM invoice_items WHERE invoice_id=?").run(id);
      db.prepare("INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,total) VALUES (?,?,?,?,?,?)")
        .run(uid("item"), id, "الخدمة", 1, price, price);
    });

    tx();
    return GET(req, { params });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success:false,error:"تعذر تعديل الفاتورة" }, { status:500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const result = db.prepare("DELETE FROM invoices WHERE id=?").run(id);
    if (!result.changes) return NextResponse.json({ success:false,error:"الفاتورة غير موجودة" }, { status:404 });
    return NextResponse.json({ success:true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success:false,error:"تعذر حذف الفاتورة" }, { status:500 });
  }
}
