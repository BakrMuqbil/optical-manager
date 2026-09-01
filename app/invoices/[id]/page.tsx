"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Printer, Ban, Edit, Trash2 } from "lucide-react";
import { InvoicePrint } from "@/components/printing/InvoicePrint";
import type { Invoice, InvoiceItem, Settings } from "@/types/app";

type PrintableInvoice = Invoice & {
  exam_date?: string | null;
  od_sph?: number | string | null;
  od_cyl?: number | string | null;
  od_axis?: number | string | null;
  od_add?: number | string | null;
  od_prism?: number | string | null;
  od_base?: string | null;
  os_sph?: number | string | null;
  os_cyl?: number | string | null;
  os_axis?: number | string | null;
  os_add?: number | string | null;
  os_prism?: number | string | null;
  os_base?: string | null;
  pd?: number | string | null;
  near_pd?: number | string | null;
  examiner?: string | null;
  exam_notes?: string | null;
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<{
    invoice: PrintableInvoice;
    items: InvoiceItem[];
  } | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadInvoiceData() {
      try {
        const [r, s] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch("/api/settings"),
        ]);
        const j = await r.json();
        const sj = await s.json();
        if (isMounted) {
          if (j.success) setData(j.data);
          if (sj.success) setSettings(sj.data);
        }
      } catch {
        // Handle error
      }
    }
    loadInvoiceData();
    return () => {
      isMounted = false;
    };
  }, [id, refreshKey]);

  if (!data || !settings)
    return (
      <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
    );

  const i = data.invoice;

  const cancel = async () => {
    if (!confirm("هل تريد إلغاء هذه الفاتورة؟")) return;
    const r = await fetch(`/api/invoices/${i.id}/cancel`, { method: "POST" });
    const j = await r.json();
    if (!r.ok) return alert(j.error);
    setRefreshKey((k) => k + 1);
  };

  const remove = async () => {
    if (
      !confirm(
        "هل تريد حذف هذه الفاتورة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
      )
    )
      return;
    const r = await fetch(`/api/invoices/${i.id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) return alert(j.error);
    router.push(`/customers/${i.customer_id}`);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 pt-20 md:p-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/customers/${i.customer_id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
        >
          <ArrowRight size={17} />
          ملف العميل
        </Link>
        <div className="flex flex-wrap gap-2">
          {i.status !== "CANCELLED" && (
            <Link href={`/invoices/${i.id}/edit`} className="btn-secondary">
              <Edit size={17} />
              تعديل
            </Link>
          )}
          <button onClick={remove} className="btn-danger">
            <Trash2 size={17} />
            حذف
          </button>
          {i.status !== "CANCELLED" && (
            <button onClick={cancel} className="btn-danger">
              <Ban size={17} />
              إلغاء
            </button>
          )}
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={17} />
            طباعة
          </button>
        </div>
      </div>
      <InvoicePrint invoice={i} items={data.items} settings={settings} />
    </div>
  );
}
