import { NextResponse } from "next/server";
import { getFinancialOverview } from "@/lib/services/financialService";
import { todayISO } from "@/lib/utils/formatDate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const today = todayISO();
    const dateParam = params.get("date");
    const from = params.get("from") || dateParam || today;
    const to = params.get("to") || dateParam || today;

    const transactionPage = Number(params.get("transactionPage") || "1");
    const debtPage = Number(params.get("debtPage") || "1");
    const limit = Number(params.get("limit") || "10");

    const data = getFinancialOverview({
      from,
      to,
      transactionPage,
      debtPage,
      limit,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/financial error:", error);
    return NextResponse.json(
      { success: false, error: "تعذر جلب البيانات المالية" },
      { status: 500 },
    );
  }
}
