import type { Invoice, InvoiceItem, Settings } from "@/types/app";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

type PrintableInvoice = Invoice & {
  exam_date?: string | null;
  od_sph?: number | string | null;
  od_cyl?: number | string | null;
  od_axis?: number | string | null;
  od_add?: number | string | null;
  os_sph?: number | string | null;
  os_cyl?: number | string | null;
  os_axis?: number | string | null;
  os_add?: number | string | null;
  pd?: number | string | null;
  near_pd?: number | string | null;
};

interface InvoicePrintProps {
  invoice: PrintableInvoice;
  items: InvoiceItem[];
  settings: Settings;
}

export function InvoicePrint({ invoice, items, settings }: InvoicePrintProps) {
  const currency = settings.currency || "ر.ي";

  // استخراج تفاصيل الإطار والعدسات من البنود أو الملاحظات
  const frameItem =
    items.find(
      (it) =>
        it.description.includes("إطار") || it.description.includes("نظارة"),
    )?.description || "—";
  const lensItem =
    items.find((it) => it.description.includes("عدس"))?.description || "—";

  return (
    <div className="mx-auto max-w-[80mm] bg-white p-3 text-black text-xs font-sans print:w-full print:p-0 print:m-0">
      {/* الهيدر: اسم المحل، اللوجو، والبيانات الإنجليزية */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3 text-xs dir-rtl">
        {/* الجهة اليمنى: البيانات بالعربي */}
        <div className="text-right w-1/3">
          <h1 className="text-base font-black leading-tight">
            {settings.shop_name || "المركز الأردني للنظارات"}
          </h1>
          <p className="text-[10px] font-bold text-gray-700 mt-0.5">
            لأحدث الماركات العالمية
          </p>
          {settings.address && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              {settings.address}
            </p>
          )}
        </div>

        {/* المنتصف: رمز اللوجو / الشعار */}
        <div className="w-1/3 flex justify-center items-center">
          <img
            src="/logo1.png"
            alt="Logo"
            className="h-14 w-auto object-contain"
            onError={(e) => {
              // إخفاء الصورة في حال عدم وجود الملف داخل مجلد public دون إظهار أي بديل
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* الجهة اليسرى: البيانات بالإنجليزي وأرقام الفاتورة والفحص */}
        <div className="text-left w-1/3 dir-ltr">
          {" "}
          <h2 className="text-xs font-black uppercase tracking-wider">
            Jordanian Glasses
          </h2>
          {settings.phone && (
            <p className="text-[10px] font-bold text-gray-700 mt-0.5">
              Tel: {settings.phone}
            </p>
          )}
          <p className="text-[9px] font-bold text-gray-800 mt-1">
            Inv#:{" "}
            <span className="font-normal">
              {invoice.invoice_number || invoice.id}
            </span>
          </p>
        </div>
      </div>

      {/* معلومات العميل والتاريخ */}
      <div className="flex justify-between items-center mb-2 text-xs font-bold dir-rtl">
        <div>
          الاسم : <span className="font-normal">{invoice.customer_name}</span>
        </div>
        <div>
          التاريخ :{" "}
          <span className="font-normal">
            {formatDate(invoice.invoice_date)}
          </span>
        </div>{" "}
      </div>

      {/* جدول فحص النظر المطابق تماماً للنموذج */}
      <div className="border-2 border-black mb-3 text-center">
        <table className="w-full border-collapse text-[11px] font-bold">
          <thead>
            {/* الصف الأول: RIGHT ثم LEFT */}
            <tr className="border-b-2 border-black">
              <th className="w-1/4 border-l-2 border-black"></th>
              <th
                colSpan={3}
                className="border-l-2 border-black py-1 text-center bg-gray-50"
              >
                RIGHT
              </th>
              <th colSpan={3} className="py-1 text-center bg-gray-50">
                LEFT
              </th>
            </tr>
            {/* الصف الثاني: أسماء القياسات */}
            <tr className="border-b-2 border-black text-[10px]">
              <th className="border-l-2 border-black"></th>
              <th className="w-[12.5%] border-l border-black py-0.5">SPH</th>
              <th className="w-[12.5%] border-l border-black py-0.5">CYL</th>
              <th className="w-[12.5%] border-l-2 border-black py-0.5">AXIS</th>
              <th className="w-[12.5%] border-l border-black py-0.5">SPH</th>
              <th className="w-[12.5%] border-l border-black py-0.5">CYL</th>
              <th className="w-[12.5%] py-0.5">AXIS</th>
            </tr>
          </thead>
          <tbody>
            {/* صف DISTANCE (المسافة/البعد) */}
            <tr className="border-b border-black">
              <td className="border-l-2 border-black py-1 font-bold text-left px-1">
                DISTANCE
              </td>
              <td className="border-l border-black dir-ltr">
                {invoice.od_sph ?? "—"}
              </td>
              <td className="border-l border-black dir-ltr">
                {invoice.od_cyl ?? "—"}
              </td>
              <td className="border-l-2 border-black dir-ltr">
                {invoice.od_axis ?? "—"}
              </td>
              <td className="border-l border-black dir-ltr">
                {invoice.os_sph ?? "—"}
              </td>
              <td className="border-l border-black dir-ltr">
                {invoice.os_cyl ?? "—"}
              </td>
              <td className="dir-ltr">{invoice.os_axis ?? "—"}</td>
            </tr>
            {/* صف READING (القراءة/القريب) */}
            <tr className="border-b-2 border-black">
              <td className="border-l-2 border-black py-1 font-bold text-left px-1">
                READING
              </td>
              <td className="border-l border-black dir-ltr">
                {invoice.od_add ? `+${invoice.od_add}` : "—"}
              </td>
              <td className="border-l border-black dir-ltr">—</td>
              <td className="border-l-2 border-black dir-ltr">—</td>
              <td className="border-l border-black dir-ltr">
                {invoice.os_add ? `+${invoice.os_add}` : "—"}
              </td>
              <td className="border-l border-black dir-ltr">—</td>
              <td className="dir-ltr">—</td>
            </tr>
          </tbody>
        </table>

        {/* حقل I.P.D أسفل الجدول */}
        <div className="p-1 text-right text-xs font-bold border-t border-black bg-gray-50 flex justify-between px-2">
          <span> </span>I.P.D: {invoice.pd ? `${invoice.pd} mm` : "—"}
          <span className="dir-rtl font-normal"></span>
        </div>
      </div>

      {/* تفاصيل الطلب: الإطار، العدسات، موعد التسليم */}
      <div className="space-y-1.5 text-xs border-b-2 border-black pb-2 mb-2">
        <div className="flex justify-between items-center">
          <span className="font-bold">
            الإطار : <span className="font-normal">{frameItem}</span>
          </span>
          <span className="font-bold">: Frame </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold">
            العدسات : <span className="font-normal">{lensItem}</span>
          </span>
          <span className="font-bold">: Lense </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold">
            موعد التسليم :{" "}
            <span className="font-normal">{invoice.notes || "—"}</span>
          </span>
          <span className="font-bold">: Date </span>
        </div>
      </div>

      {/* المبالغ: المبلغ، المدفوع، الباقي */}
      <div className="space-y-1 text-xs border-b-2 border-black pb-2 mb-2 font-bold">
        <div className="flex justify-between items-center">
          <span> المبلغ : {formatCurrency(invoice.total, currency)}</span>
          <span>: Amount</span>
        </div>
        <div className="flex justify-between items-center">
          <span> المدفوع : {formatCurrency(invoice.paid, currency)}</span>
          <span>Payment</span>
        </div>
        <div className="flex justify-between items-center text-sm pt-1 border-t border-dashed border-gray-400">
          <span> الباقي : {formatCurrency(invoice.remaining, currency)}</span>
          <span>: Overplus</span>
        </div>
      </div>

      {/* التذييل والملاحظة القانونية */}
      <div className="text-center pt-1 text-[10px] font-bold">
        <p className="border-t border-black pt-1">
          ■{" "}
          {settings.invoice_footer ||
            "المحل غير مسؤول عن فقدان النظارة خلال شهر"}{" "}
          ■
        </p>
      </div>
    </div>
  );
}
