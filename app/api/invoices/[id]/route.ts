import { NextResponse } from "next/server";
import { db, normalizeMoney, uid } from "@/lib/db";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

function invoiceQuery() {
  return `SELECT i.*, c.name customer_name, c.phone customer_phone,
    c.address customer_address, c.customer_number,
    e.exam_number, e.exam_date, e.od_sph, e.od_cyl, e.od_axis, e.od_add,
    e.od_prism, e.od_base, e.os_sph, e.os_cyl, e.os_axis, e.os_add,
    e.os_prism, e.os_base, e.pd, e.near_pd, e.examiner, e.notes exam_notes
    FROM invoices i
    JOIN customers c ON c.id=i.customer_id
    LEFT JOIN exams e ON e.id=i.exam_id
    WHERE i.id=?`;
}

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const invoice = db.prepare(invoiceQuery()).get(id);

  if (!invoice) {
    return NextResponse.json(
      { success: false, error: "الفاتورة غير موجودة" },
      { status: 404 },
    );
  }

  const items = db
    .prepare(
      "SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY rowid ASC",
    )
    .all(id);

  return NextResponse.json({ success: true, data: { invoice, items } });
}

function cleanItems(input: unknown) {
  const items = Array.isArray(input) ? input : [];

  return items.map((x) => {
    const item = x as {
      description?: string;
      quantity?: number | string;
      unitPrice?: number | string;
      unit_price?: number | string;
    };
    const description = String(item.description ?? "").trim();
    const quantity = Number(item.quantity);
    const unitPrice = normalizeMoney(item.unitPrice ?? item.unit_price);

    return {
      description,
      quantity,
      unitPrice,
      total: normalizeMoney(quantity * unitPrice),
    };
  });
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const b = await req.json();

    const current = db
      .prepare("SELECT id, customer_id, status FROM invoices WHERE id=?")
      .get(id) as
      | { id: string; customer_id: string; status: string }
      | undefined;

    if (!current) {
      return NextResponse.json(
        { success: false, error: "الفاتورة غير موجودة" },
        { status: 404 },
      );
    }

    if (current.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "لا يمكن تعديل فاتورة ملغاة" },
        { status: 400 },
      );
    }

    const customerId = String(b.customerId || current.customer_id);
    const customer = db
      .prepare("SELECT id FROM customers WHERE id=? AND status='ACTIVE'")
      .get(customerId);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "العميل غير موجود" },
        { status: 404 },
      );
    }

    const clean = cleanItems(b.items);
    if (
      !clean.length ||
      clean.some(
        (x) =>
          !x.description || !Number.isFinite(x.quantity) || x.quantity <= 0,
      )
    ) {
      return NextResponse.json(
        { success: false, error: "تحقق من بنود الفاتورة" },
        { status: 400 },
      );
    }

    const examId = String(b.examId || "");
    if (examId) {
      const exam = db
        .prepare("SELECT id FROM exams WHERE id=? AND customer_id=?")
        .get(examId, customerId);
      if (!exam) {
        return NextResponse.json(
          { success: false, error: "الفحص المحدد لا يخص هذا العميل" },
          { status: 400 },
        );
      }
    }

    const subtotal = normalizeMoney(
      clean.reduce((sum: number, x) => sum + x.total, 0),
    );
    const discount = Math.min(normalizeMoney(b.discount), subtotal);
    const total = normalizeMoney(subtotal - discount);
    const paid = Math.min(normalizeMoney(b.paid), total);
    const remaining = normalizeMoney(total - paid);
    const status =
      remaining === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";
    const now = new Date().toISOString();
    const invoiceDate =
      String(b.invoiceDate || "").trim() ||
      new Date().toISOString().slice(0, 10);

    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE invoices SET customer_id=?,exam_id=?,invoice_date=?,
         subtotal=?,discount=?,total=?,paid=?,remaining=?,status=?,notes=?,updated_at=?
         WHERE id=?`,
      ).run(
        customerId,
        examId || null,
        invoiceDate,
        subtotal,
        discount,
        total,
        paid,
        remaining,
        status,
        String(b.notes ?? "").trim() || null,
        now,
        id,
      );

      db.prepare("DELETE FROM invoice_items WHERE invoice_id=?").run(id);

      const stmt = db.prepare(
        `INSERT INTO invoice_items
        (id,invoice_id,description,quantity,unit_price,total)
        VALUES (?,?,?,?,?,?)`,
      );

      for (const x of clean) {
        stmt.run(
          uid("item"),
          id,
          x.description,
          x.quantity,
          x.unitPrice,
          x.total,
        );
      }
    });

    tx();
    return GET(req, { params });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "تعذر تعديل الفاتورة" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const invoice = db.prepare("SELECT id FROM invoices WHERE id=?").get(id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "الفاتورة غير موجودة" },
        { status: 404 },
      );
    }

    db.prepare("DELETE FROM invoices WHERE id=?").run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "تعذر حذف الفاتورة" },
      { status: 500 },
    );
  }
}
