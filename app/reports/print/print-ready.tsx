"use client";
import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { PeriodClosure, ReportData, ReportPeriod } from "@/lib/reports";

type Props = {
    type: string;
    keyValue: string;
    period: ReportPeriod;
    report: ReportData;
    closure?: PeriodClosure;
    currency: string;
    shopName: string;
};
export default function PrintReady({
    type,
    keyValue,
    period,
    report,
    closure,
    currency,
    shopName
}: Props) {
    useEffect(() => {
        fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "print", type, key: keyValue })
        }).finally(() => setTimeout(() => window.print(), 250));
    }, [type, keyValue]);
    return (
        <main
            dir="rtl"
            className="mx-auto max-w-3xl bg-white p-8 text-black print:max-w-none"
        >
            <header className="mb-8 border-b pb-5 text-center">
                <h1 className="text-2xl font-black">{shopName}</h1>
                <h2 className="mt-2 text-xl font-black">
                    {type === "MONTH"
                        ? "التقرير المالي الشهري"
                        : "التقرير المالي السنوي"}
                </h2>
                <p className="mt-2">
                    {keyValue} — {period.from} إلى {period.to}
                </p>
            </header>
            <section className="grid grid-cols-2 gap-3">
                {[
                    ["عدد الفواتير", report.invoiceCount],
                    ["المبيعات", formatCurrency(report.sales, currency)],
                    ["المقبوضات", formatCurrency(report.collections, currency)],
                    ["الديون المتبقي", formatCurrency(report.remainingDebts, currency)],
                    ["المصروفات", formatCurrency(report.expenses, currency)],
                    [
                        "تحصيل ديون قديمة",
                        formatCurrency(report.oldDebtCollection, currency)
                    ],
                    [
                        "دفعات فواتير الفترة",
                        formatCurrency(report.newInvoicePayments, currency)
                    ],
                    [
                        "الرصيد الافتتاحي",
                        formatCurrency(report.openingBalance, currency)
                    ],
                    [
                        "الرصيد المتوقع",
                        formatCurrency(report.expectedCash, currency)
                    ],
                    [
                        "النقد الفعلي",
                        closure?.actual_cash == null
                            ? "—"
                            : formatCurrency(
                                  Number(closure.actual_cash),
                                  currency
                              )
                    ],
                    [
                        "الفرق",
                        closure?.difference == null
                            ? "—"
                            : formatCurrency(
                                  Number(closure.difference),
                                  currency
                              )
                    ]
                ].map(([l, v]) => (
                    <div
                        className="flex justify-between border p-3"
                        key={String(l)}
                    >
                        <span>{l}</span>
                        <b>{v}</b>
                    </div>
                ))}
            </section>
            <p className="mt-8 border-t pt-4 text-sm">
                هذا التقرير لا يمثل حساب أرباح؛ وهو ملخص للمبيعات والمقبوضات
                والمصروفات وحركة الصندوق.
            </p>
        </main>
    );
}
