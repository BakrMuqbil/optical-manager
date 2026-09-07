"use client";

import { Pagination } from "@/components/Pagination";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { FinancialTransaction } from "@/types/app";

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
};

export function FinancialTransactionsTable({
    transactions,
    pagination,
    loading,
    onPageChange
}: Props) {
    const money = (value: number) =>
        formatCurrency(value);

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
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={5}
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
                                        {money(
                                            Number(
                                                transaction.amount
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))
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