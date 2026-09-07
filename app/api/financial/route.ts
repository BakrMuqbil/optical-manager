import { NextResponse } from "next/server";
import {
  getFinancialSummary,
  getTransactionsPage,
  getOutstandingDebtsPage,
  getClosureForDate,
} from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  const date =
    params.get("date") ||
    new Date().toISOString().slice(0, 10);

  const from = params.get("from") || date;
  const to = params.get("to") || date;

  const transactionPage = Number(
    params.get("transactionPage") || "1",
  );

  const debtPage = Number(
    params.get("debtPage") || "1",
  );

  const limit = Number(
    params.get("limit") || "10",
  );

  const summary = getFinancialSummary(date);

  const transactionsResult = getTransactionsPage(
    from === to ? date : from,
    transactionPage,
    limit,
  );

  const debtsResult = getOutstandingDebtsPage(
    debtPage,
    limit,
  );

  const closure = getClosureForDate(date);

  return NextResponse.json({
    success: true,
    data: {
      summary,
      transactions: transactionsResult.transactions,
      transactionPagination: transactionsResult.pagination,
      debts: debtsResult.debts,
      debtPagination: debtsResult.pagination,
      closure,
    },
  });
}
