import {
    Wallet,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { StatCard, CardGrid } from "@/components/ui/cards";

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
        <CardGrid>
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
                tone="primary"
            />

            <StatCard
                label="تحصيل ديون قديمة"
                value={money(summary.oldDebtCollection)}
                icon={TrendingUp}
                tone="info"
            />

            <StatCard
                label="مصروفات اليوم"
                value={money(summary.expenses)}
                icon={TrendingDown}
                tone="danger"
            />
        </CardGrid>
    );
}