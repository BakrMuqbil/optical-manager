import { todayISO } from "@/lib/utils/formatDate";
import { NextResponse } from "next/server";
import { db, normalizeMoney, uid, nextTransactionNumber } from "@/lib/db";
import { isDayClosed } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const amount = normalizeMoney(b.amount);
    const date = String(b.date || "").trim() || todayISO();
    const description = String(b.description || "").trim();

    if (amount <= 0) return NextResponse.json({ success: false, error: "المبلغ مطلوب" }, { status: 400 });
    if (!description) return NextResponse.json({ success: false, error: "الوصف مطلوب" }, { status: 400 });
    if (isDayClosed(date)) return NextResponse.json({ success: false, error: "لا يمكن تسجيل مصروف في يوم مغلق" }, { status: 400 });

    db.prepare(`
      INSERT INTO financial_transactions 
      (id, transaction_number, transaction_date, type, amount, description, status)
      VALUES (?, ?, ?, 'EXPENSE', ?, ?, 'ACTIVE')
    `).run(uid("ftx"), nextTransactionNumber(), date, amount, description);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "تعذر تسجيل المصروف" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const rows = db.prepare(`
    SELECT * FROM financial_transactions 
    WHERE type = 'EXPENSE' 
      AND (?='' OR transaction_date>=?) 
      AND (?='' OR transaction_date<=?)
    ORDER BY transaction_date DESC, created_at DESC
  `).all(from, from, to, to);
  return NextResponse.json({ success: true, data: rows });
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    const id = String(b.id || "").trim();
    if (!id) return NextResponse.json({ success: false, error: "معرّف المصروف مطلوب" }, { status: 400 });

    const existing = db.prepare(`
      SELECT * FROM financial_transactions WHERE id = ? AND type = 'EXPENSE'
    `).get(id) as { id: string; transaction_date: string; status: string } | undefined;

    if (!existing) return NextResponse.json({ success: false, error: "المصروف غير موجود" }, { status: 404 });
    if (existing.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "لا يمكن تعديل مصروف ملغى" }, { status: 400 });
    }
    if (isDayClosed(existing.transaction_date)) {
      return NextResponse.json({ success: false, error: "لا يمكن تعديل مصروف في يوم مغلق" }, { status: 400 });
    }

    const amount = normalizeMoney(b.amount);
    const date = String(b.date || "").trim() || existing.transaction_date;
    const description = String(b.description || "").trim();

    if (amount <= 0) return NextResponse.json({ success: false, error: "المبلغ مطلوب" }, { status: 400 });
    if (!description) return NextResponse.json({ success: false, error: "الوصف مطلوب" }, { status: 400 });
    // منع نقل المصروف إلى يوم مغلق أيضًا عند تغيير التاريخ
    if (isDayClosed(date)) {
      return NextResponse.json({ success: false, error: "لا يمكن نقل المصروف إلى يوم مغلق" }, { status: 400 });
    }

    db.prepare(`
      UPDATE financial_transactions
      SET amount = ?, transaction_date = ?, description = ?
      WHERE id = ? AND type = 'EXPENSE'
    `).run(amount, date, description, id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "تعذر تعديل المصروف" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    let id = params.get("id") || "";
    if (!id) {
      const b = await req.json().catch(() => ({}));
      id = String(b?.id || "").trim();
    }
    if (!id) return NextResponse.json({ success: false, error: "معرّف المصروف مطلوب" }, { status: 400 });

    const existing = db.prepare(`
      SELECT * FROM financial_transactions WHERE id = ? AND type = 'EXPENSE'
    `).get(id) as { id: string; transaction_date: string } | undefined;

    if (!existing) return NextResponse.json({ success: false, error: "المصروف غير موجود" }, { status: 404 });
    if (isDayClosed(existing.transaction_date)) {
      return NextResponse.json({ success: false, error: "لا يمكن حذف مصروف في يوم مغلق" }, { status: 400 });
    }

    db.prepare(`DELETE FROM financial_transactions WHERE id = ? AND type = 'EXPENSE'`).run(id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "تعذر حذف المصروف" }, { status: 500 });
  }
}