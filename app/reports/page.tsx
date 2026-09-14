"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    Lock,
    Printer,
    TrendingUp,
    Wallet,
    AlertCircle,
    Receipt
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { todayISO } from "@/lib/utils/formatDate";
import type { PeriodClosure, ReportData, ReportPeriod } from "@/lib/reports";

type Type = "MONTH" | "YEAR";
type ReportResponse = {
    period: ReportPeriod;
    report: ReportData;
    closure?: PeriodClosure;
    openingBalance: number;
    currency: string;
};

const keyNow = (t: Type) => {
    const today = todayISO();
    return t === "MONTH" ? today.slice(0, 7) : today.slice(0, 4);
};

function shift(t: Type, k: string, d: number) {
    if (t === "YEAR") return String(Number(k) + d);
    const [y, m] = k.split("-").map(Number);
    const x = new Date(y, m - 1 + d, 1);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
    const [type, setType] = useState<Type>("MONTH");
    const [key, setKey] = useState(keyNow("MONTH"));
    const [data, setData] = useState<ReportResponse | null>(null);
    const [closures, setClosures] = useState<PeriodClosure[]>([]);
    const [actual, setActual] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

            const load = useCallback(
        async (showLoading = true) => {
            if (showLoading) setLoading(true);
            try {
                const r = await fetch(`/api/reports?type=${type}&key=${key}`, {
                    cache: "no-store"
                });
                const j: { success?: boolean; data?: ReportResponse } =
                    await r.json();
                if (j.success && j.data) {
                    setData(j.data);
                    setActual(
                        j.data.closure?.actual_cash != null
                            ? String(j.data.closure.actual_cash)
                            : ""
                    );
                }
                const l = await fetch(`/api/reports?action=list&type=${type}`, {
                    cache: "no-store"
                });
                const lj: { success?: boolean; data?: PeriodClosure[] } =
                    await l.json();
                if (lj.success) setClosures(lj.data ?? []);
            } finally {
                if (showLoading) setLoading(false);
            }
        },
        [type, key]
    );

    useEffect(() => {
        let ignore = false;

        // استدعاء غير متزامن داخل الموقت لمنع تحديث الحالة اللحظي المباشر داخل الـ Effect
        const timer = setTimeout(() => {
            load(true).catch(() => {
                if (ignore) return;
            });
        }, 0);

        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [load]);



    const currency = data?.currency ?? "ر.ي";
    const print = () =>
        window.open(
            `/reports/print?type=${type}&key=${encodeURIComponent(key)}`,
            "_blank",
            "noopener,noreferrer"
        );

    const close = async () => {
        if (actual === "") {
            alert("أدخل النقد الفعلي أولًا");
            return;
        }
        if (
            !confirm(
                `تأكيد إغلاق ${type === "MONTH" ? "الشهر" : "السنة"} ${key}؟`
            )
        )
            return;
        setBusy(true);
        try {
            const r = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "close",
                    type,
                    key,
                    actualCash: Number(actual),
                    openingBalance: data?.report.openingBalance
                })
            });
            const j: { success?: boolean; error?: string } = await r.json();
            if (!r.ok || !j.success) {
                alert(j.error ?? "تعذر الإغلاق");
                return;
            }
            await load();
        } finally {
            setBusy(false);
        }
    };

    return (
        <PageContainer
            title="التقارير"
            description="تقارير شهرية وسنوية وإغلاق الفترات المالية."
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div
                        className="flex rounded-xl border p-1"
                        style={{ borderColor: "var(--border)" }}
                    >
                        {(
                            [
                                ["MONTH", "شهري"],
                                ["YEAR", "سنوي"]
                            ] as const
                        ).map(([v, l]) => (
                            <button
                                key={v}
                                onClick={() => {
                                    setType(v);
                                    setKey(keyNow(v));
                                }}
                                className="rounded-lg px-5 py-2 text-sm font-black transition-colors"
                                style={
                                    type === v
                                        ? {
                                              background: "var(--primary)",
                                              color: "var(--text-on-primary)"
                                          }
                                        : { color: "var(--text-secondary)" }
                                }
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <Link href="/financial" className="btn-secondary">
                        الإدارة المالية
                    </Link>
                </div>

                <section className="surface-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black">
                                {type === "MONTH"
                                    ? "التقرير الشهري"
                                    : "التقرير السنوي"}{" "}
                                — {key}
                            </h2>
                            <p
                                className="mt-1 text-sm"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                {data?.period.from} ← {data?.period.to}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn-secondary"
                                onClick={() => setKey(shift(type, key, -1))}
                            >
                                <ChevronRight size={16} />
                                السابق
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setKey(shift(type, key, 1))}
                            >
                                التالي
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="surface-card p-10 text-center">
                        جاري تحميل التقرير...
                    </div>
                ) : (
                    data && (
                        <>
                            {/* شبكة البطائق المصممة بنفس أسلوب لوحة التحكم */}
                            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                <Card
                                    label="عدد الفواتير"
                                    value={String(data.report.invoiceCount)}
                                    Icon={FileText}
                                    tone="secondary"
                                />
                                <Card
                                    label="إجمالي المبيعات"
                                    value={formatCurrency(
                                        data.report.sales,
                                        currency
                                    )}
                                    Icon={TrendingUp}
                                    tone="primary"
                                />
                                <Card
                                    label="المقبوضات"
                                    value={formatCurrency(
                                        data.report.collections,
                                        currency
                                    )}
                                    Icon={Wallet}
                                    tone="success"
                                />
                                <Card
                                    label="الديون المتبقية"
                                    value={formatCurrency(
                                        data.report.remainingDebts,
                                        currency
                                    )}
                                    Icon={AlertCircle}
                                    tone={data.report.remainingDebts > 0 ? "danger" : "success"}
                                />
                                <Card
                                    label="المصروفات"
                                    value={formatCurrency(
                                        data.report.expenses,
                                        currency
                                    )}
                                    Icon={Receipt}
                                    tone="warning"
                                />
                            </section>

                            <section className="surface-card p-5">
                                <h3 className="mb-4 text-lg font-black">
                                    ملخص الصندوق
                                </h3>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {[
                                        [
                                            "الرصيد الافتتاحي",
                                            data.report.openingBalance
                                        ],
                                        [
                                            "تحصيل ديون قديمة",
                                            data.report.oldDebtCollection
                                        ],
                                        [
                                            "دفعات فواتير الفترة",
                                            data.report.newInvoicePayments
                                        ],
                                        [
                                            "الرصيد المتوقع",
                                            data.report.expectedCash
                                        ],
                                        [
                                            "النقد الفعلي",
                                            data.closure?.actual_cash
                                        ],
                                        ["الفرق", data.closure?.difference]
                                    ].map(([l, v]) => (
                                        <div
                                            className="flex justify-between border-b pb-2"
                                            key={String(l)}
                                        >
                                            <span>{l}</span>
                                            <b>
                                                {v == null
                                                    ? "—"
                                                    : formatCurrency(
                                                          Number(v),
                                                          currency
                                                      )}
                                            </b>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {type === "YEAR" && (
                                <section className="surface-card overflow-hidden">
                                    <div className="border-b p-5">
                                        <h3 className="font-black">
                                            تفصيل الأشهر
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th>الشهر</th>
                                                    <th>الفواتير</th>
                                                    <th>المبيعات</th>
                                                    <th>المقبوضات</th>
                                                    <th>المصروفات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.report.monthly.map(m => (
                                                    <tr key={m.key}>
                                                        <td className="font-bold">
                                                            {m.key}
                                                        </td>
                                                        <td>
                                                            {m.invoiceCount}
                                                        </td>
                                                        <td>
                                                            {formatCurrency(
                                                                m.sales,
                                                                currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            {formatCurrency(
                                                                m.collections,
                                                                currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            {formatCurrency(
                                                                m.expenses,
                                                                currency
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            <section className="surface-card p-5">
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => void load()}
                                    >
                                        <FileText size={17} />
                                        إنشاء التقرير
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={print}
                                    >
                                        <Printer size={17} />
                                        طباعة تقرير
                                    </button>
                                    {data.closure?.status === "CLOSED" ? (
                                        <span className="status-success">
                                            <Lock size={16} />
                                            الصندوق مغلق
                                        </span>
                                    ) : (
                                        <>
                                            <input
                                                className="input max-w-xs"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={actual}
                                                onChange={e =>
                                                    setActual(e.target.value)
                                                }
                                                placeholder="النقد الفعلي عند الإغلاق"
                                            />
                                            <button
                                                className="btn-secondary"
                                                disabled={busy}
                                                onClick={close}
                                            >
                                                <Lock size={17} />
                                                {busy
                                                    ? "جاري الإغلاق..."
                                                    : "إغلاق الصندوق"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </section>
                        </>
                    )
                )}

                <section className="surface-card overflow-hidden">
                    <div className="border-b p-5">
                        <h3 className="font-black">
                            سجل إغلاقات{" "}
                            {type === "MONTH" ? "الأشهر" : "السنوات"}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th>الفترة</th>
                                    <th>المبيعات</th>
                                    <th>المقبوضات</th>
                                    <th>المصروفات</th>
                                    <th>المتوقع</th>
                                    <th>الفعلي</th>
                                    <th>الحالة</th>
                                    <th>إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {closures.map(c => (
                                    <tr key={c.id}>
                                        <td className="font-bold">
                                            {c.period_key}
                                        </td>
                                        <td>
                                            {formatCurrency(
                                                Number(c.total_sales || 0),
                                                currency
                                            )}
                                        </td>
                                        <td>
                                            {formatCurrency(
                                                Number(
                                                    c.total_collections || 0
                                                ),
                                                currency
                                            )}
                                        </td>
                                        <td>
                                            {formatCurrency(
                                                Number(c.total_expenses || 0),
                                                currency
                                            )}
                                        </td>
                                        <td>
                                            {formatCurrency(
                                                Number(c.expected_cash || 0),
                                                currency
                                            )}
                                        </td>
                                        <td>
                                            {c.actual_cash == null
                                                ? "—"
                                                : formatCurrency(
                                                      Number(c.actual_cash),
                                                      currency
                                                  )}
                                        </td>
                                        <td>
                                            {c.status === "CLOSED" ? (
                                                <span className="status-success">
                                                    مغلق
                                                </span>
                                            ) : (
                                                <span className="status-warning">
                                                    مفتوح
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="btn-secondary px-3 py-1.5 text-xs"
                                                onClick={() =>
                                                    setKey(c.period_key)
                                                }
                                            >
                                                <FileText size={14} />
                                                عرض
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </PageContainer>
    );
}

{/* مكون البطاقة Card المأخوذ من تصميم لوحة التحكم */}
function Card({
    label,
    value,
    Icon,
    tone = "secondary"
}: {
    label: string;
    value: string;
    Icon: React.ElementType;
    tone?: "success" | "warning" | "danger" | "primary" | "secondary";
}) {
    // تحديد خلفية الأيقونة بناءً على النغمة (Tone)
    const iconBgMap = {
        success: "var(--success-soft)",
        danger: "var(--danger-soft)",
        warning: "rgba(245, 158, 11, 0.12)",
        primary: "rgba(59, 130, 246, 0.12)",
        secondary: "var(--surface-muted)"
    };

    // تحديد لون الأيقونة ولون النص بناءً على النغمة (Tone)
    const colorMap = {
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "rgb(217, 119, 6)",
        primary: "var(--primary)",
        secondary: "var(--text-secondary)"
    };

    const iconBg = iconBgMap[tone] || iconBgMap.secondary;
    const toneColor = colorMap[tone] || colorMap.secondary;
    
    // إذا كانت النغمة ثانوية (عادية) يظل الرقم باللون الرئيسي المعتاد للصوص
    const valueColor = tone === "secondary" ? "var(--text-primary)" : toneColor;

    return (
        <div
            className="rounded-2xl border p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)"
            }}
        >
            <div className="flex items-center justify-between">
                <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                >
                    {label}
                </span>
                <span
                    className="rounded-xl p-2.5"
                    style={{ background: iconBg, color: toneColor }}
                >
                    <Icon size={20} />
                </span>
            </div>
            <div
                className="mt-4 text-2xl font-black"
                style={{ color: valueColor }}
            >
                {value}
            </div>
        </div>
    );
}
