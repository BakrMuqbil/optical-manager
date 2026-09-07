"use client";

import Link from "next/link";
import { Eye, Printer } from "lucide-react";

import { Pagination } from "@/components/Pagination";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { CashClosure } from "@/types/app";

type PaginationState = {
    page: number;
    totalPages: number;
    total: number;
};

type Props = {
    closures: CashClosure[];
    pagination: PaginationState;
    loading: boolean;
    onPageChange: (page: number) => void;
};

export function CashClosuresTable({
    closures,
    pagination,
    loading,
    onPageChange
}: Props) {
    const money = (value: number) =>
        formatCurrency(value);

    return (
        <section className="overflow-hidden rounded-2xl border shadow-sm">
            <div
                className="border-b p-4"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)"
                }}
            >
                <div className="font-black">
                    سجل إغلاقات الصندوق
                </div>

                <p
                    className="mt-1 text-xs"
                    style={{
                        color: "var(--text-muted)"
                    }}
                >
                    عرض الإغلاقات السابقة مع إمكانية مشاهدة التقرير
                    وطباعته
                </p>
            </div>

            <div className="thin-scrollbar overflow-x-auto">
                <table className="data-table min-w-[1050px]">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الرصيد الافتتاحي</th>
                            <th>المبيعات</th>
                            <th>المقبوضات</th>
                            <th>المصروفات</th>
                            <th>المتوقع</th>
                            <th>الفعلي</th>
                            <th>الفرق</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="p-8 text-center"
                                >
                                    جاري تحميل السجل...
                                </td>
                            </tr>
                        ) : closures.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="p-8 text-center text-sm"
                                    style={{
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    لا توجد إغلاقات سابقة
                                </td>
                            </tr>
                        ) : (
                            closures.map(item => {
                                const difference = Number(
                                    item.difference || 0
                                );

                                return (
                                    <tr key={item.id}>
                                        <td className="font-bold">
                                            {formatDate(
                                                item.business_date
                                            )}
                                        </td>

                                        <td>
                                            {money(
                                                Number(
                                                    item.opening_balance ||
                                                        0
                                                )
                                            )}
                                        </td>

                                        <td>
                                            {money(
                                                Number(
                                                    item.total_sales ||
                                                        0
                                                )
                                            )}
                                        </td>

                                        <td>
                                            {money(
                                                Number(
                                                    item.total_collections ||
                                                        0
                                                )
                                            )}
                                        </td>

                                        <td>
                                            {money(
                                                Number(
                                                    item.total_expenses ||
                                                        0
                                                )
                                            )}
                                        </td>

                                        <td className="font-bold">
                                            {money(
                                                Number(
                                                    item.expected_cash ||
                                                        0
                                                )
                                            )}
                                        </td>

                                        <td className="font-bold">
                                            {item.actual_cash != null
                                                ? money(
                                                      Number(
                                                          item.actual_cash
                                                      )
                                                  )
                                                : "-"}
                                        </td>

                                        <td
                                            className="font-black"
                                            style={{
                                                color:
                                                    difference === 0
                                                        ? "var(--success)"
                                                        : "var(--danger)"
                                            }}
                                        >
                                            {difference === 0
                                                ? "0"
                                                : `${difference > 0 ? "+" : ""}${money(
                                                      difference
                                                  )}`}
                                        </td>

                                        <td>
                                            <span className="status-success">
                                                مغلق
                                            </span>
                                        </td>

                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/financial/closure?id=${encodeURIComponent(
                                                        String(item.id)
                                                    )}`}
                                                    className="btn-secondary px-3 py-1.5 text-xs"
                                                >
                                                    <Eye size={14} />
                                                    عرض
                                                </Link>

                                                <button
                                                    type="button"
                                                    className="btn-primary px-3 py-1.5 text-xs"
                                                    onClick={() =>
                                                        window.open(
                                                            `/financial/closure/print?id=${encodeURIComponent(
                                                                String(
                                                                    item.id
                                                                )
                                                            )}`,
                                                            "_blank"
                                                        )
                                                    }
                                                >
                                                    <Printer
                                                        size={14}
                                                    />
                                                    طباعة
                                                </button>
                                            </div>
                                        </td>
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