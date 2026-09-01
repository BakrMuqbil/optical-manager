import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request,{params}:Ctx) {
  const {id}=await params;
  const customer=db.prepare("SELECT * FROM customers WHERE id=?").get(id);
  if(!customer)return NextResponse.json({success:false,error:"العميل غير موجود"},{status:404});
  const exams=db.prepare("SELECT * FROM exams WHERE customer_id=? ORDER BY exam_date DESC, created_at DESC").all(id);
  const invoices=db.prepare(`SELECT i.*, e.exam_number FROM invoices i LEFT JOIN exams e ON e.id=i.exam_id WHERE i.customer_id=? ORDER BY i.invoice_date DESC, i.created_at DESC`).all(id);
  return NextResponse.json({success:true,data:{customer,exams,invoices}});
}

export async function PUT(req:Request,{params}:Ctx) {
  try {
    const {id}=await params; const b=await req.json(); const name=String(b.name??"").trim();
    if(!name)return NextResponse.json({success:false,error:"اسم العميل مطلوب"},{status:400});
    const duplicate=b.phone?db.prepare("SELECT id FROM customers WHERE phone=? AND id<>? AND status='ACTIVE' LIMIT 1").get(String(b.phone).trim(),id):null;
    if(duplicate)return NextResponse.json({success:false,error:"يوجد عميل مسجل مسبقًا بهذا الرقم"},{status:409});
    db.prepare("UPDATE customers SET name=?,phone=?,address=?,date_of_birth=?,notes=?,updated_at=? WHERE id=?")
      .run(name,String(b.phone??"").trim()||null,String(b.address??"").trim()||null,b.dateOfBirth||null,String(b.notes??"").trim()||null,new Date().toISOString(),id);
    return GET(req,{params});
  } catch(e) { console.error(e); return NextResponse.json({success:false,error:"تعذر تعديل العميل"},{status:500}); }
}

export async function DELETE(_:Request,{params}:Ctx) {
  try {
    const {id}=await params;
    const customer=db.prepare("SELECT id FROM customers WHERE id=?").get(id);
    if(!customer)return NextResponse.json({success:false,error:"العميل غير موجود"},{status:404});
    db.prepare("UPDATE customers SET status='ARCHIVED',updated_at=? WHERE id=?").run(new Date().toISOString(),id);
    return NextResponse.json({success:true});
  } catch(e) { console.error(e); return NextResponse.json({success:false,error:"تعذر أرشفة العميل"},{status:500}); }
}
