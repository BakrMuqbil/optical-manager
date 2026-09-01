import { NextResponse } from 'next/server'
import { db, nextCustomerNumber, uid } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() || ''
  const like = `%${q}%`
  const rows = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM exams e WHERE e.customer_id=c.id) exams_count, (SELECT COUNT(*) FROM invoices i WHERE i.customer_id=c.id AND i.status <> 'CANCELLED') invoices_count FROM customers c WHERE c.status='ACTIVE' AND (?='' OR c.name LIKE ? OR c.phone LIKE ? OR c.customer_number LIKE ?) ORDER BY c.created_at DESC`).all(q, like, like, like) as unknown[]
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const phone = String(body.phone ?? '').trim() || null
    if (!name) return NextResponse.json({ success:false, error:'اسم العميل مطلوب' }, {status:400})
    if (phone) {
      const duplicate = db.prepare('SELECT id, name FROM customers WHERE phone = ? AND status = ? LIMIT 1').get(phone, 'ACTIVE')
      if (duplicate) return NextResponse.json({success:false,error:'يوجد عميل مسجل مسبقًا بهذا الرقم',data:duplicate},{status:409})
    }
    const id = uid('cust'), number = nextCustomerNumber(), now = new Date().toISOString()
    db.prepare('INSERT INTO customers (id, customer_number, name, phone, address, date_of_birth, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, number, name, phone, body.address?.trim() || null, body.dateOfBirth || null, body.notes?.trim() || null, now, now)
    return NextResponse.json({success:true,data:{id,customer_number:number,name,phone}},{status:201})
  } catch (e) { console.error(e); return NextResponse.json({success:false,error:'تعذر حفظ العميل'},{status:500}) }
}
