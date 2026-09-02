import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    settings: db.prepare("SELECT * FROM settings WHERE id=1").get(),
    customers: db.prepare("SELECT * FROM customers").all(),
    invoices: db.prepare("SELECT * FROM invoices").all(),
    invoiceItems: db.prepare("SELECT * FROM invoice_items").all(),
    // Legacy records are exported only for backward compatibility.
    legacyExams: db.prepare("SELECT * FROM exams").all(),
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="optical-manager-backup-${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const exams = Array.isArray(payload?.legacyExams) ? payload.legacyExams : (Array.isArray(payload?.exams) ? payload.exams : []);
    if (![1,2,3].includes(Number(payload?.version)) || !Array.isArray(payload.customers) || !Array.isArray(payload.invoices) || !Array.isArray(payload.invoiceItems)) {
      return NextResponse.json({success:false,error:"ملف النسخة الاحتياطية غير صالح"},{status:400});
    }

    const tx = db.transaction(() => {
      db.prepare("DELETE FROM invoice_items").run();
      db.prepare("DELETE FROM invoices").run();
      db.prepare("DELETE FROM exams").run();
      db.prepare("DELETE FROM customers").run();

      const customerStmt=db.prepare(`INSERT INTO customers (id,customer_number,name,phone,address,date_of_birth,notes,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
      for(const x of payload.customers) customerStmt.run(x.id,x.customer_number,x.name,x.phone??null,x.address??null,x.date_of_birth??null,x.notes??null,x.status||"ACTIVE",x.created_at,x.updated_at||x.created_at);

      const examStmt=db.prepare(`INSERT INTO exams (id,exam_number,customer_id,exam_date,od_sph,od_cyl,od_axis,od_add,od_prism,od_base,os_sph,os_cyl,os_axis,os_add,os_prism,os_base,pd,near_pd,notes,examiner,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
      for(const x of exams) examStmt.run(x.id,x.exam_number||null,x.customer_id,x.exam_date,x.od_sph??null,x.od_cyl??null,x.od_axis??null,x.od_add??null,x.od_prism??null,x.od_base??null,x.os_sph??null,x.os_cyl??null,x.os_axis??null,x.os_add??null,x.os_prism??null,x.os_base??null,x.pd??null,x.near_pd??null,x.notes??null,x.examiner??null,x.created_at||new Date().toISOString(),x.updated_at||x.created_at||new Date().toISOString());

      const invoiceStmt=db.prepare(`INSERT INTO invoices (id,invoice_number,customer_id,invoice_date,exam_date,od_sph,od_cyl,od_axis,od_add,os_sph,os_cyl,os_axis,os_add,pd,near_pd,examiner,exam_notes,subtotal,discount,total,paid,remaining,status,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
      for(const x of payload.invoices){
        let data={...x};
        if((!data.exam_date || data.exam_date===null) && data.exam_id){
          const e=db.prepare("SELECT * FROM exams WHERE id=?").get(data.exam_id) as Record<string,unknown>|undefined;
          if(e) data={...data,exam_date:e.exam_date,od_sph:e.od_sph,od_cyl:e.od_cyl,od_axis:e.od_axis,od_add:e.od_add,os_sph:e.os_sph,os_cyl:e.os_cyl,os_axis:e.os_axis,os_add:e.os_add,pd:e.pd,near_pd:e.near_pd,examiner:e.examiner,exam_notes:e.notes};
        }
        invoiceStmt.run(data.id,data.invoice_number,data.customer_id,data.invoice_date,data.exam_date??null,data.od_sph??null,data.od_cyl??null,data.od_axis??null,data.od_add??null,data.os_sph??null,data.os_cyl??null,data.os_axis??null,data.os_add??null,data.pd??null,data.near_pd??null,data.examiner??null,data.exam_notes??null,data.subtotal??0,data.discount??0,data.total??0,data.paid??0,data.remaining??0,data.status||"UNPAID",data.notes??null,data.created_at||new Date().toISOString(),data.updated_at||data.created_at||new Date().toISOString());
      }
      const itemStmt=db.prepare(`INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,total) VALUES (?,?,?,?,?,?)`);
      for(const x of payload.invoiceItems) itemStmt.run(x.id,x.invoice_id,x.description,x.quantity??1,x.unit_price??0,x.total??0);
      if(payload.settings) db.prepare(`UPDATE settings SET shop_name=?,phone=?,address=?,logo=?,currency=?,invoice_footer=?,paper_size=?,updated_at=? WHERE id=1`).run(payload.settings.shop_name||"محل البصريات",payload.settings.phone??null,payload.settings.address??null,payload.settings.logo??null,payload.settings.currency||"ر.ي",payload.settings.invoice_footer||"شكرًا لزيارتكم",payload.settings.paper_size==="THERMAL"?"THERMAL":"A4",payload.settings.updated_at||new Date().toISOString());
    });
    tx();
    return NextResponse.json({success:true});
  } catch(e) { console.error(e); return NextResponse.json({success:false,error:"تعذر استعادة النسخة الاحتياطية"},{status:500}); }
}
