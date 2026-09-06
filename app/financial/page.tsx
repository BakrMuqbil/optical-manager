"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate, todayISO } from "@/lib/utils/formatDate";
import type {
    FinancialTransaction,
    Invoice,
    Settings,
    CashClosure
} from "@/types/app";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Lock,
    PlusCircle,
    X
} from "lucide-react";

type Summary = {
    sales: number;
    collections: number;
    expenses: number;
    oldDebtCollection: number;
    todayPaymentsOnNewInvoices: number;
};

export default function FinancialPage() {
    const [date, setDate] = useState(todayISO());
    const [settings, setSettings] = useState<Settings | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>(
        []
    );
    const [debts, setDebts] = useState<Invoice[]>([]);
    const [closure, setClosure] = useState<CashClosure | null>(null);
    const [showExpenseForm, setShowExpenseForm] = useState(false);

    const load = useCallback(async () => {
        try {
            const [financialResponse, settingsResponse] = await Promise.all([
                fetch(`/api/financial?date=${date}`),
                fetch("/api/settings")
            ]);

            const [financial, settingsData] = await Promise.all([
                financialResponse.json(),
                settingsResponse.json()
            ]);

            if (financial.success) {
                setSummary(financial.data.summary);

                setTransactions(
                    (financial.data.transactions ||
                        []) as FinancialTransaction[]
                );

                setDebts((financial.data.debts || []) as Invoice[]);

                setClosure(
                    (financial.data.closure || null) as CashClosure | null
                );
            }

            if (settingsData.success) {
                setSettings(settingsData.data);
            }
        } catch {
            // يمكن إضافة إشعار خطأ للمستخدم لاحقًا.
        }
    }, [date]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const currency = settings?.currency || "ر.ي";

    const money = (n: number) => formatCurrency(n, currency);

    const expectedCash = summary ? summary.collections - summary.expenses : 0;

    const isClosed = closure?.status === "CLOSED";

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
                            onClick={() => setShowExpenseForm(true)}
                        >
                            <TrendingDown size={17} />
                            إضافة مصروف
                        </button>
                    )}

                    <Link href="/financial/closure" className="btn-primary">
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
                            color: "var(--text-secondary)"
                        }}
                    >
                        التاريخ:
                    </span>

                    <input
                        type="date"
                        className="input w-auto"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />

                    <button
                        className="btn-secondary"
                        onClick={() => setDate(todayISO())}
                    >
                        اليوم
                    </button>

                    {isClosed && (
                        <span className="status-success">اليوم مغلق</span>
                    )}
                </section>

                {/* نموذج إضافة مصروف */}
                {showExpenseForm && (
                    <ExpenseForm
                        date={date}
                        currency={currency}
                        onSuccess={async () => {
                            setShowExpenseForm(false);
                            await load();
                        }}
                        onCancel={() => setShowExpenseForm(false)}
                    />
                )}

                {/* ملخص اليوم */}
                {summary && (
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
                )}

                {/* ملخص الصندوق */}
                {summary && (
                    <section className="surface-card">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <div
                                    className="text-xs font-bold"
                                    style={{
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    صافي حركة الصندوق
                                </div>

                                <div
                                    className="text-xl font-black"
                                    style={{
                                        color: "var(--primary)"
                                    }}
                                >
                                    {money(
                                        summary.collections - summary.expenses
                                    )}
                                </div>
                            </div>

                            <div>
                                <div
                                    className="text-xs font-bold"
                                    style={{
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    الرصيد المتوقع
                                </div>

                                <div
                                    className="text-xl font-black"
                                    style={{
                                        color: "var(--primary)"
                                    }}
                                >
                                    {money(expectedCash)}
                                </div>
                            </div>

                            <div className="text-left">
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
                <section
                    className="overflow-hidden rounded-2xl border shadow-sm"
                    style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)"
                    }}
                >
                    <div
                        className="border-b p-4 font-black"
                        style={{
                            borderColor: "var(--border)"
                        }}
                    >
                        الحركات المالية
                    </div>

                    <div className="thin-scrollbar overflow-x-auto">
                        <table className="data-table min-w-[800px]">
                            <thead>
                                <tr>
                                    <th>رقم الحركة</th>
                                    <th>التاريخ</th>
                                    <th>النوع</th>
                                    <th>العميل/الوصف</th>
                                    <th>المبلغ</th>
                                </tr>
                            </thead>

                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-8 text-center text-sm"
                                            style={{
                                                color: "var(--text-muted)"
                                            }}
                                        >
                                            لا توجد حركات
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map(transaction => (
                                        <tr key={transaction.id}>
                                            <td
                                                className="font-black"
                                                dir="ltr"
                                            >
                                                {transaction.transaction_number}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    transaction.transaction_date
                                                )}
                                            </td>

                                            <td>
                                                {transaction.type ===
                                                "PAYMENT" ? (
                                                    <span className="status-success">
                                                        مقبوضات
                                                    </span>
                                                ) : (
                                                    <span className="status-danger">
                                                        مصروف
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {transaction.customer_name ||
                                                    transaction.description ||
                                                    "—"}
                                            </td>

                                            <td className="font-bold">
                                                {money(transaction.amount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* الفواتير غير المسددة */}
                <section
                    className="overflow-hidden rounded-2xl border shadow-sm"
                    style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)"
                    }}
                >
                    <div
                        className="border-b p-4 font-black"
                        style={{
                            borderColor: "var(--border)"
                        }}
                    >
                        الفواتير غير المسددة
                    </div>

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
                                    <th>إجراء</th>
                                </tr>
                            </thead>

                            <tbody>
                                {debts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-8 text-center text-sm"
                                            style={{
                                                color: "var(--text-muted)"
                                            }}
                                        >
                                            لا توجد ديون
                                        </td>
                                    </tr>
                                ) : (
                                    debts.map(invoice => (
                                        <tr key={invoice.id}>
                                            <td
                                                className="font-black"
                                                dir="ltr"
                                            >
                                                {invoice.invoice_number}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    invoice.invoice_date
                                                )}
                                            </td>

                                            <td>{invoice.customer_name}</td>

                                            <td>{money(invoice.total)}</td>

                                            <td>{money(invoice.paid)}</td>

                                            <td
                                                className="font-black"
                                                style={{
                                                    color: "var(--danger)"
                                                }}
                                            >
                                                {money(invoice.remaining)}
                                            </td>

                                            <td>
                                                <PaymentButton
                                                    invoiceId={invoice.id}
                                                    remaining={
                                                        invoice.remaining
                                                    }
                                                    onSuccess={load}
                                                />
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

            <div className="mt-2 text-xl font-black" style={{ color }}>
                {value}
            </div>
        </div>
    );
}

function ExpenseForm({
    date,
    currency,
    onSuccess,
    onCancel
}: {
    date: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [expenseDate, setExpenseDate] = useState(date);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        const value = Number(amount);

        if (!value || value <= 0) {
            alert("يرجى إدخال مبلغ صحيح");
            return;
        }

        if (!description.trim()) {
            alert("يرجى إدخال وصف المصروف");
            return;
        }

        if (!expenseDate) {
            alert("يرجى اختيار تاريخ المصروف");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount: value,
                    date: expenseDate,
                    description: description.trim(),
                    notes: notes.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "تعذر تسجيل المصروف");
                return;
            }

            alert("تم تسجيل المصروف بنجاح");

            onSuccess();
        } catch {
            alert("حدث خطأ أثناء تسجيل المصروف");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            className="surface-card border"
            style={{
                borderColor: "var(--border)"
            }}
        >
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="font-black">إضافة مصروف</h2>
                    <p
                        className="mt-1 text-xs"
                        style={{
                            color: "var(--text-muted)"
                        }}
                    >
                        تسجيل مصروف جديد ضمن الحركات المالية
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="btn-secondary"
                    aria-label="إغلاق"
                >
                    <X size={17} />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-bold">
                        المبلغ ({currency})
                    </label>

                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="input w-full"
                        placeholder="مثال: 5000"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        disabled={loading}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-bold">
                        التاريخ
                    </label>

                    <input
                        type="date"
                        className="input w-full"
                        value={expenseDate}
                        onChange={e => setExpenseDate(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-bold">
                        وصف المصروف
                    </label>

                    <input
                        type="text"
                        className="input w-full"
                        placeholder="مثال: شراء أدوات مكتبية"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-bold">
                        ملاحظات <span className="font-normal">(اختياري)</span>
                    </label>

                    <textarea
                        className="input min-h-24 w-full resize-y"
                        placeholder="أي تفاصيل إضافية عن المصروف..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="btn-secondary"
                >
                    إلغاء
                </button>

                <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="btn-primary"
                >
                    <PlusCircle size={17} />
                    {loading ? "جاري الحفظ..." : "حفظ المصروف"}
                </button>
            </div>
        </section>
    );
}

function PaymentButton({
    invoiceId,
    remaining,
    onSuccess
}: {
    invoiceId: string;
    remaining: number;
    onSuccess: () => void;
}) {
    const [show, setShow] = useState(false);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        const val = Number(amount);

        if (!val || val <= 0 || val > remaining) {
            alert("مبلغ غير صالح");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    invoiceId,
                    amount: val,
                    date: todayISO()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "تعذر التسجيل");
                return;
            }

            setShow(false);
            setAmount("");

            onSuccess();
        } catch {
            alert("حدث خطأ أثناء تسجيل الدفعة");
        } finally {
            setLoading(false);
        }
    };

    if (!show) {
        return (
            <button
                onClick={() => setShow(true)}
                className="btn-primary px-3 py-1.5 text-xs"
            >
                <PlusCircle size={14} />
                تسجيل دفعة
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                min="0.01"
                step="0.01"
                max={remaining}
                className="input w-28 py-1 text-xs"
                placeholder="المبلغ"
                value={amount}
                onChange={e => setAmount(e.target.value)}
            />

            <button
                onClick={submit}
                disabled={loading}
                className="btn-primary px-3 py-1.5 text-xs"
            >
                {loading ? "جاري الحفظ..." : "تأكيد"}
            </button>

            <button
                onClick={() => setShow(false)}
                disabled={loading}
                className="btn-secondary px-3 py-1.5 text-xs"
            >
                إلغاء
            </button>
        </div>
    );
}
