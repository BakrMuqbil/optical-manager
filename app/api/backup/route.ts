import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: db.prepare("SELECT * FROM settings WHERE id=1").get(),
    customers: db.prepare("SELECT * FROM customers").all(),
    exams: db.prepare("SELECT * FROM exams").all(),
    invoices: db.prepare("SELECT * FROM invoices").all(),
    invoiceItems: db.prepare("SELECT * FROM invoice_items").all(),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="optical-manager-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (
      ![1, 2].includes(Number(payload?.version)) ||
      !Array.isArray(payload.customers) ||
      !Array.isArray(payload.exams) ||
      !Array.isArray(payload.invoices) ||
      !Array.isArray(payload.invoiceItems)
    ) {
      return NextResponse.json(
        { success: false, error: "ملف النسخة الاحتياطية غير صالح" },
        { status: 400 },
      );
    }

    const tx = db.transaction(() => {
      db.prepare("DELETE FROM invoice_items").run();
      db.prepare("DELETE FROM invoices").run();
      db.prepare("DELETE FROM exams").run();
      db.prepare("DELETE FROM customers").run();

      const customerStmt = db.prepare(
        `INSERT INTO customers
        (id,customer_number,name,phone,address,date_of_birth,notes,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
      );

      for (const x of payload.customers) {
        customerStmt.run(
          x.id, x.customer_number, x.name, x.phone ?? null, x.address ?? null,
          x.date_of_birth ?? null, x.notes ?? null, x.status || "ACTIVE",
          x.created_at, x.updated_at || x.created_at,
        );
      }

      const examStmt = db.prepare(
        `INSERT INTO exams
        (id,exam_number,customer_id,exam_date,
         od_sph,od_cyl,od_axis,od_add,od_prism,od_base,
         os_sph,os_cyl,os_axis,os_add,os_prism,os_base,
         pd,near_pd,notes,examiner,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      );

      let examSequence = 0;
      const usedExamNumbers = new Set<string>();
      for (const x of payload.exams) {
        let examNumber = String(x.exam_number || "").trim();
        if (!examNumber || usedExamNumbers.has(examNumber)) {
          examSequence += 1;
          examNumber = `EXAM-${String(examSequence).padStart(6, "0")}`;
          while (usedExamNumbers.has(examNumber)) {
            examSequence += 1;
            examNumber = `EXAM-${String(examSequence).padStart(6, "0")}`;
          }
        }
        usedExamNumbers.add(examNumber);

        examStmt.run(
          x.id,
          examNumber,
          x.customer_id, x.exam_date,
          x.od_sph, x.od_cyl, x.od_axis, x.od_add, x.od_prism, x.od_base,
          x.os_sph, x.os_cyl, x.os_axis, x.os_add, x.os_prism, x.os_base,
          x.pd, x.near_pd, x.notes, x.examiner, x.created_at, x.updated_at || x.created_at,
        );
      }

      const invoiceStmt = db.prepare(
        `INSERT INTO invoices
        (id,invoice_number,customer_id,exam_id,invoice_date,subtotal,discount,total,paid,remaining,status,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      );

      for (const x of payload.invoices) {
        const examId = x.exam_id || null;
        if (examId) {
          const examExists = db.prepare("SELECT id FROM exams WHERE id=? AND customer_id=?").get(examId, x.customer_id);
          invoiceStmt.run(
            x.id, x.invoice_number, x.customer_id, examExists ? examId : null,
            x.invoice_date, x.subtotal, x.discount, x.total, x.paid, x.remaining,
            x.status, x.notes, x.created_at, x.updated_at,
          );
        } else {
          invoiceStmt.run(
            x.id, x.invoice_number, x.customer_id, null, x.invoice_date,
            x.subtotal, x.discount, x.total, x.paid, x.remaining,
            x.status, x.notes, x.created_at, x.updated_at,
          );
        }
      }

      const itemStmt = db.prepare(
        `INSERT INTO invoice_items
        (id,invoice_id,description,quantity,unit_price,total)
        VALUES (?,?,?,?,?,?)`,
      );
      for (const x of payload.invoiceItems) {
        itemStmt.run(x.id,x.invoice_id,x.description,x.quantity,x.unit_price,x.total);
      }

      if (payload.settings) {
        db.prepare(
          `UPDATE settings SET shop_name=?,phone=?,address=?,logo=?,currency=?,
           invoice_footer=?,paper_size=?,updated_at=? WHERE id=1`,
        ).run(
          payload.settings.shop_name || "محل البصريات",
          payload.settings.phone ?? null,
          payload.settings.address ?? null,
          payload.settings.logo ?? null,
          payload.settings.currency || "ر.ي",
          payload.settings.invoice_footer || "شكرًا لزيارتكم",
          payload.settings.paper_size === "THERMAL" ? "THERMAL" : "A4",
          payload.settings.updated_at || new Date().toISOString(),
        );
      }
    });

    tx();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "تعذر استعادة النسخة الاحتياطية" },
      { status: 500 },
    );
  }
}
