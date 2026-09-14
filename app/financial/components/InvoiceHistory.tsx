"use client";


import Link from "next/link";
import { Edit, Eye, Inbox, Printer, Search, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { Settings } from "@/types/settings";
import type { Period } from "../types/financial";
import { useInvoiceHistory } from "../hooks/useInvoiceHistory";
import { StatusBadge } from "@/components/common/StatusBadge";

type Props = {
  period: Period;
  cursor: string;
  settings: Settings | null;
};

export function InvoiceHistory({ period, cursor, settings }: Props) {
  const { q, setQ, status, setStatus, rows, loading, remove } = useInvoiceHistory({ period, cursor });

  const money = (value: number) =>
    formatCurrency(value, settings?.currency || "ر.ي");

  return (
    <>
      <section className="surface-card">
        <div className="grid gap-3 md:grid-cols-[1fr_200px]" dir="rtl">
          <label className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              className="input pr-11"
              placeholder="بحث برقم الفاتورة أو اسم العميل أو الجوال"
              value={q}
              onChange={event => setQ(event.target.value)}
            />
          </label>

          <select
            className="input"
            value={status}
            onChange={event => setStatus(event.target.value)}
          >
            <option value="">كل الفواتير</option>
            <option value="DUE">عليها مبالغ</option>
            <option value="UNPAID">غير مسددة</option>
            <option value="PARTIALLY_PAID">مسددة جزئيًا</option>
            <option value="PAID">مسددة بالكامل</option>
            <option value="CANCELLED">ملغاة</option>
          </select>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
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
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center" style={{ color: "var(--text-muted)" }}>
                    جاري التحميل...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
                      >
                        <Inbox size={22} />
                      </span>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                        لا توجد فواتير ضمن الفترة المحددة.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="font-black" dir="ltr" style={{ color: "var(--text-primary)" }}>
                      {invoice.invoice_number}
                    </td>
                    <td dir="ltr" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td>
                      <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {invoice.customer_name}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }} dir="ltr">
                        {invoice.customer_phone || "—"}
                      </div>
                    </td>
                    <td className="font-bold" style={{ color: "var(--text-primary)" }}>
                      {money(invoice.total)}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{money(invoice.paid)}</td>
                    <td
                      className="font-black"
                      style={{ color: invoice.remaining > 0 ? "var(--danger)" : "var(--success)" }}
                    >
                      {money(invoice.remaining)}
                    </td>
                    <td><StatusBadge status={invoice.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-muted)]"
                          style={{ color: "var(--text-secondary)" }}
                          title="عرض"
                        >
                          <Eye size={17} />
                        </Link>
                        {invoice.status !== "CANCELLED" && (
                          <Link
                            href={`/invoices/${invoice.id}/edit`}
                            className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-muted)]"
                            style={{ color: "var(--text-secondary)" }}
                            title="تعديل"
                          >
                            <Edit size={17} />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => window.open(`/invoices/${invoice.id}/print`, "_blank", "noopener,noreferrer")}
                          className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-muted)]"
                          style={{ color: "var(--text-secondary)" }}
                          title="طباعة"
                        >
                          <Printer size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(invoice.id)}
                          className="rounded-lg p-2 transition-colors hover:bg-[var(--danger-soft)]"
                          style={{ color: "var(--danger)" }}
                          title="حذف"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
