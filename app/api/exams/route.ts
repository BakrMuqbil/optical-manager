import { NextResponse } from "next/server";
import {
  db,
  nextExamNumber,
  normalizeOptionalInt,
  normalizeOptionalNumber,
  uid,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const customerId = params.get("customerId");

  const rows = customerId
    ? db
        .prepare(
          `SELECT e.*, c.name customer_name, c.phone customer_phone, c.customer_number
           FROM exams e
           JOIN customers c ON c.id=e.customer_id
           WHERE e.customer_id=?
           ORDER BY e.exam_date DESC, e.created_at DESC`,
        )
        .all(customerId)
    : db
        .prepare(
          `SELECT e.*, c.name customer_name, c.phone customer_phone, c.customer_number
           FROM exams e
           JOIN customers c ON c.id=e.customer_id
           WHERE c.status='ACTIVE'
           ORDER BY e.exam_date DESC, e.created_at DESC`,
        )
        .all();

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const customerId = String(b.customerId || "");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "العميل مطلوب" },
        { status: 400 },
      );
    }

    const customer = db
      .prepare("SELECT id FROM customers WHERE id=? AND status='ACTIVE'")
      .get(customerId);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "العميل غير موجود" },
        { status: 404 },
      );
    }

    const id = uid("exam");
    const examNumber = nextExamNumber();
    const date = b.examDate || new Date().toISOString().slice(0, 10);

    db.prepare(
      `INSERT INTO exams
      (id,exam_number,customer_id,exam_date,
       od_sph,od_cyl,od_axis,od_add,od_prism,od_base,
       os_sph,os_cyl,os_axis,os_add,os_prism,os_base,
       pd,near_pd,notes,examiner)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      examNumber,
      customerId,
      date,
      normalizeOptionalNumber(b.odSph),
      normalizeOptionalNumber(b.odCyl),
      normalizeOptionalInt(b.odAxis),
      normalizeOptionalNumber(b.odAdd),
      normalizeOptionalNumber(b.odPrism),
      b.odBase || null,
      normalizeOptionalNumber(b.osSph),
      normalizeOptionalNumber(b.osCyl),
      normalizeOptionalInt(b.osAxis),
      normalizeOptionalNumber(b.osAdd),
      normalizeOptionalNumber(b.osPrism),
      b.osBase || null,
      normalizeOptionalNumber(b.pd),
      normalizeOptionalNumber(b.nearPd),
      b.notes?.trim() || null,
      b.examiner?.trim() || null,
    );

    return NextResponse.json(
      { success: true, data: { id, examNumber } },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "تعذر حفظ الفحص" },
      { status: 500 },
    );
  }
}
