"use client";

import {
    Wallet,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type Summary = {
    sales: number;
    collections: number;
    expenses: number;
    oldDebtCollection: number;
    todayPaymentsOnNewInvoices: number;
};

type Props = {
    summary: Summary | null;
    currency: string;
};

export function FinancialSummary({
    summary,
    currency
}: Props) {
    if (!summary) return null;

    const money = (value: number) =>
        formatCurrency(value, currency);

    return (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                label="مبيعات اليوم"
                value={money(summary.sales)}
                icon={TrendingUp}
                tone="success"
            />

            <StatCard
                label="إجمالي المقبوضات"
                value={money(summary.collections)}
                icon={Wallet}
            />

            <StatCard
                label="تحصيل ديون قديمة"
                value={money(summary.oldDebtCollection)}
                icon={TrendingUp}
            />

            <StatCard
                label="مصروفات اليوم"
                value={money(summary.expenses)}
                icon={TrendingDown}
                tone="danger"
            />
        </section>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    tone?: "success" | "danger";
}) {
    const color =
        tone === "success"
            ? "var(--success)"
            : tone === "danger"
              ? "var(--danger)"
              : "var(--text-primary)";

    return (
        <div className="surface-card">
            <div className="flex items-center justify-between">
                <span
                    className="text-xs font-bold"
                    style={{
                        color: "var(--text-muted)"
                    }}
                >
                    {label}
                </span>

                <Icon size={18} style={{ color }} />
            </div>

            <div
                className="mt-2 text-xl font-black"
                style={{ color }}
            >
                {value}
            </div>
        </div>
    );
}
