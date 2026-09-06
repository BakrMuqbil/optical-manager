import { NextResponse } from "next/server";
import { db, normalizeMoney, uid, nextTransactionNumber } from "@/lib/db";
import { isDayClosed } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const amount = normalizeMoney(b.amount);
    const date = String(b.date || "").trim() || new Date().toISOString().slice(0, 10);
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
