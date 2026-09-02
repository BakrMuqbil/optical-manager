"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Printer, Ban, Edit, Trash2 } from "lucide-react";
import {
  InvoicePrint,
  type InvoiceItem,
} from "@/components/printing/InvoicePrint";
import type { Invoice, Settings } from "@/types/app";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<{
    invoice: Invoice;
    items: InvoiceItem[];
  } | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch(`/api/invoices/${id}`).then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "تعذر تحميل الفاتورة");
        }
        return json;
      }),
      fetch("/api/settings").then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "تعذر تحميل الإعدادات");
        }
        return json;
      }),
    ])
      .then(([invoiceResponse, settingsResponse]) => {
        if (!active) return;
        setData(invoiceResponse.data);
        setSettings(settingsResponse.data);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : "تعذر تحميل الفاتورة",
        );
      });

    return () => {
      active = false;
    };
  }, [id]);

  const cancel = async () => {
    if (!data || !confirm("هل تريد إلغاء هذه الفاتورة؟")) return;

    const response = await fetch(`/api/invoices/${data.invoice.id}/cancel`, {
      method: "POST",
    });
    const json = await response.json();
    if (!response.ok) return alert(json.error || "تعذر إلغاء الفاتورة");

    setData((current) =>
      current
        ? { ...current, invoice: { ...current.invoice, status: "CANCELLED" } }
        : current,
    );
  };

  const remove = async () => {
    if (!data) return;
    if (
      !confirm(
        "هل تريد حذف هذه الفاتورة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
      )
    ) {
      return;
    }

    const response = await fetch(`/api/invoices/${data.invoice.id}`, {
      method: "DELETE",
    });
    const json = await response.json();
    if (!response.ok) return alert(json.error || "تعذر حذف الفاتورة");

    router.push("/account-statement");
  };

  if (error) {
    return (
      <div className="p-10 text-center font-bold text-red-600">{error}</div>
    );
  }

  if (!data || !settings) {
    return (
      <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
    );
  }

  const invoice = data.invoice;

  return (
    <main className="mx-auto max-w-5xl p-4 pt-20 md:p-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/account-statement"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
        >
          <ArrowRight size={17} />
          كشف الحساب
        </Link>

        <div className="flex flex-wrap gap-2">
          {invoice.status !== "CANCELLED" && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="btn-secondary"
            >
              <Edit size={17} />
              تعديل
            </Link>
          )}

          <button type="button" onClick={remove} className="btn-danger">
            <Trash2 size={17} />
            حذف
          </button>

          {invoice.status !== "CANCELLED" && (
            <button type="button" onClick={cancel} className="btn-danger">
              <Ban size={17} />
              إلغاء
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="btn-primary"
          >
            <Printer size={17} />
            طباعة
          </button>
        </div>
      </div>

      <InvoicePrint invoice={invoice} items={data.items} settings={settings} />
    </main>
  );
}
