import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDayClosed } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const inv = db
      .prepare(
        `SELECT id, invoice_date, status
         FROM invoices
         WHERE id=?`,
      )
      .get(id) as
      | { id: string; invoice_date: string; status: string }
      | undefined;

    if (!inv) {
      return NextResponse.json(
        { success: false, error: "الفاتورة غير موجودة" },
        { status: 404 },
      );
    }

    if (inv.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "الفاتورة ملغاة بالفعل" },
        { status: 400 },
      );
    }

    if (isDayClosed(inv.invoice_date)) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن إلغاء فاتورة من يوم مغلق",
        },
        { status: 400 },
      );
    }

    const activePayments = db
      .prepare(
        `SELECT id, transaction_date
         FROM financial_transactions
         WHERE invoice_id=?
           AND type='PAYMENT'
           AND status='ACTIVE'`,
      )
      .all(id) as Array<{ id: string; transaction_date: string }> ;

    const hasClosedPayment = activePayments.some((payment) =>
      isDayClosed(payment.transaction_date),
    );

    if (hasClosedPayment) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن إلغاء الفاتورة لأن لديها دفعة مرتبطة بيوم مالي مغلق",
        },
        { status: 400 },
      );
    }

    const transaction = db.transaction(() => {
      // لا نحذف الدفعات؛ نحولها إلى VOID حتى تبقى ضمن السجل والنسخ الاحتياطية.
      db.prepare(
        `UPDATE financial_transactions
         SET status='VOID'
         WHERE invoice_id=?
           AND type='PAYMENT'
           AND status='ACTIVE'`,
      ).run(id);

      const result = db
        .prepare(
          `UPDATE invoices
           SET status='CANCELLED',
               updated_at=?
           WHERE id=?
             AND status<>'CANCELLED'`,
        )
        .run(new Date().toISOString(), id);

      if (!result.changes) {
        throw new Error("الفاتورة غير موجودة أو ملغاة");
      }
    });

    transaction();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/invoices/[id]/cancel error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر إلغاء الفاتورة",
      },
      { status: 500 },
    );
  }
}
