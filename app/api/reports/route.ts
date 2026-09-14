import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { todayISO } from "@/lib/utils/formatDate";
import { closePeriod, getOpeningBalance, getPendingPeriods, getPeriodClosure, getReportData, listClosures, markReportPrinted, periodFromKey } from "@/lib/services/reportService";

type PeriodType = "MONTH" | "YEAR";
const typeOf = (v: string | null): PeriodType => v === "YEAR" ? "YEAR" : "MONTH";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams;
    const type = typeOf(p.get("type"));
    const key = p.get("key");
    if (p.get("action") === "status") return NextResponse.json({ success: true, data: { pending: getPendingPeriods(todayISO()) } });
    if (p.get("action") === "list") return NextResponse.json({ success: true, data: listClosures(type) });
    if (!key) return NextResponse.json({ success:false,error:"الفترة مطلوبة"},{status:400});
    const period = periodFromKey(type,key); const closure = getPeriodClosure(type,key);
    const openingBalance = closure?.opening_balance != null ? Number(closure.opening_balance) : getOpeningBalance(type,key);
    return NextResponse.json({success:true,data:{period,report:getReportData(period,openingBalance),closure,openingBalance,currency:(getSettings() as { currency?: string } | undefined)?.currency || "ر.ي"}});
  } catch(e) { return NextResponse.json({success:false,error:e instanceof Error?e.message:"تعذر تحميل التقرير"},{status:400}); }
}
export async function POST(req: Request) {
  try {
    const b=await req.json(); const type=typeOf(b.type); const key=String(b.key||""); if(!key) throw new Error("الفترة مطلوبة");
    if(b.action==="print"){markReportPrinted(type,key);return NextResponse.json({success:true});}
    if(b.action==="close"){const actual=Number(b.actualCash);if(!Number.isFinite(actual)||actual<0)throw new Error("النقد الفعلي مطلوب");return NextResponse.json({success:true,data:closePeriod(type,key,actual,b.openingBalance==null?undefined:Number(b.openingBalance))});}
    throw new Error("إجراء غير معروف");
  } catch(e){return NextResponse.json({success:false,error:e instanceof Error?e.message:"تعذر تنفيذ العملية"},{status:400});}
}
