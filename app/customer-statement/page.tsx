"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { Search } from "lucide-react";

export default function CustomerStatementPage() {
    const [phone, setPhone] = useState("");
    const [customer, setCustomer] = useState<{
        id: string;
        name: string;
        phone: string;
    } | null>(null);
    const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
    const [loading, setLoading] = useState(false);

    const search = async () => {
        if (!phone.trim() || loading) return;

        setLoading(true);

        try {
            const r = await fetch(
                `/api/invoices?q=${encodeURIComponent(phone)}&status=DUE`
            );

            const j = await r.json();

            if (j.success && j.data.length > 0) {
                const c = j.data[0];

                setCustomer({
                    id: c.customer_id,
                    name: c.customer_name,
                    phone: c.customer_phone
                });

                const s = await fetch(
                    `/api/customer-statement?customerId=${c.customer_id}`
                );

                const sj = await s.json();

                if (sj.success) {
                    setRows(sj.data);
                } else {
                    setRows([]);
                }
            } else {
                setCustomer(null);
                setRows([]);
            }
        } catch {
            setCustomer(null);
            setRows([]);
            alert("تعذر تحميل كشف حساب العميل");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer
            title="كشف حساب العميل"
            description="عرض الفواتير والدفعات لعميل محدد"
        >
            <div className="space-y-5">
                <section className="surface-card flex flex-wrap items-center gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2"
                            style={{ color: "var(--text-muted)" }}
                        />

                        <input
                            className="input pr-11"
                            placeholder="رقم جوال العميل"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    search();
                                }
                            }}
                            disabled={loading}
                        />
                    </div>

                    <button
                        onClick={search}
                        disabled={loading || !phone.trim()}
                        className="btn-primary"
                    >
                        <Search size={16} />

                        {loading ? "جاري البحث..." : "بحث"}
                    </button>
                </section>

                {customer && (
                    <div className="surface-card">
                        <div className="text-lg font-black">
                            {customer.name}
                        </div>

                        <div
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                            dir="ltr"
                        >
                            {customer.phone}
                        </div>
                    </div>
                )}

                {rows.length > 0 && (
                    <section
                        className="overflow-hidden rounded-2xl border shadow-sm"
                        style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)"
                        }}
                    >
                        <div className="thin-scrollbar overflow-x-auto">
                            <table className="data-table min-w-[700px]">
                                <thead>
                                    <tr>
                                        <th>التاريخ</th>
                                        <th>البيان</th>
                                        <th>مدين</th>
                                        <th>دائن</th>
                                        <th>الرصيد</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map(
                                        (
                                            row: Record<string, unknown>,
                                            index: number
                                        ) => (
                                            <tr key={index}>
                                                <td>
                                                    {formatDate(
                                                        String(row.date)
                                                    )}
                                                </td>

                                                <td>
                                                    {String(row.type)} —{" "}
                                                    {String(row.ref)}
                                                </td>

                                                <td className="font-bold">
                                                    {Number(row.debit) > 0
                                                        ? formatCurrency(
                                                              Number(row.debit),
                                                              "ر.ي"
                                                          )
                                                        : "—"}
                                                </td>

                                                <td className="font-bold">
                                                    {Number(row.credit) > 0
                                                        ? formatCurrency(
                                                              Number(
                                                                  row.credit
                                                              ),
                                                              "ر.ي"
                                                          )
                                                        : "—"}
                                                </td>

                                                <td className="font-black">
                                                    {formatCurrency(
                                                        Number(row.balance),
                                                        "ر.ي"
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {customer && rows.length === 0 && !loading && (
                    <section className="surface-card text-center">
                        <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                        >
                            لا توجد حركات مالية لهذا العميل.
                        </p>
                    </section>
                )}
            </div>
        </PageContainer>
    );
}
