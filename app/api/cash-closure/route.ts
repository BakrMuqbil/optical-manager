import { todayISO } from "@/lib/utils/formatDate";
import { NextResponse } from "next/server";
import { normalizeMoney } from "@/lib/db";
import { getClosureRecord, closeCashDay } from "@/lib/services/financialService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const id = params.get("id");
    const date = params.get("date");

    if (id) {
      const closure = getClosureRecord({ id });
      if (!closure) {
        return NextResponse.json({ success: false, error: "إغلاق الصندوق غير موجود" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: closure });
    }

    if (date) {
      return NextResponse.json({ success: true, data: getClosureRecord({ date }) });
    }

    const requestedPage = Number(params.get("page") || "1");
    const requestedLimit = Number(params.get("limit") || "10");
    const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(10, Math.max(1, Math.floor(requestedLimit))) : 10;
    const result = getClosureRecord({ page, limit }) as { closures: unknown[]; pagination: unknown };

    return NextResponse.json({ success: true, data: result.closures, pagination: result.pagination });
  } catch (error) {
    console.error("GET /api/cash-closure error:", error);
    return NextResponse.json({ success: false, error: "تعذر جلب بيانات إغلاقات الصندوق" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = String(body.date || "").trim() || todayISO();
    const actualCash = normalizeMoney(body.actualCash);
    const openingBalance = normalizeMoney(body.openingBalance);
    const data = closeCashDay(date, actualCash, openingBalance);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("POST /api/cash-closure error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "تعذر إغلاق الصندوق" }, { status: 500 });
  }
}
