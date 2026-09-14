"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { FinancialTransaction } from "@/types/financial";

type PaginationState = {
    page: number;
    totalPages: number;
    total: number;
};

type Props = {
    transactions: FinancialTransaction[];
    pagination: PaginationState;
    loading: boolean;
    onPageChange: (page: number) => void;
    onEdit?: (transaction: FinancialTransaction) => void;
    onDelete?: (transaction: FinancialTransaction) => void;
};

export function FinancialTransactionsTable({
    transactions,
    pagination,
    loading,
    onPageChange,
    onEdit,
    onDelete
}: Props) {
    const money = (value: number) =>
        formatCurrency(value);

    const hasActions = Boolean(onEdit || onDelete);

    return (
        <section className="overflow-hidden rounded-2xl border shadow-sm">
            <div
                className="border-b p-4 font-black"
                style={{
                    background: "var(--surface)",
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
                            {hasActions && <th>إجراءات</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={hasActions ? 6 : 5}
                                    className="p-8 text-center text-sm"
                                    style={{
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    جاري تحميل الحركات...
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={hasActions ? 6 : 5}
                                    className="p-8 text-center text-sm"
                                    style={{
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    لا توجد حركات
                                </td>
                            </tr>
                        ) : (
                            transactions.map(transaction => {
                                const isExpense = transaction.type === "EXPENSE";

                                return (
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
                                            {money(
                                                Number(
                                                    transaction.amount
                                                )
                                            )}
                                        </td>

                                        {hasActions && (
                                            <td>
                                                {isExpense ? (
                                                    <div className="flex gap-1">
                                                        {onEdit && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onEdit(transaction)
                                                                }
                                                                className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-muted)]"
                                                                style={{ color: "var(--text-secondary)" }}
                                                                title="تعديل"
                                                                aria-label="تعديل المصروف"
                                                            >
                                                                <Pencil size={17} />
                                                            </button>
                                                        )}

                                                        {onDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onDelete(transaction)
                                                                }
                                                                className="rounded-lg p-2 transition-colors hover:bg-[var(--danger-soft)]"
                                                                style={{ color: "var(--danger)" }}
                                                                title="حذف"
                                                                aria-label="حذف المصروف"
                                                            >
                                                                <Trash2 size={17} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-xs"
                                                        style={{ color: "var(--text-muted)" }}
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                loading={loading}
                onPageChange={onPageChange}
            />
        </section>
    );
}