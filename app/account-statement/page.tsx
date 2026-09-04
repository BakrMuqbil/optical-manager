"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    Inbox,
    Printer,
    Search,
    Trash2
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
            to: new Date(y, m + 1, 0).toISOString().slice(0, 10)
        };
    }
    return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` };
}

function moveCursor(period: Period, cursor: string, delta: number): string {
    // تحليل التاريخ المحلي بدون تأثير التوقيت العالمي UTC
    const [year, month, day] = cursor.split("-").map(Number);
    const d = new Date(year, month - 1, day);

    if (period === "daily") {
        d.setDate(d.getDate() + delta);
    } else if (period === "monthly") {
        d.setMonth(d.getMonth() + delta);
    } else {
        d.setFullYear(d.getFullYear() + delta);
    }

    // استخراج السنة والشهر واليوم بالتوقيت المحلي الصحيح
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${dt}`;
}
function periodLabel(period: Period, cursor: string) {
    const d = new Date(`${cursor}T00:00:00`);
    if (period === "daily") return formatDate(cursor);
    if (period === "monthly")
        return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
            month: "long",
            year: "numeric"
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
        remaining: 0
    });
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const load = useCallback(() => {
        setLoading(true);
        const b = bounds(period, cursor);
        const qs = new URLSearchParams({ ...b, q, status });
        Promise.all([
            fetch(`/api/invoices?${qs}`).then(r => r.json()),
            fetch("/api/settings").then(r => r.json())
        ])
            .then(([a, s]) => {
                setRows((a.data || []) as Invoice[]);
                setSummary(
                    a.summary || { count: 0, total: 0, paid: 0, remaining: 0 }
                );
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
                {/* Period switcher */}
                <section className="surface-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* أزرار اختيار الفترة */}
                        <div
                            className="flex w-full sm:w-auto rounded-xl p-1"
                            style={{ background: "var(--surface-muted)" }}
                        >
                            {(
                                [
                                    ["daily", "يومي"],
                                    ["monthly", "شهري"],
                                    ["yearly", "سنوي"]
                                ] as const
                            ).map(([v, l]) => (
                                <button
                                    key={v}
                                    onClick={() => setPeriod(v)}
                                    className="flex-1 sm:flex-initial rounded-lg px-4 py-2 text-sm font-bold transition-colors text-center"
                                    style={
                                        period === v
                                            ? {
                                                  background: "var(--surface)",
                                                  color: "var(--text-primary)",
                                                  boxShadow: "var(--shadow-sm)"
                                              }
                                            : { color: "var(--text-muted)" }
                                    }
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        {/* أزرار التنقل والتاريخ */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                            <button
                                className="btn-secondary px-3"
                                onClick={() =>
                                    setCursor(moveCursor(period, cursor, -1))
                                }
                                aria-label="الفترة السابقة"
                            >
                                <ChevronRight size={17} />
                            </button>

                            <div
                                className="min-w-[140px] sm:min-w-[170px] flex-1 sm:flex-none rounded-xl border px-3 py-2 text-center text-sm font-black"
                                style={{
                                    borderColor: "var(--border)",
                                    color: "var(--text-primary)"
                                }}
                            >
                                {periodLabel(period, cursor)}
                            </div>

                            <button
                                className="btn-secondary px-3"
                                onClick={() =>
                                    setCursor(moveCursor(period, cursor, 1))
                                }
                                aria-label="الفترة التالية"
                            >
                                <ChevronLeft size={17} />
                            </button>

                            <button
                                className="btn-secondary whitespace-nowrap"
                                onClick={() => setCursor(todayISO())}
                            >
                                <CalendarDays size={17} /> اليوم
                            </button>
                        </div>
                    </div>
                </section>

                {/* Summary stats */}
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat label="عدد الفواتير" value={String(summary.count)} />
                    <Stat label="إجمالي المستحق" value={money(summary.total)} />
                    <Stat
                        label="إجمالي المدفوع"
                        value={money(summary.paid)}
                        tone="success"
                    />
                    <Stat
                        label="إجمالي المتبقي"
                        value={money(summary.remaining)}
                        danger={summary.remaining > 0}
                    />
                </section>

                {/* Filters */}
                <section className="surface-card">
                    <div
                        className="grid gap-3 md:grid-cols-[1fr_200px]"
                        dir="rtl"
                    >
                        <label className="relative">
                            <Search
                                size={18}
                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--text-muted)" }}
                            />
                            <input
                                className="input pr-11"
                                placeholder="بحث برقم الفاتورة أو اسم العميل أو الجوال"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                            />
                        </label>
                        <select
                            className="input"
                            value={status}
                            onChange={e => setStatus(e.target.value)}
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

                {/* Table */}
                <section
                    className="overflow-hidden rounded-2xl border shadow-sm"
                    style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)"
                    }}
                >
                    <div className="thin-scrollbar overflow-x-auto">
                        <table className="data-table min-w-[900px]">
                            <thead>
                                <tr>
                                    <th>الفاتورة</th>
                                    <th>التاريخ</th>
                                    <th>العميل</th>
                                    <th>الإجمالي</th>
                                    <th>المدفوع</th>
                                    <th>المتبقي</th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="p-12 text-center"
                                            style={{
                                                color: "var(--text-muted)"
                                            }}
                                        >
                                            جاري التحميل...
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="p-14 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <span
                                                    className="flex h-12 w-12 items-center justify-center rounded-full"
                                                    style={{
                                                        background:
                                                            "var(--surface-muted)",
                                                        color: "var(--text-muted)"
                                                    }}
                                                >
                                                    <Inbox size={22} />
                                                </span>
                                                <p
                                                    className="text-sm font-semibold"
                                                    style={{
                                                        color: "var(--text-muted)"
                                                    }}
                                                >
                                                    لا توجد فواتير ضمن الفترة
                                                    المحددة.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map(i => (
                                        <tr key={i.id}>
                                            <td
                                                className="font-black"
                                                dir="ltr"
                                                style={{
                                                    color: "var(--text-primary)"
                                                }}
                                            >
                                                {i.invoice_number}
                                            </td>
                                            <td
                                                style={{
                                                    color: "var(--text-secondary)"
                                                }}
                                            >
                                                {formatDate(i.invoice_date)}
                                            </td>
                                            <td>
                                                <div
                                                    className="font-bold"
                                                    style={{
                                                        color: "var(--text-primary)"
                                                    }}
                                                >
                                                    {i.customer_name}
                                                </div>
                                                <div
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--text-muted)"
                                                    }}
                                                    dir="ltr"
                                                >
                                                    {i.customer_phone || "—"}
                                                </div>
                                            </td>
                                            <td
                                                className="font-bold"
                                                style={{
                                                    color: "var(--text-primary)"
                                                }}
                                            >
                                                {money(i.total)}
                                            </td>
                                            <td
                                                style={{
                                                    color: "var(--text-secondary)"
                                                }}
                                            >
                                                {money(i.paid)}
                                            </td>
                                            <td
                                                className="font-black"
                                                style={{
                                                    color:
                                                        i.remaining > 0
                                                            ? "var(--danger)"
                                                            : "var(--success)"
                                                }}
                                            >
                                                {money(i.remaining)}
                                            </td>
                                            <td>
                                                <Status status={i.status} />
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <Link
                                                        href={`/invoices/${i.id}`}
                                                        className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-muted)]"
                                                        style={{
                                                            color: "var(--text-secondary)"
                                                        }}
                                                        title="عرض"
                                                    >
                                                        <Eye size={17} />
                                                    </Link>
                                                    {i.status !==
                                                        "CANCELLED" && (
                                                        <Link
                                                            href={`/invoices/${i.id}/edit`}
                                                            className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-muted)]"
                                                            style={{
                                                                color: "var(--text-secondary)"
                                                            }}
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
                                                                "noopener,noreferrer"
                                                            )
                                                        }
                                                        className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-muted)]"
                                                        style={{
                                                            color: "var(--text-secondary)"
                                                        }}
                                                        title="طباعة"
                                                    >
                                                        <Printer size={17} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            remove(i.id)
                                                        }
                                                        className="rounded-lg p-2 transition-colors hover:bg-[var(--danger-soft)]"
                                                        style={{
                                                            color: "var(--danger)"
                                                        }}
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
    tone
}: {
    label: string;
    value: string;
    danger?: boolean;
    tone?: "success";
}) {
    const valueColor = danger
        ? "var(--danger)"
        : tone === "success"
          ? "var(--success)"
          : "var(--text-primary)";
    return (
        <div className="surface-card">
            <div
                className="text-xs font-bold"
                style={{ color: "var(--text-muted)" }}
            >
                {label}
            </div>
            <div
                className="mt-2 text-xl font-black"
                style={{ color: valueColor }}
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
    const style =
        status === "PAID"
            ? { background: "var(--success-soft)", color: "var(--success)" }
            : status === "CANCELLED"
              ? {
                    background: "var(--surface-muted)",
                    color: "var(--text-muted)"
                }
              : status === "PARTIALLY_PAID"
                ? { background: "var(--warning-soft)", color: "var(--warning)" }
                : { background: "var(--danger-soft)", color: "var(--danger)" };
    return (
        <span
            className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
            style={style}
        >
            {text}
        </span>
    );
}
