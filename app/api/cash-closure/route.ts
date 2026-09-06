import { NextResponse } from "next/server";
import { db, normalizeMoney } from "@/lib/db";
import { getFinancialSummary, isDayClosed } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const date = params.get("date") || new Date().toISOString().slice(0, 10);
  const closure = db.prepare("SELECT * FROM cash_closures WHERE business_date = ?").get(date);
  return NextResponse.json({ success: true, data: closure });
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const date = String(b.date || "").trim() || new Date().toISOString().slice(0, 10);
    const actualCash = normalizeMoney(b.actualCash);
    const openingBalance = normalizeMoney(b.openingBalance);

    if (isDayClosed(date)) return NextResponse.json({ success: false, error: "اليوم مغلق مسبقًا" }, { status: 400 });

    const summary = getFinancialSummary(date);
    const expected = openingBalance + summary.collections - summary.expenses;
    const difference = normalizeMoney(actualCash - expected);

    db.prepare(`
      INSERT INTO cash_closures (id, business_date, opened_at, closed_at, opening_balance, total_sales, total_collections, total_expenses, expected_cash, actual_cash, difference, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CLOSED')
      ON CONFLICT(business_date) DO UPDATE SET
        closed_at = excluded.closed_at,
        opening_balance = excluded.opening_balance,
        total_sales = excluded.total_sales,
        total_collections = excluded.total_collections,
        total_expenses = excluded.total_expenses,
        expected_cash = excluded.expected_cash,
        actual_cash = excluded.actual_cash,
        difference = excluded.difference,
        status = 'CLOSED'
    `).run(
      `cls_${crypto.randomUUID()}`, date, new Date().toISOString(), new Date().toISOString(),
      openingBalance, summary.sales, summary.collections, summary.expenses,
      expected, actualCash, difference
    );

    return NextResponse.json({ success: true, data: { expected, difference } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "تعذر إغلاق الصندوق" }, { status: 500 });
  }
}
