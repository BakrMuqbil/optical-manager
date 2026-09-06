import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDayClosed } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = db.prepare("SELECT invoice_date FROM invoices WHERE id=?").get(id) as { invoice_date: string } | undefined;
  if (!inv) return NextResponse.json({ success: false, error: "الفاتورة غير موجودة" }, { status: 404 });
  if (isDayClosed(inv.invoice_date)) return NextResponse.json({ success: false, error: "لا يمكن إلغاء فاتورة من يوم مغلق" }, { status: 400 });
  const result = db.prepare("UPDATE invoices SET status='CANCELLED',updated_at=? WHERE id=? AND status<>'CANCELLED'").run(new Date().toISOString(), id);
  if (!result.changes) return NextResponse.json({ success: false, error: "الفاتورة غير موجودة أو ملغاة" }, { status: 404 });
  return NextResponse.json({ success: true });
}
