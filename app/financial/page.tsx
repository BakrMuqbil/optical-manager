"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, TrendingDown } from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { todayISO } from "@/lib/utils/formatDate";
import type {
    CashClosure,
    FinancialTransaction,
    Invoice,
    Settings
} from "@/types/app";

import { FinancialSummary } from "./components/FinancialSummary";
import { FinancialTransactionsTable } from "./components/FinancialTransactionsTable";
import { OutstandingDebtsTable } from "./components/OutstandingDebtsTable";
import { CashClosuresTable } from "./components/CashClosuresTable";
import { ExpenseForm } from "./components/ExpenseForm";

type Summary = {
    sales: number;
    collections: number;
    expenses: number;
    oldDebtCollection: number;
    todayPaymentsOnNewInvoices: number;
};

type TablePagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

const EMPTY_PAGINATION: TablePagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
};

export default function FinancialPage() {
    const [date, setDate] = useState(todayISO());

    const [settings, setSettings] =
        useState<Settings | null>(null);

    const [summary, setSummary] =
        useState<Summary | null>(null);

    const [transactions, setTransactions] =
        useState<FinancialTransaction[]>([]);

    const [debts, setDebts] =
        useState<Invoice[]>([]);

    const [closure, setClosure] =
        useState<CashClosure | null>(null);

    const [closures, setClosures] =
        useState<CashClosure[]>([]);

    const [showExpenseForm, setShowExpenseForm] =
        useState(false);

    const [transactionPagination, setTransactionPagination] =
        useState<TablePagination>(EMPTY_PAGINATION);

    const [debtPagination, setDebtPagination] =
        useState<TablePagination>(EMPTY_PAGINATION);

    const [closurePagination, setClosurePagination] =
        useState<TablePagination>(EMPTY_PAGINATION);

    const [transactionsLoading, setTransactionsLoading] =
        useState(false);

    const [debtsLoading, setDebtsLoading] =
        useState(false);

    const [closuresLoading, setClosuresLoading] =
        useState(false);

    const [coreLoading, setCoreLoading] =
        useState(false);

    const currency =
        settings?.currency || "ر.ي";

    /*
     * تحميل الملخص المالي وحالة إغلاق الصندوق
     */
    const loadCoreData = useCallback(async () => {
        setCoreLoading(true);

        try {
            const [
                financialResponse,
                settingsResponse
            ] = await Promise.all([
                fetch(
                    `/api/financial?date=${encodeURIComponent(date)}&limit=10`,
                    {
                        cache: "no-store"
                    }
                ),
                fetch("/api/settings", {
                    cache: "no-store"
                })
            ]);

            const [
                financial,
                settingsData
            ] = await Promise.all([
                financialResponse.json(),
                settingsResponse.json()
            ]);

            if (!financialResponse.ok || !financial.success) {
                throw new Error(
                    financial.error ||
                        "تعذر تحميل البيانات المالية"
                );
            }

            setSummary(
                financial.data.summary || null
            );

            setClosure(
                (financial.data.closure ||
                    null) as CashClosure | null
            );

            if (settingsData.success) {
                setSettings(settingsData.data);
            }
        } catch {
            setSummary(null);
            setClosure(null);
        } finally {
            setCoreLoading(false);
        }
    }, [date]);

    /*
     * تحميل الحركات المالية مع Pagination
     */
    const loadTransactions = useCallback(
        async (page = 1) => {
            setTransactionsLoading(true);

            try {
                const params =
                    new URLSearchParams({
                        date,
                        transactionPage: String(page),
                        debtPage: "1",
                        limit: "10"
                    });

                const response = await fetch(
                    `/api/financial?${params.toString()}`,
                    {
                        cache: "no-store"
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.error ||
                            "تعذر جلب الحركات المالية"
                    );
                }

                setTransactions(
                    (data.data.transactions ||
                        []) as FinancialTransaction[]
                );

                setTransactionPagination(
                    data.data.transactionPagination ||
                        {
                            ...EMPTY_PAGINATION,
                            page
                        }
                );
            } catch {
                setTransactions([]);
            } finally {
                setTransactionsLoading(false);
            }
        },
        [date]
    );

    /*
     * تحميل الفواتير غير المسددة مع Pagination
     */
    const loadDebts = useCallback(
        async (page = 1) => {
            setDebtsLoading(true);

            try {
                const params =
                    new URLSearchParams({
                        date,
                        transactionPage: "1",
                        debtPage: String(page),
                        limit: "10"
                    });

                const response = await fetch(
                    `/api/financial?${params.toString()}`,
                    {
                        cache: "no-store"
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.error ||
                            "تعذر جلب الفواتير غير المسددة"
                    );
                }

                setDebts(
                    (data.data.debts ||
                        []) as Invoice[]
                );

                setDebtPagination(
                    data.data.debtPagination ||
                        {
                            ...EMPTY_PAGINATION,
                            page
                        }
                );
            } catch {
                setDebts([]);
            } finally {
                setDebtsLoading(false);
            }
        },
        [date]
    );

    /*
     * تحميل سجل إغلاقات الصندوق
     */
    const loadClosures = useCallback(
        async (page = 1) => {
            setClosuresLoading(true);

            try {
                const response = await fetch(
                    `/api/cash-closure?page=${page}&limit=10`,
                    {
                        cache: "no-store"
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.error ||
                            "تعذر جلب سجل الإغلاقات"
                    );
                }

                setClosures(
                    (data.data || []) as CashClosure[]
                );

                setClosurePagination(
                    data.pagination ||
                        {
                            ...EMPTY_PAGINATION,
                            page
                        }
                );
            } catch {
                setClosures([]);
            } finally {
                setClosuresLoading(false);
            }
        },
        []
    );

    /*
     * تحميل جميع بيانات الصفحة عند فتحها
     * وعند تغيير التاريخ
     */
    useEffect(() => {
    // هذه الاستدعاءات مطلوبة لتحميل بيانات الصفحة من API
    // عند فتح الصفحة أو تغيير التاريخ.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCoreData();

    
    void loadTransactions(1);

    
    void loadDebts(1);
}, [
    loadCoreData,
    loadTransactions,
    loadDebts
]);

useEffect(() => {
    // سجل الإغلاقات مستقل عن التاريخ المحدد.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadClosures(1);
}, [loadClosures]);

    const isClosed =
        closure?.status === "CLOSED";

    /*
     * صافي حركة الصندوق:
     * جميع المقبوضات - المصروفات
     */
    const expectedCash = summary
        ? summary.collections - summary.expenses
        : 0;

    const money = (value: number) =>
        formatCurrency(value, currency);

    /*
     * بعد إضافة مصروف:
     * تحديث الملخص والحركات والديون وسجل الإغلاقات
     */
    const handleExpenseSuccess = async () => {
        setShowExpenseForm(false);

        await Promise.all([
            loadCoreData(),
            loadTransactions(
                transactionPagination.page
            ),
            loadDebts(debtPagination.page),
            loadClosures(
                closurePagination.page
            )
        ]);
    };

    /*
     * بعد تحصيل دفعة
     */
    const handlePaymentSuccess = async () => {
        await Promise.all([
            loadCoreData(),
            loadTransactions(
                transactionPagination.page
            ),
            loadDebts(debtPagination.page)
        ]);
    };

    /*
     * تغيير التاريخ
     */
    const handleDateChange = (
        value: string
    ) => {
        if (!value) return;

        setDate(value);

        setTransactionPagination(
            EMPTY_PAGINATION
        );

        setDebtPagination(
            EMPTY_PAGINATION
        );
    };

    return (
        <PageContainer
            title="الإدارة المالية"
            description="ملخص يومي، حركات مالية، تحصيل الديون، وإغلاق الصندوق"
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    {!isClosed && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                                setShowExpenseForm(
                                    true
                                )
                            }
                        >
                            <TrendingDown size={17} />
                            إضافة مصروف
                        </button>
                    )}

                    <Link
                        href="/financial/closure"
                        className="btn-primary"
                    >
                        <Lock size={17} />
                        إغلاق الصندوق
                    </Link>
                </div>
            }
        >
            <div className="space-y-5">

                {/* اختيار التاريخ */}
                <section className="surface-card flex flex-wrap items-center gap-3">
                    <span
                        className="text-sm font-bold"
                        style={{
                            color:
                                "var(--text-secondary)"
                        }}
                    >
                        التاريخ:
                    </span>

                    <input
                        type="date"
                        className="input w-auto"
                        value={date}
                        onChange={(event) =>
                            handleDateChange(
                                event.target.value
                            )
                        }
                    />

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                            handleDateChange(
                                todayISO()
                            )
                        }
                    >
                        اليوم
                    </button>

                    {isClosed && (
                        <span className="status-success">
                            اليوم مغلق
                        </span>
                    )}
                </section>

                {/* نموذج إضافة مصروف */}
                {showExpenseForm && (
                    <ExpenseForm
                        date={date}
                        currency={currency}
                        onSuccess={
                            handleExpenseSuccess
                        }
                        onCancel={() =>
                            setShowExpenseForm(
                                false
                            )
                        }
                    />
                )}

                {/* بطاقات الإحصائيات الرئيسية */}
                <FinancialSummary
                    summary={summary}
                    currency={currency}
                />

                {/* ملخص حركة الصندوق */}
                {summary && (
                    <section className="surface-card">
                        <div className="grid gap-4 sm:grid-cols-3">

                            <div>
                                <div
                                    className="text-xs font-bold"
                                    style={{
                                        color:
                                            "var(--text-muted)"
                                    }}
                                >
                                    تحصيلات فواتير اليوم
                                </div>

                                <div
                                    className="mt-1 text-xl font-black"
                                    style={{
                                        color:
                                            "var(--primary)"
                                    }}
                                >
                                    {money(
                                        summary.todayPaymentsOnNewInvoices
                                    )}
                                </div>
                            </div>

                            <div>
                                <div
                                    className="text-xs font-bold"
                                    style={{
                                        color:
                                            "var(--text-muted)"
                                    }}
                                >
                                    صافي حركة الصندوق
                                </div>

                                <div
                                    className="mt-1 text-xl font-black"
                                    style={{
                                        color:
                                            "var(--primary)"
                                    }}
                                >
                                    {money(
                                        expectedCash
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-start sm:justify-end">
                                <Link
                                    href="/financial/closure"
                                    className="btn-primary inline-flex"
                                >
                                    <Lock size={17} />
                                    إغلاق الصندوق
                                </Link>
                            </div>

                        </div>
                    </section>
                )}

                {/* الحركات المالية */}
                <FinancialTransactionsTable
                    transactions={transactions}
                    pagination={
                        transactionPagination
                    }
                    loading={
                        transactionsLoading ||
                        coreLoading
                    }
                    onPageChange={
                        loadTransactions
                    }
                />

                {/* الفواتير غير المسددة */}
                <OutstandingDebtsTable
                    debts={debts}
                    pagination={debtPagination}
                    loading={debtsLoading}
                    onPageChange={loadDebts}
                    onPaymentSuccess={
                        handlePaymentSuccess
                    }
                />

                {/* سجل إغلاقات الصندوق */}
                <CashClosuresTable
                    closures={closures}
                    pagination={
                        closurePagination
                    }
                    loading={closuresLoading}
                    onPageChange={
                        loadClosures
                    }
                />

            </div>
        </PageContainer>
    );
}