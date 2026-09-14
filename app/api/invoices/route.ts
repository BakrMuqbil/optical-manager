import { NextResponse } from "next/server";
import {
  db,
  nextCustomerNumber,
  nextInvoiceNumber,
  nextTransactionNumber,
  normalizeMoney,
  normalizeOptionalInt,
  normalizeOptionalNumber,
  uid,
} from "@/lib/db";
import { isDayClosed, recalculateInvoiceBalance } from "@/lib/finance";
import { todayISO } from "@/lib/utils/formatDate";
import { listInvoices } from "@/lib/services/invoiceService";


export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const result = listInvoices({
    q: params.get("q") || "",
    status: params.get("status") || "",
    from: params.get("from") || "",
    to: params.get("to") || "",
  });

  return NextResponse.json({ success: true, data: result.rows, summary: result.summary });
}

type InvoiceBody = {
  customerName?: string;
  customerPhone?: string;
  invoiceDate?: string;
  examiner?: string;
  odSph?: unknown; odCyl?: unknown; odAxis?: unknown; odAdd?: unknown;
  osSph?: unknown; osCyl?: unknown; osAxis?: unknown; osAdd?: unknown;
  pd?: unknown; nearPd?: unknown;
  price?: unknown;
  discount?: unknown;
  paid?: unknown;
  notes?: string;
};

function cleanBody(b: InvoiceBody) {
  const price = normalizeMoney(b.price);
  const discount = Math.min(normalizeMoney(b.discount), price);
  const total = normalizeMoney(price - discount);
  const paid = Math.min(normalizeMoney(b.paid), total);
  const remaining = normalizeMoney(total - paid);
  return {
    customerName: String(b.customerName ?? "").trim(),
    customerPhone: String(b.customerPhone ?? "").trim(),
    invoiceDate: String(b.invoiceDate ?? "").trim() || todayISO(),
    examiner: String(b.examiner ?? "").trim() || null,
    odSph: normalizeOptionalNumber(b.odSph), odCyl: normalizeOptionalNumber(b.odCyl), odAxis: normalizeOptionalInt(b.odAxis), odAdd: normalizeOptionalNumber(b.odAdd),
    osSph: normalizeOptionalNumber(b.osSph), osCyl: normalizeOptionalNumber(b.osCyl), osAxis: normalizeOptionalInt(b.osAxis), osAdd: normalizeOptionalNumber(b.osAdd),
    pd: normalizeOptionalNumber(b.pd), nearPd: normalizeOptionalNumber(b.nearPd),
    price, discount, total, paid, remaining,
    status: remaining === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID",
    notes: String(b.notes ?? "").trim() || null,
  };
}

function getOrCreateCustomer(name: string, phone: string) {
  const now = new Date().toISOString();
  const id = uid("cust");

  db.prepare(
    `INSERT INTO customers
      (
        id,
        customer_number,
        name,
        phone,
        status,
        created_at,
        updated_at
      )
     VALUES (?,?,?,?,?,?,?)`,
  ).run(
    id,
    nextCustomerNumber(),
    name,
    phone || null,
    "ACTIVE",
    now,
    now,
  );

  return id;
}

export async function POST(req: Request) {
  try {
    const b = await req.json() as InvoiceBody;

    const clean = cleanBody(b);

    if (!clean.customerName) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم العميل مطلوب",
        },
        { status: 400 },
      );
    }

    if (!clean.customerPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الجوال مطلوب",
        },
        { status: 400 },
      );
    }

    if (isDayClosed(clean.invoiceDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن إنشاء فاتورة في يوم مغلق",
        },
        { status: 400 },
      );
    }

    if (clean.price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "السعر يجب أن يكون أكبر من صفر",
        },
        { status: 400 },
      );
    }

    /*
     * حماية إضافية:
     *
     * paid لا يمكن أن يتجاوز total.
     *
     * cleanBody يقوم بذلك أيضًا، لكننا نحتفظ
     * بالتحقق هنا بوضوح قبل إنشاء البيانات.
     */
    if (clean.paid > clean.total) {
      return NextResponse.json(
        {
          success: false,
          error:
            "المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة",
        },
        { status: 400 },
      );
    }

    const id = uid("inv");
    const invoiceNumber = nextInvoiceNumber(clean.invoiceDate);
    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      const customerId = getOrCreateCustomer(
        clean.customerName,
        clean.customerPhone,
      );

      db.prepare(
        `INSERT INTO invoices
          (
            id,
            invoice_number,
            customer_id,
            invoice_date,

            od_sph,
            od_cyl,
            od_axis,
            od_add,

            os_sph,
            os_cyl,
            os_axis,
            os_add,

            pd,
            near_pd,

            examiner,
            exam_notes,

            subtotal,
            discount,
            total,
            paid,
            remaining,
            status,

            notes,
            created_at,
            updated_at
          )
         VALUES
          (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
          )`,
      ).run(
        id,
        invoiceNumber,
        customerId,
        clean.invoiceDate,

        clean.odSph,
        clean.odCyl,
        clean.odAxis,
        clean.odAdd,

        clean.osSph,
        clean.osCyl,
        clean.osAxis,
        clean.osAdd,

        clean.pd,
        clean.nearPd,

        clean.examiner,
        clean.notes,

        clean.price,
        clean.discount,
        clean.total,

        /*
         * هذه القيم صحيحة مبدئيًا،
         * وسيتم تثبيتها مرة أخرى من الحركة المالية.
         */
        clean.paid,
        clean.remaining,
        clean.status,

        clean.notes,
        now,
        now,
      );

      db.prepare(
        `INSERT INTO invoice_items
          (
            id,
            invoice_id,
            description,
            quantity,
            unit_price,
            total
          )
         VALUES (?,?,?,?,?,?)`,
      ).run(
        uid("item"),
        id,
        "الخدمة",
        1,
        clean.price,
        clean.price,
      );

      /*
       * الدفع عند إنشاء الفاتورة.
       */
      if (clean.paid > 0) {
        db.prepare(
          `INSERT INTO financial_transactions
            (
              id,
              transaction_number,
              transaction_date,
              type,
              amount,
              invoice_id,
              customer_id,
              description,
              status
            )
           VALUES
            (?, ?, ?, 'PAYMENT', ?, ?, ?, ?, 'ACTIVE')`,
        ).run(
          uid("ftx"),
          nextTransactionNumber(),
          clean.invoiceDate,
          clean.paid,
          id,
          customerId,
          "دفعة عند إنشاء الفاتورة",
        );
      }

      /*
       * مصدر الحقيقة النهائي للمدفوع هو
       * financial_transactions.
       */
      recalculateInvoiceBalance(id);
    });

    transaction();

    return NextResponse.json(
      {
        success: true,
        data: {
          id,
          invoiceNumber,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/invoices error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "تعذر حفظ الفاتورة",
      },
      { status: 500 },
    );
  }
}