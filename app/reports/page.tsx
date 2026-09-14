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
import { StatCard, CardGrid, SummaryCard } from "@/components/ui/cards";

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
    if (t === "YEAR") {
        return String(Number(k) + d);
    }

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
            if (showLoading) {
                setLoading(true);
            }

            try {
                const r = await fetch(`/api/reports?type=${type}&key=${key}`, {
                    cache: "no-store"
                });

                const j: {
                    success?: boolean;
                    data?: ReportResponse;
                } = await r.json();

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

                const lj: {
                    success?: boolean;
                    data?: PeriodClosure[];
                } = await l.json();

                if (lj.success) {
                    setClosures(lj.data ?? []);
                }
            } finally {
                if (showLoading) {
                    setLoading(false);
                }
            }
        },
        [type, key]
    );

    useEffect(() => {
        let ignore = false;

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
        ) {
            return;
        }

        setBusy(true);

        try {
            const r = await fetch("/api/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "close",
                    type,
                    key,
                    actualCash: Number(actual),
                    openingBalance: data?.report.openingBalance
                })
            });

            const j: {
                success?: boolean;
                error?: string;
            } = await r.json();

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
                        style={{
                            borderColor: "var(--border)"
                        }}
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
                                        : {
                                              color: "var(--text-secondary)"
                                          }
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
                                style={{
                                    color: "var(--text-secondary)"
                                }}
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
                            <CardGrid>
                                <StatCard
                                    label="عدد الفواتير"
                                    value={String(data.report.invoiceCount)}
                                    icon={FileText}
                                    tone="neutral"
                                />

                                <StatCard
                                    label="إجمالي المبيعات"
                                    value={formatCurrency(
                                        data.report.sales,
                                        currency
                                    )}
                                    icon={TrendingUp}
                                    tone="primary"
                                />

                                <StatCard
                                    label="المقبوضات"
                                    value={formatCurrency(
                                        data.report.collections,
                                        currency
                                    )}
                                    icon={Wallet}
                                    tone="success"
                                />

                                <StatCard
                                    label="الديون المتبقية"
                                    value={formatCurrency(
                                        data.report.remainingDebts,
                                        currency
                                    )}
                                    icon={AlertCircle}
                                    tone={
                                        data.report.remainingDebts > 0
                                            ? "danger"
                                            : "success"
                                    }
                                />

                                <StatCard
                                    label="المصروفات"
                                    value={formatCurrency(
                                        data.report.expenses,
                                        currency
                                    )}
                                    icon={Receipt}
                                    tone="warning"
                                />
                            </CardGrid>

                            <SummaryCard
                                title="ملخص الصندوق"
                                items={[
                                    {
                                        label: "الرصيد الافتتاحي",
                                        value: formatCurrency(
                                            Number(data.report.openingBalance),
                                            currency
                                        ),
                                        tone: "primary"
                                    },
                                    {
                                        label: "تحصيل ديون قديمة",
                                        value: formatCurrency(
                                            Number(
                                                data.report.oldDebtCollection
                                            ),
                                            currency
                                        ),
                                        tone: "info"
                                    },
                                    {
                                        label: "دفعات فواتير الفترة",
                                        value: formatCurrency(
                                            Number(
                                                data.report.newInvoicePayments
                                            ),
                                            currency
                                        ),
                                        tone: "success"
                                    },
                                    {
                                        label: "الرصيد المتوقع",
                                        value: formatCurrency(
                                            Number(data.report.expectedCash),
                                            currency
                                        ),
                                        tone: "primary"
                                    },
                                    {
                                        label: "النقد الفعلي",
                                        value:
                                            data.closure?.actual_cash == null
                                                ? "—"
                                                : formatCurrency(
                                                      Number(
                                                          data.closure
                                                              .actual_cash
                                                      ),
                                                      currency
                                                  ),
                                        tone: "info"
                                    },
                                    {
                                        label: "الفرق",
                                        value:
                                            data.closure?.difference == null
                                                ? "—"
                                                : formatCurrency(
                                                      Number(
                                                          data.closure
                                                              .difference
                                                      ),
                                                      currency
                                                  ),
                                        tone:
                                            data.closure?.difference != null &&
                                            Number(data.closure.difference) < 0
                                                ? "danger"
                                                : "success"
                                    }
                                ]}
                            />

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
