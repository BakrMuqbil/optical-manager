import { NextResponse } from "next/server";
import { getFinancialSummary, getTransactionsForDateRange, getOutstandingDebts, getClosureForDate } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const date = params.get("date") || new Date().toISOString().slice(0, 10);
  const from = params.get("from") || date;
  const to = params.get("to") || date;

  const summary = getFinancialSummary(date);
  const transactions = getTransactionsForDateRange(from, to);
  const debts = getOutstandingDebts();
  const closure = getClosureForDate(date);

  return NextResponse.json({ success: true, data: { summary, transactions, debts, closure } });
}
