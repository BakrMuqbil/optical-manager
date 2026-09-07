"use client";

import { Pagination } from "@/components/Pagination";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { Invoice } from "@/types/app";
import { PaymentButton } from "./PaymentButton";

type Props = {
    debts: Invoice[];
    pagination: {
        page: number;
        totalPages: number;
        total: number;
    };
    loading: boolean;
    onPageChange: (page: number) => void;
    onPaymentSuccess: () => void;
};

export function OutstandingDebtsTable({
    debts,
    pagination,
    loading,
    onPageChange,
    onPaymentSuccess
}: Props) {
    return (
        <section className="overflow-hidden rounded-2xl border shadow-sm">
            <div
                className="border-b p-4 font-black"
                style={{
                    background: "var(--surface)",
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

                                    <td>
                                        {invoice.customer_name}
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            invoice.total
                                        )}
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            invoice.paid
                                        )}
                                    </td>

                                    <td
                                        className="font-black"
                                        style={{
                                            color: "var(--danger)"
                                        }}
                                    >
                                        {formatCurrency(
                                            invoice.remaining
                                        )}
                                    </td>

                                    <td>
                                        <PaymentButton
                                            invoiceId={invoice.id}
                                            remaining={invoice.remaining}
                                            onSuccess={onPaymentSuccess}
                                        />
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
