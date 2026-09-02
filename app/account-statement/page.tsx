"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate, todayISO } from "@/lib/utils/formatDate";
import type { Invoice, Settings } from "@/types/app";

type Period = "daily" | "monthly" | "yearly";
type Summary = {
  count: number;
  total: number;
  paid: number;
  remaining: number;
};

function bounds(period: Period, cursor: string) {
  const d = new Date(`${cursor}T00:00:00`);
  if (period === "daily") return { from: cursor, to: cursor };
  if (period === "monthly") {
    const y = d.getFullYear(),
      m = d.getMonth();
    return {
      from: `${y}-${String(m + 1).padStart(2, "0")}-01`,
      to: new Date(y, m + 1, 0).toISOString().slice(0, 10),
    };
  }
  return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` };
}

function moveCursor(period: Period, cursor: string, delta: number) {
  const d = new Date(`${cursor}T00:00:00`);
  if (period === "daily") d.setDate(d.getDate() + delta);
  else if (period === "monthly") d.setMonth(d.getMonth() + delta);
  else d.setFullYear(d.getFullYear() + delta);
  return d.toISOString().slice(0, 10);
}
function periodLabel(period: Period, cursor: string) {
  const d = new Date(`${cursor}T00:00:00`);
  if (period === "daily") return formatDate(cursor);
  if (period === "monthly")
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      month: "long",
      year: "numeric",
    }).format(d);
  return String(d.getFullYear());
}

export default function Page() {
  const [period, setPeriod] = useState<Period>("daily");
  const [cursor, setCursor] = useState(todayISO());
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary>({
    count: 0,
    total: 0,
    paid: 0,
    remaining: 0,
  });
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    const b = bounds(period, cursor);
    const qs = new URLSearchParams({ ...b, q, status });
    Promise.all([
      fetch(`/api/invoices?${qs}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([a, s]) => {
        setRows((a.data || []) as Invoice[]);
        setSummary(a.summary || { count: 0, total: 0, paid: 0, remaining: 0 });
        if (s.data) setSettings(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, cursor, q, status]);
  useEffect(() => {
    const t = window.setTimeout(load, 150);
    return () => window.clearTimeout(t);
  }, [load]);
  const money = (n: number) => formatCurrency(n, settings?.currency || "ر.ي");
  const remove = async (id: string) => {
    if (!confirm("هل تريد حذف الفاتورة نهائيًا؟")) return;
    const r = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (r.ok) load();
    else {
      const j = await r.json();
      alert(j.error);
    }
  };
  return (
    <PageContainer
      title="كشف الحساب"
      description="سجل الفواتير والعمليات المالية مع عرض يومي وشهري وسنوي"
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(
                [
                  ["daily", "يومي"],
                  ["monthly", "شهري"],
                  ["yearly", "سنوي"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setPeriod(v)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${period === v ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="mr-auto flex items-center gap-2">
              <button
                className="btn-secondary px-3"
                onClick={() => setCursor(moveCursor(period, cursor, -1))}
              >
                <ChevronRight size={17} />
              </button>
              <div className="min-w-[170px] rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-black">
                {periodLabel(period, cursor)}
              </div>
              <button
                className="btn-secondary px-3"
                onClick={() => setCursor(moveCursor(period, cursor, 1))}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="btn-secondary"
                onClick={() => setCursor(todayISO())}
              >
                <CalendarDays size={17} /> اليوم
              </button>
            </div>
          </div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="عدد الفواتير" value={String(summary.count)} />
          <Stat label="إجمالي المستحق" value={money(summary.total)} />
          <Stat label="إجمالي المدفوع" value={money(summary.paid)} />
          <Stat
            label="إجمالي المتبقي"
            value={money(summary.remaining)}
            danger={summary.remaining > 0}
          />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]" dir="rtl">
            <label className="relative">
              <Search
                size={18}
                className="absolute right-3 top-3 text-slate-400"
              />
              <input
                className="input pr-10"
                placeholder="بحث برقم الفاتورة أو اسم العميل أو الجوال"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">كل الفواتير</option>
              <option value="DUE">عليها مبالغ</option>
              <option value="UNPAID">غير مسددة</option>
              <option value="PARTIALLY_PAID">مسددة جزئيًا</option>
              <option value="PAID">مسددة بالكامل</option>
              <option value="CANCELLED">ملغاة</option>
            </select>
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50">
                <tr className="text-right">
                  <th className="p-4">الفاتورة</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">العميل</th>
                  <th className="p-4">الإجمالي</th>
                  <th className="p-4">المدفوع</th>
                  <th className="p-4">المتبقي</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      لا توجد فواتير ضمن الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  rows.map((i) => (
                    <tr
                      key={i.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4 font-black" dir="ltr">
                        {i.invoice_number}
                      </td>
                      <td className="p-4">{formatDate(i.invoice_date)}</td>
                      <td className="p-4">
                        <div className="font-bold">{i.customer_name}</div>
                        <div className="text-xs text-slate-400" dir="ltr">
                          {i.customer_phone || "—"}
                        </div>
                      </td>
                      <td className="p-4 font-bold">{money(i.total)}</td>
                      <td className="p-4">{money(i.paid)}</td>
                      <td
                        className={`p-4 font-black ${i.remaining > 0 ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {money(i.remaining)}
                      </td>
                      <td className="p-4">
                        <Status status={i.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Link
                            href={`/invoices/${i.id}`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            title="عرض"
                          >
                            <Eye size={17} />
                          </Link>
                          {i.status !== "CANCELLED" && (
                            <Link
                              href={`/invoices/${i.id}/edit`}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                              title="تعديل"
                            >
                              <Edit size={17} />
                            </Link>
                          )}
                          <button
                            onClick={() =>
                              window.open(
                                `/invoices/${i.id}/print`,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            title="طباعة"
                          >
                            <Printer size={17} />
                          </button>
                          <button
                            onClick={() => remove(i.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title="حذف"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
function Stat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div
        className={`mt-2 text-xl font-black ${danger ? "text-red-600" : "text-slate-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
function Status({ status }: { status: Invoice["status"] }) {
  const text =
    status === "PAID"
      ? "مسددة بالكامل"
      : status === "PARTIALLY_PAID"
        ? "مسددة جزئيًا"
        : status === "CANCELLED"
          ? "ملغاة"
          : "عليها مبلغ";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status === "PAID" ? "bg-emerald-50 text-emerald-700" : status === "CANCELLED" ? "bg-slate-100 text-slate-500" : status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}
    >
      {text}
    </span>
  );
}
