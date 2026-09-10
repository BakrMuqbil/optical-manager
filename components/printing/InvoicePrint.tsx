import Image from "next/image";
import type { Invoice, Settings } from "@/types/app";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export interface InvoiceItem {
    id?: number | string;
    invoice_id?: number | string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

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
    items?: InvoiceItem[];
    settings: Settings;
}

const formatVal = (val: string | number | null | undefined) => {
  if (val === null || val === undefined || val === "") return "—";
  return <span dir="ltr" className="inline-block">{val}</span>;
};

export function InvoicePrint({
    invoice,
    items = [],
    settings
}: InvoicePrintProps) {
    const currency = settings.currency || "ر.ي";

    const frameItem =
        items.find(it => /إطار|نظارة|frame/i.test(it.description))
            ?.description || "—";

    const lensItem =
        items.find(it => /عدس|lens/i.test(it.description))?.description || "—";

    return (
        <div className="mx-auto w-[80mm] max-w-full bg-white p-3 text-xs font-sans text-black">
            {/* الهيدر: اسم المحل، اللوجو، والبيانات الإنجليزية */}
            <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2 text-xs dir-rtl">
                <div className="w-1/3 text-right">
                    <h1 className="text-base font-black leading-tight">
                        {settings.shop_name || "المركز الأردني للنظارات"}
                    </h1>

                    <p className="mt-0.5 text-[10px] font-bold text-gray-700">
                        لأحدث الماركات العالمية
                    </p>

                    {settings.address && (
                        <p className="mt-0.5 text-[10px] text-gray-600">
                            {settings.address}
                        </p>
                    )}
                </div>

                <div className="flex w-1/3 items-center justify-center">
                    <Image
                        src="/logo1.png"
                        alt="Logo"
                        width={120}
                        height={80}
                        unoptimized
                        className="h-14 w-auto object-contain"
                    />
                </div>

                <div className="w-1/3 text-left dir-ltr">
                    <h2 className="text-xs font-black uppercase tracking-wider">
                        Jordanian Glasses
                    </h2>

                    {settings.phone && (
                        <p className="mt-0.5 text-[10px] font-bold text-gray-700">
                            Tel: {settings.phone}
                        </p>
                    )}

                    <p className="mt-1 text-[9px] font-bold text-gray-800">
                        Inv#:{" "}
                        <span className="font-normal">
                            {invoice.invoice_number || invoice.id}
                        </span>
                    </p>
                </div>
            </div>

            {/* معلومات العميل والتاريخ */}
            <div className="mb-2 flex items-center justify-between text-xs font-bold dir-rtl">
                <div>
                    الاسم :{" "}
                    <span className="font-normal">{invoice.customer_name}</span>
                </div>

                <div>
                    التاريخ :{" "}
                    <span className="font-normal">
                        {formatDate(invoice.invoice_date)}
                    </span>
                </div>
            </div>

            {/* جدول فحص النظر */}
            <div className="mb-3 border-2 border-black text-center">
                <table className="w-full border-collapse text-[11px] font-bold">
  <thead>
    <tr className="border-b-2 border-black">
      <th className="w-1/4 border-l-2 border-black" />
      <th colSpan={3} className="border-l-2 border-black bg-gray-50 py-1 text-center">
        LEFT
      </th>
      <th colSpan={3} className="bg-gray-50 py-1 text-center">
        RIGHT
      </th>
    </tr>

    <tr className="border-b-2 border-black text-[10px]">
      <th className="border-l-2 border-black" />
      <th className="w-[12.5%] border-l border-black py-0.5">AXIS</th>
      <th className="w-[12.5%] border-l border-black py-0.5">CYL</th>
      <th className="w-[12.5%] border-l-2 border-black py-0.5">SPH</th>
      <th className="w-[12.5%] border-l border-black py-0.5">AXIS</th>
      <th className="w-[12.5%] border-l border-black py-0.5">CYL</th>
      <th className="w-[12.5%] py-0.5">SPH</th>
    </tr>
  </thead>

  <tbody>
    <tr className="border-b border-black">
      <td className="border-l-2 border-black px-1 py-1 text-left font-bold">
        DISTANCE
      </td>

      <td className="border-l border-black">{formatVal(invoice.os_axis)}</td>
      <td className="border-l border-black">{formatVal(invoice.os_cyl)}</td>
      <td className="border-l-2 border-black">{formatVal(invoice.os_sph)}</td>

      <td className="border-l border-black">{formatVal(invoice.od_axis)}</td>
      <td className="border-l border-black">{formatVal(invoice.od_cyl)}</td>
      <td>{formatVal(invoice.od_sph)}</td>
    </tr>

    <tr className="border-b-2 border-black">
      <td className="border-l-2 border-black px-1 py-1 text-left font-bold">
        READING
      </td>

      <td className="border-l border-black">
        {formatVal(invoice.os_add ? `+${invoice.os_add}` : null)}
      </td>
      <td className="border-l border-black">—</td>
      <td className="border-l-2 border-black">—</td>

      <td className="border-l border-black">
        {formatVal(invoice.od_add ? `+${invoice.od_add}` : null)}
      </td>
      <td className="border-l border-black">—</td>
      <td>—</td>
    </tr>
  </tbody>
</table>

                {/* حقل I.P.D أسفل الجدول */}
                <div className="flex justify-between border-t border-black bg-gray-50 p-1 px-2 text-right text-xs font-bold">
                    <span />
                    I.P.D: {invoice.pd ? `${invoice.pd} mm` : "—"}
                    <span className="font-normal dir-rtl" />
                </div>
            </div>

            {/* تفاصيل الطلب: الإطار، العدسات، موعد التسليم */}
            <div className="mb-2 space-y-1.5 border-b-2 border-black pb-2 text-xs">
                <div className="flex items-center justify-between">
                    <span className="font-bold">
                        الإطار :{" "}
                        <span className="font-normal">
                            {invoice.notes || "—"}
                        </span>
                    </span>

                    <span className="font-bold">: Frame</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="font-bold">
                        العدسات :{" "}
                        <span className="font-normal">{lensItem}</span>
                    </span>

                    <span className="font-bold">: Lense</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="font-bold">
                        موعد التسليم :{" "}
                        <span className="font-normal">{frameItem}</span>
                    </span>

                    <span className="font-bold">: Date</span>
                </div>
            </div>

            {/* المبالغ: المبلغ، المدفوع، الباقي */}
            <div className="mb-2 space-y-1 border-b-2 border-black pb-2 text-xs font-bold">
                <div className="flex items-center justify-between">
                    <span>
                        المبلغ : {formatCurrency(invoice.total, currency)}
                    </span>

                    <span>: Amount</span>
                </div>

                <div className="flex items-center justify-between">
                    <span>
                        المدفوع : {formatCurrency(invoice.paid, currency)}
                    </span>

                    <span>Payment</span>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-gray-400 pt-1 text-sm">
                    <span>
                        الباقي : {formatCurrency(invoice.remaining, currency)}
                    </span>

                    <span>: Overplus</span>
                </div>
            </div>

            {/* التذييل والملاحظة القانونية */}
            <div className="pt-1 text-center text-[10px] font-bold">
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
