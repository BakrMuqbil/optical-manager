"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Edit,
  Eye,
  Receipt,
  Plus,
  Phone,
  MapPin,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { CustomerProfile, Settings } from "@/types/app";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CustomerProfile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [r, s] = await Promise.all([
          fetch(`/api/customers/${id}`),
          fetch("/api/settings"),
        ]);
        const j = await r.json();
        const sj = await s.json();
        
        if (isMounted) {
          if (j.success) setData(j.data as CustomerProfile);
          else setData(null);
          if (sj.success) setSettings(sj.data as Settings);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setData(null);
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const remove = async () => {
    if (!data) return;
    if (
      !confirm(
        `هل تريد أرشفة العميل "${data.customer.name}"؟ سيتم إخفاؤه من قائمة العملاء ولن تُحذف الفواتير والفحوصات التاريخية.`,
      )
    )
      return;
    const r = await fetch(`/api/customers/${data.customer.id}`, {
      method: "DELETE",
    });
    const j = await r.json();
    if (!r.ok) return alert(j.error || "تعذر حذف العميل");
    router.push("/customers");
  };

  if (loading)
    return (
      <div className="p-12 text-center text-slate-400">
        جاري تحميل ملف العميل...
      </div>
    );
  if (!data) return <div className="p-12 text-center">العميل غير موجود</div>;
  const c = data.customer;
  const currency = settings?.currency || "ر.ي";

  return (
    <div className="mx-auto max-w-6xl p-4 pt-20 md:p-8">
      <Link
        href="/customers"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
      >
        <ArrowRight size={17} />
        العودة للعملاء
      </Link>
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-400">{c.customer_number}</p>
            <h1 className="mt-1 text-3xl font-black">{c.name}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
              {c.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={15} />
                  {c.phone}
                </span>
              )}
              {c.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={15} />
                  {c.address}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/customers/${c.id}/edit`} className="btn-light">
              <Edit size={17} />
              تعديل
            </Link>
            <button onClick={remove} className="btn-light text-red-200">
              <Trash2 size={17} />
              أرشفة
            </button>
            <Link href={`/customers/${c.id}/exams/new`} className="btn-light">
              <Plus size={17} />
              فحص جديد
            </Link>
            <Link
              href={`/invoices/new?customerId=${c.id}`}
              className="btn-light"
            >
              <Receipt size={17} />
              فاتورة جديدة
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-black">سجل فحوصات النظر</h2>
              <p className="mt-1 text-xs text-slate-400">الأحدث أولًا</p>
            </div>
            <Eye className="text-indigo-500" size={20} />
          </div>
          <div className="divide-y divide-slate-100">
            {data.exams.length ? (
              data.exams.map((e) => (
                <div key={e.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">
                        {e.exam_number}
                      </span>
                      <span className="mr-2 text-xs text-slate-400">
                        {formatDate(e.exam_date)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href={`/exams/${e.id}/edit`}
                        className="text-xs font-bold text-slate-500"
                      >
                        تعديل
                      </Link>
                      <Link
                        href={`/exams/${e.id}`}
                        className="text-xs font-bold text-indigo-600"
                      >
                        عرض
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-indigo-50 p-3">
                      <b>OD</b>
                      <div className="mt-1 text-slate-600">
                        {e.od_sph ?? "—"} / {e.od_cyl ?? "—"} ×{" "}
                        {e.od_axis ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-3">
                      <b>OS</b>
                      <div className="mt-1 text-slate-600">
                        {e.os_sph ?? "—"} / {e.os_cyl ?? "—"} ×{" "}
                        {e.os_axis ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-sm text-slate-400">
                لا توجد فحوصات مسجلة.
              </div>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-black">سجل الفواتير</h2>
              <p className="mt-1 text-xs text-slate-400">
                جميع الفواتير المرتبطة بالعميل
              </p>
            </div>
            <Receipt className="text-emerald-500" size={20} />
          </div>
          <div className="divide-y divide-slate-100">
            {data.invoices.length ? (
              data.invoices.map((i) => (
                <Link
                  key={i.id}
                  href={`/invoices/${i.id}`}
                  className="flex items-center justify-between p-5 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-bold">{i.invoice_number}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(i.invoice_date)}
                      {i.exam_id ? " • فحص مرتبط" : ""}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-black">
                      {formatCurrency(i.total, currency)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      متبقي: {formatCurrency(i.remaining, currency)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-10 text-center text-sm text-slate-400">
                لا توجد فواتير مسجلة.
              </div>
            )}
          </div>
        </section>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-black">ملاحظات العميل</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
          {c.notes || "لا توجد ملاحظات."}
        </p>
      </div>
    </div>
  );
}
