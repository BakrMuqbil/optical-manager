import { NextResponse } from "next/server";
import { getCustomerStatement } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const customerId = params.get("customerId") || "";
  if (!customerId) return NextResponse.json({ success: false, error: "العميل مطلوب" }, { status: 400 });
  const statement = getCustomerStatement(customerId);
  return NextResponse.json({ success: true, data: statement });
}
