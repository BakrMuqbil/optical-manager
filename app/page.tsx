import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Plus,
    Wallet,
    CreditCard,
    AlertCircle
} from "lucide-react";
import { db, getSettings } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { PeriodClosureAlert } from "@/components/financial/PeriodClosureAlert";
import { StatCard, CardGrid } from "@/components/ui/cards";
export const dynamic = "force-dynamic";

export default function DashboardPage() {
    const settings = getSettings() as { currency?: string } | undefined;
    const currency = settings?.currency || "ر.ي";
    const stats = db
        .prepare(
            `SELECT COUNT(*) count, COALESCE(SUM(total),0) total, COALESCE(SUM(paid),0) paid, COALESCE(SUM(remaining),0) remaining FROM invoices WHERE status <> 'CANCELLED'`
        )
        .get() as {
        count: number;
        total: number;
        paid: number;
        remaining: number;
    };
    const recent = db
        .prepare(
            `SELECT i.id,i.invoice_number,i.invoice_date,i.total,i.paid,i.remaining,i.status,c.name customer_name,c.phone customer_phone FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.status<>'CANCELLED' ORDER BY i.invoice_date DESC,i.created_at DESC LIMIT 6`
        )
        .all() as Array<{
        id: string;
        invoice_number: string;
        invoice_date: string;
        total: number;
        paid: number;
        remaining: number;
        status: string;
        customer_name: string;
        customer_phone: string | null;
    }>;

    return (
        <div className="mx-auto w-full max-w-7xl p-4 pt-20 md:p-8 md:pt-10">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-3">
                    <span
                        className="mt-1 hidden h-9 w-1.5 shrink-0 rounded-full sm:block"
                        style={{ background: "var(--primary)" }}
                        aria-hidden
                    />
                    <div>
                        <p
                            className="mb-1.5 text-sm font-bold"
                            style={{ color: "var(--text-muted)" }}
                        >
                            مرحبًا بك
                        </p>
                        <h1
                            className="text-3xl font-black tracking-tight"
                            style={{ color: "var(--text-primary)" }}
                        >
                            لوحة التحكم
                        </h1>
                        <p
                            className="mt-2 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            ملخص سريع للفواتير والمبالغ المستحقة والمتبقية.
                        </p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-2 self-start rounded-full px-4 py-2 text-xs font-bold sm:self-auto"
                    style={{
                        background: "var(--success-soft)",
                        color: "var(--success)"
                    }}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--success)" }}
                        aria-hidden
                    />
                    يعمل محليًا
                </div>
            </header>

            <PeriodClosureAlert />

            <CardGrid>
    <StatCard
        label="عدد الفواتير"
        value={String(stats.count)}
        icon={FileText}
        tone="primary"
    />

    <StatCard
        label="إجمالي المستحق"
        value={formatCurrency(stats.total, currency)}
        icon={Wallet}
        tone="info"
    />

    <StatCard
        label="إجمالي المدفوع"
        value={formatCurrency(stats.paid, currency)}
        icon={CreditCard}
        tone="success"
    />

    <StatCard
        label="إجمالي المتبقي"
        value={formatCurrency(stats.remaining, currency)}
        icon={AlertCircle}
        tone={stats.remaining > 0 ? "danger" : "success"}
    />
</CardGrid>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
                <Link
                    href="/invoices/new"
                    className="flex items-center justify-between rounded-2xl p-5 font-bold shadow-sm transition-transform hover:-translate-y-0.5"
                    style={{
                        background: "var(--primary)",
                        color: "var(--text-on-primary)"
                    }}
                >
                    <span className="flex items-center gap-3">
                        <Plus size={20} />
                        فاتورة جديدة
                    </span>
                    <ArrowLeft size={18} />
                </Link>
                <Link
                    href="/invoices"
                    className="flex items-center justify-between rounded-2xl border p-5 font-bold shadow-sm transition-transform hover:-translate-y-0.5"
                    style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)"
                    }}
                >
                    <span className="flex items-center gap-3">
                        <FileText size={20} />
                        فتح الفواتير
                    </span>
                    <ArrowLeft size={18} />
                </Link>
            </section>

            <section
                className="mt-6 overflow-hidden rounded-2xl border shadow-sm"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)"
                }}
            >
                <div
                    className="flex items-center justify-between border-b p-5"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div>
                        <h2
                            className="font-black"
                            style={{ color: "var(--text-primary)" }}
                        >
                            آخر الفواتير
                        </h2>
                        <p
                            className="mt-1 text-xs"
                            style={{ color: "var(--text-muted)" }}
                        >
                            أحدث العمليات المحفوظة
                        </p>
                    </div>
                    <Link
                        href="/invoices"
                        className="text-sm font-bold"
                        style={{ color: "var(--primary)" }}
                    >
                        الفواتير
                    </Link>
                </div>
                {recent.length ? (
                    <div
                        className="divide-y"
                        style={{ borderColor: "var(--border)" }}
                    >
                        {recent.map(i => (
                            <Link
                                href={`/invoices/${i.id}`}
                                key={i.id}
                                className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--surface-muted)]"
                            >
                                <div>
                                    <p
                                        className="font-bold"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {i.customer_name}
                                    </p>
                                    <p
                                        className="mt-1 text-xs"
                                        style={{ color: "var(--text-muted)" }}
                                        dir="ltr"
                                    >
                                        {i.invoice_number} • {i.invoice_date} •{" "}
                                        {i.customer_phone || "بدون جوال"}
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p
                                        className="font-black"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {formatCurrency(i.total, currency)}
                                    </p>
                                    <p
                                        className="mt-1 text-xs font-bold"
                                        style={{
                                            color:
                                                i.remaining > 0
                                                    ? "var(--danger)"
                                                    : "var(--success)"
                                        }}
                                    >
                                        {i.remaining > 0
                                            ? `متبقي ${formatCurrency(i.remaining, currency)}`
                                            : "مسددة بالكامل"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div
                        className="p-10 text-center text-sm"
                        style={{ color: "var(--text-muted)" }}
                    >
                        لا توجد فواتير بعد.
                    </div>
                )}
            </section>
        </div>
    );
}

