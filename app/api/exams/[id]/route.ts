import { NextResponse } from "next/server";
import {
  db,
  normalizeOptionalInt,
  normalizeOptionalNumber,
} from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const getExam = (id: string) =>
  db
    .prepare(
      `SELECT e.*, c.name customer_name, c.phone customer_phone, c.customer_number
       FROM exams e JOIN customers c ON c.id=e.customer_id WHERE e.id=?`,
    )
    .get(id);

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const row = getExam(id);

  return row
    ? NextResponse.json({ success: true, data: row })
    : NextResponse.json(
        { success: false, error: "الفحص غير موجود" },
        { status: 404 },
      );
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const b = await req.json();
    const current = db
      .prepare("SELECT id, customer_id FROM exams WHERE id=?")
      .get(id) as { id: string; customer_id: string } | undefined;

    if (!current) {
      return NextResponse.json(
        { success: false, error: "الفحص غير موجود" },
        { status: 404 },
      );
    }

    const date = String(b.examDate || new Date().toISOString().slice(0, 10));

    db.prepare(
      `UPDATE exams SET exam_date=?,
       od_sph=?,od_cyl=?,od_axis=?,od_add=?,od_prism=?,od_base=?,
       os_sph=?,os_cyl=?,os_axis=?,os_add=?,os_prism=?,os_base=?,
       pd=?,near_pd=?,notes=?,examiner=?,updated_at=?
       WHERE id=?`,
    ).run(
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
      new Date().toISOString(),
      id,
    );

    return GET(req, { params });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "تعذر تعديل الفحص" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const exam = db
      .prepare("SELECT id FROM exams WHERE id=?")
      .get(id) as { id: string } | undefined;

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "الفحص غير موجود" },
        { status: 404 },
      );
    }

    // Invoices keep their history; removing an exam only clears its optional link.
    const linked = db
      .prepare("SELECT COUNT(*) AS count FROM invoices WHERE exam_id=?")
      .get(id) as { count: number };

    const tx = db.transaction(() => {
      if (linked.count > 0) {
        db.prepare("UPDATE invoices SET exam_id=NULL, updated_at=? WHERE exam_id=?")
          .run(new Date().toISOString(), id);
      }
      db.prepare("DELETE FROM exams WHERE id=?").run(id);
    });

    tx();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "تعذر حذف الفحص" },
      { status: 500 },
    );
  }
}
