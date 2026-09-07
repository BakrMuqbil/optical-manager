import { NextResponse } from "next/server";
import { db, normalizeMoney } from "@/lib/db";
import {
  getFinancialSummary,
  getCashClosureById,
  getCashClosuresPage,
  isDayClosed,
} from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;

    const id = params.get("id");
    const date = params.get("date");

    // جلب إغلاق محدد بالـ ID
    if (id) {
      const closure = getCashClosureById(id);

      if (!closure) {
        return NextResponse.json(
          {
            success: false,
            error: "إغلاق الصندوق غير موجود",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: closure,
      });
    }

    // دعم الطريقة القديمة: جلب إغلاق حسب التاريخ
    if (date) {
      const closure = db
        .prepare("SELECT * FROM cash_closures WHERE business_date = ?")
        .get(date);

      return NextResponse.json({
        success: true,
        data: closure,
      });
    }

    // سجل الإغلاقات مع Pagination
    const requestedPage = Number(params.get("page") || "1");
    const requestedLimit = Number(params.get("limit") || "10");

    const page = Number.isFinite(requestedPage)
      ? Math.max(1, Math.floor(requestedPage))
      : 1;

    // نثبت الحد الأقصى حتى لا يستطيع العميل طلب آلاف السجلات دفعة واحدة.
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(10, Math.max(1, Math.floor(requestedLimit)))
      : 10;

    const result = getCashClosuresPage(page, limit);

    return NextResponse.json({
      success: true,
      data: result.closures,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET /api/cash-closure error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "تعذر جلب بيانات إغلاقات الصندوق",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();

    const date =
      String(b.date || "").trim() || new Date().toISOString().slice(0, 10);

    const actualCash = normalizeMoney(b.actualCash);
    const openingBalance = normalizeMoney(b.openingBalance);

    if (isDayClosed(date)) {
      return NextResponse.json(
        {
          success: false,
          error: "اليوم مغلق مسبقًا",
        },
        { status: 400 },
      );
    }

    const summary = getFinancialSummary(date);

    const expected = openingBalance + summary.collections - summary.expenses;

    const difference = normalizeMoney(actualCash - expected);

    db.prepare(
      `
      INSERT INTO cash_closures (
        id,
        business_date,
        opened_at,
        closed_at,
        opening_balance,
        total_sales,
        total_collections,
        total_expenses,
        expected_cash,
        actual_cash,
        difference,
        status
      )
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
    `,
    ).run(
      `cls_${crypto.randomUUID()}`,
      date,
      new Date().toISOString(),
      new Date().toISOString(),
      openingBalance,
      summary.sales,
      summary.collections,
      summary.expenses,
      expected,
      actualCash,
      difference,
    );

    return NextResponse.json({
      success: true,
      data: {
        expected,
        difference,
      },
    });
  } catch (error) {
    console.error("POST /api/cash-closure error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "تعذر إغلاق الصندوق",
      },
      { status: 500 },
    );
  }
}
