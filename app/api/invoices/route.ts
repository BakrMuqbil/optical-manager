import { NextResponse } from "next/server";
import {
  db,
  nextInvoiceNumber,
  normalizeMoney,
  uid,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  const like = `%${q}%`;

  const rows = db
    .prepare(
      `SELECT i.*, c.name customer_name, c.phone customer_phone,
              c.customer_number, e.exam_number
       FROM invoices i
       JOIN customers c ON c.id=i.customer_id
       LEFT JOIN exams e ON e.id=i.exam_id
       WHERE (?='' OR i.invoice_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR e.exam_number LIKE ?)
       ORDER BY i.invoice_date DESC, i.created_at DESC`,
    )
    .all(q, like, like, like, like);

  return NextResponse.json({ success: true, data: rows });
}

type RawItem = {
  description?: string;
  quantity?: number | string;
  unitPrice?: number | string;
};

function cleanItems(input: unknown) {
  const items = Array.isArray(input) ? (input as RawItem[]) : [];

  return items.map((x) => {
    const description = String(x.description ?? "").trim();
    const quantity = Number(x.quantity);
    const unitPrice = normalizeMoney(x.unitPrice);

    return {
      description,
      quantity,
      unitPrice,
      total: normalizeMoney(quantity * unitPrice),
    };
  });
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const customerId = String(b.customerId || "");

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

    if (!clean.length) {
      return NextResponse.json(
        { success: false, error: "أضف بندًا واحدًا على الأقل" },
        { status: 400 },
      );
    }

    if (
      clean.some(
        (x) =>
          !x.description ||
          !Number.isFinite(x.quantity) ||
          x.quantity <= 0,
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
        .prepare(
          "SELECT id FROM exams WHERE id=? AND customer_id=?",
        )
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
      b.status === "CANCELLED"
        ? "CANCELLED"
        : remaining === 0
          ? "PAID"
          : paid > 0
            ? "PARTIALLY_PAID"
            : "UNPAID";

    const id = uid("inv");
    const invoiceNumber = nextInvoiceNumber();
    const date =
      b.invoiceDate || new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO invoices
        (id,invoice_number,customer_id,exam_id,invoice_date,subtotal,discount,total,paid,remaining,status,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        id,
        invoiceNumber,
        customerId,
        examId || null,
        date,
        subtotal,
        discount,
        total,
        paid,
        remaining,
        status,
        String(b.notes ?? "").trim() || null,
        now,
        now,
      );

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

    return NextResponse.json(
      { success: true, data: { id, invoiceNumber } },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "تعذر إنشاء الفاتورة" },
      { status: 500 },
    );
  }
}
