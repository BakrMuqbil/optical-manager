import { NextResponse } from "next/server";
import {
  db,
  normalizeMoney,
  normalizeOptionalInt,
  normalizeOptionalNumber,
  uid,
  nextTransactionNumber,
} from "@/lib/db";
import {
  isDayClosed,
  recalculateInvoiceBalance,
  synchronizeInvoicePayment,
} from "@/lib/finance";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

type CurrentInvoice = {
  id: string;
  customer_id: string;
  status: string;
  invoice_date: string;
  total: number;
  paid: number;
  remaining: number;
};

function invoiceQuery() {
  return `SELECT i.*, c.name customer_name, c.phone customer_phone,
    c.address customer_address, c.customer_number
    FROM invoices i
    JOIN customers c ON c.id=i.customer_id
    WHERE i.id=?`;
}

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;

  const invoice = db.prepare(invoiceQuery()).get(id);

  if (!invoice) {
    return NextResponse.json(
      {
        success: false,
        error: "الفاتورة غير موجودة",
      },
      { status: 404 },
    );
  }

  const items = db
    .prepare(
      `SELECT *
       FROM invoice_items
       WHERE invoice_id=?
       ORDER BY rowid ASC`,
    )
    .all(id);

  return NextResponse.json({
    success: true,
    data: {
      invoice,
      items,
    },
  });
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const b = await req.json();

    const current = db
      .prepare(
        `SELECT
           id,
           customer_id,
           status,
           invoice_date,
           total,
           paid,
           remaining
         FROM invoices
         WHERE id=?`,
      )
      .get(id) as CurrentInvoice | undefined;

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          error: "الفاتورة غير موجودة",
        },
        { status: 404 },
      );
    }

    if (current.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن تعديل فاتورة ملغاة",
        },
        { status: 400 },
      );
    }

    /*
     * لا نسمح بتعديل فاتورة من يوم مغلق.
     */
    if (isDayClosed(current.invoice_date)) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن تعديل فاتورة من يوم مغلق",
        },
        { status: 400 },
      );
    }

    const name = String(b.customerName ?? "").trim();
    const phone = String(b.customerPhone ?? "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم العميل مطلوب",
        },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الجوال مطلوب",
        },
        { status: 400 },
      );
    }

    const invoiceDate =
      String(b.invoiceDate || "").trim() ||
      new Date().toISOString().slice(0, 10);

    /*
     * إذا حاول المستخدم نقل الفاتورة إلى يوم مغلق،
     * نمنع العملية أيضًا.
     */
    if (
      invoiceDate !== current.invoice_date &&
      isDayClosed(invoiceDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن نقل الفاتورة إلى يوم مغلق",
        },
        { status: 400 },
      );
    }

    const price = normalizeMoney(b.price);

    if (price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "السعر يجب أن يكون أكبر من صفر",
        },
        { status: 400 },
      );
    }

    const discount = Math.min(
      normalizeMoney(b.discount),
      price,
    );

    const total = normalizeMoney(price - discount);

    /*
     * paid هو المبلغ الذي أدخله المستخدم أثناء تعديل الفاتورة.
     *
     * مهم:
     * لا نعتمد على current.paid هنا لأن current.paid قديم.
     *
     * مثال:
     * السعر القديم = 80
     * المدفوع القديم = 80
     * السعر الجديد = 64
     * المستخدم أدخل المدفوع = 64
     *
     * المطلوب:
     * total = 64
     * paid = 64
     */
    const requestedPaid = normalizeMoney(b.paid);

    if (requestedPaid > total) {
      return NextResponse.json(
        {
          success: false,
          error: "المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة",
        },
        { status: 400 },
      );
    }

    const paid = requestedPaid;
    

    

    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      /*
       * البحث عن عميل آخر بنفس رقم الجوال.
       */
      const existing = db
        .prepare(
          `SELECT id
           FROM customers
           WHERE phone=?
             AND status='ACTIVE'
             AND id<>?
           ORDER BY created_at DESC
           LIMIT 1`,
        )
        .get(phone, current.customer_id) as
        | { id: string }
        | undefined;

      let customerId = current.customer_id;

      if (existing) {
        customerId = existing.id;
      }

      db.prepare(
        `UPDATE customers
         SET name=?,
             phone=?,
             updated_at=?
         WHERE id=?`,
      ).run(
        name,
        phone,
        now,
        customerId,
      );

      /*
       * تحديث بيانات الفاتورة الأساسية.
       *
       * paid / remaining / status لا نكتبها يدويًا هنا.
       * سيتم ضبطها بعد مزامنة الحركات المالية بواسطة
       * synchronizeInvoicePayment().
       */
      db.prepare(
        `UPDATE invoices
         SET customer_id=?,
             invoice_date=?,
             exam_date=?,
             od_sph=?,
             od_cyl=?,
             od_axis=?,
             od_add=?,
             os_sph=?,
             os_cyl=?,
             os_axis=?,
             os_add=?,
             pd=?,
             near_pd=?,
             examiner=?,
             exam_notes=?,
             subtotal=?,
             discount=?,
             total=?,
             notes=?,
             updated_at=?
         WHERE id=?`,
      ).run(
        customerId,
        invoiceDate,
        String(b.examDate || "").trim() || null,

        normalizeOptionalNumber(b.odSph),
        normalizeOptionalNumber(b.odCyl),
        normalizeOptionalInt(b.odAxis),
        normalizeOptionalNumber(b.odAdd),

        normalizeOptionalNumber(b.osSph),
        normalizeOptionalNumber(b.osCyl),
        normalizeOptionalInt(b.osAxis),
        normalizeOptionalNumber(b.osAdd),

        normalizeOptionalNumber(b.pd),
        normalizeOptionalNumber(b.nearPd),

        String(b.examiner || "").trim() || null,

        String(b.notes || "").trim() || null,

        price,
        discount,
        total,

        String(b.notes || "").trim() || null,

        now,
        id,
      );

      /*
       * إعادة بناء بند الفاتورة.
       */
      db.prepare(
        "DELETE FROM invoice_items WHERE invoice_id=?",
      ).run(id);

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
        price,
        price,
      );

      /*
       * أهم جزء في الإصلاح:
       *
       * مزامنة الدفعات المالية مع paid الجديد.
       *
       * هنا سيتم تحويل TX القديم من 80 إلى 64
       * في الحالة التي حدثت مع INV-000004.
       */
      synchronizeInvoicePayment(
        id,
        customerId,
        invoiceDate,
        paid,
        nextTransactionNumber,
      );

      /*
       * إعادة حساب paid / remaining / status
       * من financial_transactions نفسها.
       */
      recalculateInvoiceBalance(id);
    });

    transaction();

    return GET(req, {
      params: Promise.resolve({ id }),
    });
  } catch (error) {
    console.error("PUT /api/invoices/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر تعديل الفاتورة",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: Ctx,
) {
  try {
    const { id } = await params;

    const invoice = db
      .prepare(
        `SELECT
           id,
           invoice_date,
           status
         FROM invoices
         WHERE id=?`,
      )
      .get(id) as
      | {
          id: string;
          invoice_date: string;
          status: string;
        }
      | undefined;

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "الفاتورة غير موجودة",
        },
        { status: 404 },
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "الفاتورة ملغاة بالفعل",
        },
        { status: 400 },
      );
    }

    if (isDayClosed(invoice.invoice_date)) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن حذف فاتورة من يوم مغلق",
        },
        { status: 400 },
      );
    }

    /*
     * الحذف يجب أن يكون Transaction واحد.
     *
     * أولاً نحذف الحركات المالية المرتبطة بالفاتورة،
     * ثم الفاتورة نفسها.
     *
     * invoice_items تحذف تلقائيًا بسبب ON DELETE CASCADE.
     */
    const transaction = db.transaction(() => {
      db.prepare(
        `DELETE FROM financial_transactions
         WHERE invoice_id=?`,
      ).run(id);

      const result = db
        .prepare(
          "DELETE FROM invoices WHERE id=?",
        )
        .run(id);

      if (!result.changes) {
        throw new Error("الفاتورة غير موجودة");
      }
    });

    transaction();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "تعذر حذف الفاتورة",
      },
      { status: 500 },
    );
  }
}