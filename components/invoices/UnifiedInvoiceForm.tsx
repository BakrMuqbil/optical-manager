"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Printer,
    Save,
    RotateCcw,
    User,
    Eye,
    Calculator,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { todayISO } from "@/lib/utils/formatDate";
import type { Invoice, Settings } from "@/types/app";

type Mode = "create" | "edit";

type Props = { mode?: Mode; invoiceId?: string };

const emptyForm = () => ({
    customerName: "",
    customerPhone: "",
    invoiceDate: todayISO(),
    examDate: todayISO(),
    examiner: "",
    odSph: "",
    odCyl: "",
    odAxis: "",
    odAdd: "",
    osSph: "",
    osCyl: "",
    osAxis: "",
    osAdd: "",
    pd: "",
    nearPd: "",
    price: "",
    discount: "",
    paid: "",
    notes: ""
});

type FormState = ReturnType<typeof emptyForm>;

export function UnifiedInvoiceForm({ mode = "create", invoiceId }: Props) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(emptyForm());
    const [settings, setSettings] = useState<Settings>({
        shop_name: "محل البصريات",
        phone: "",
        address: "",
        currency: "ر.ي",
        invoice_footer: "شكرًا لزيارتكم",
        paper_size: "A4"
    });
    const [loading, setLoading] = useState(mode === "edit");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/settings")
            .then(r => r.json())
            .then(j => {
                if (j.success && j.data) setSettings(j.data as Settings);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (mode !== "edit" || !invoiceId) return;
        fetch(`/api/invoices/${invoiceId}`)
            .then(r => r.json())
            .then(j => {
                if (!j.success)
                    throw new Error(j.error || "تعذر تحميل الفاتورة");
                const i = j.data.invoice as Invoice;
                setForm({
                    customerName: i.customer_name || "",
                    customerPhone: i.customer_phone || "",
                    invoiceDate: i.invoice_date || todayISO(),
                    examDate: i.exam_date || i.invoice_date || todayISO(),
                    examiner: i.examiner || "",
                    odSph: String(i.od_sph ?? ""),
                    odCyl: String(i.od_cyl ?? ""),
                    odAxis: String(i.od_axis ?? ""),
                    odAdd: String(i.od_add ?? ""),
                    osSph: String(i.os_sph ?? ""),
                    osCyl: String(i.os_cyl ?? ""),
                    osAxis: String(i.os_axis ?? ""),
                    osAdd: String(i.os_add ?? ""),
                    pd: String(i.pd ?? ""),
                    nearPd: String(i.near_pd ?? ""),
                    price: String(i.subtotal ?? ""),
                    discount: String(i.discount ?? ""),
                    paid: String(i.paid ?? ""),
                    notes: i.notes || i.exam_notes || ""
                });
            })
            .catch(e =>
                setError(e instanceof Error ? e.message : "تعذر تحميل الفاتورة")
            )
            .finally(() => setLoading(false));
    }, [mode, invoiceId]);

    const subtotal = Math.max(0, Number(form.price) || 0);
    const discount = Math.min(
        Math.max(0, Number(form.discount) || 0),
        subtotal
    );
    const total = Math.max(0, subtotal - discount);
    const paid = Math.min(Math.max(0, Number(form.paid) || 0), total);
    const remaining = Math.max(0, total - paid);
    const money = (n: number) => formatCurrency(n, settings.currency || "ر.ي");

    const update = (key: keyof FormState, value: string) =>
        setForm(f => ({ ...f, [key]: value }));

    const reset = () => {
        setForm(emptyForm());
        setError("");
    };

    const submit = async (printAfter: boolean) => {
        setSaving(true);
        setError("");
        try {
            const r = await fetch(
                mode === "edit"
                    ? `/api/invoices/${invoiceId}`
                    : "/api/invoices",
                {
                    method: mode === "edit" ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                }
            );
            const j = await r.json();
            if (!r.ok || !j.success)
                throw new Error(j.error || "تعذر حفظ الفاتورة");
            const id = j.data.id;
            if (printAfter) {
                window.open(
                    `/invoices/${id}?print=1`,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
            if (mode === "create") reset();
            else router.push("/account-statement");
        } catch (e) {
            setError(e instanceof Error ? e.message : "تعذر حفظ الفاتورة");
        } finally {
            setSaving(false);
        }
    };

    const section = useMemo(() => "surface-card", []);

    if (loading)
        return (
            <PageContainer title="فاتورة" description="جاري تحميل البيانات">
                <div
                    className="rounded-2xl border border-dashed p-12 text-center text-sm"
                    style={{
                        borderColor: "var(--border-strong)",
                        color: "var(--text-muted)"
                    }}
                >
                    جاري التحميل...
                </div>
            </PageContainer>
        );

    return (
        <PageContainer
            title={mode === "edit" ? "تعديل الفاتورة" : "فاتورة"}
            description="إدخال بيانات العميل والقياسات والحساب وحفظها في سجل واحد"
        >
            <form
                onSubmit={e => {
                    e.preventDefault();
                    void submit(false);
                }}
                className="space-y-5"
            >
                {error && (
                    <div
                        className="flex items-center gap-2.5 rounded-xl border p-4 text-sm font-bold"
                        style={{
                            borderColor: "var(--danger)",
                            background: "var(--danger-soft)",
                            color: "var(--danger)"
                        }}
                    >
                        <AlertCircle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* 1. بيانات العميل */}
                <section className={section}>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black"
                                style={{
                                    background: "var(--primary)",
                                    color: "var(--text-on-primary)"
                                }}
                            >
                                <User size={17} />
                            </span>
                            <div>
                                <h2
                                    className="text-lg font-black"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    بيانات العميل
                                </h2>
                                <p
                                    className="mt-0.5 text-xs"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    يتم ربط العميل تلقائيًا برقم الجوال عند
                                    وجوده مسبقًا.
                                </p>
                            </div>
                        </div>

                        <span
                            className="rounded-full border px-3 py-1 text-xs font-bold"
                            style={{
                                borderColor: "var(--primary)",
                                background: "var(--primary-soft)",
                                color: "var(--primary)"
                            }}
                        >
                            الاسم + الجوال
                        </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            <span className="label">اسم العميل</span>
                            <input
                                required
                                className="input"
                                value={form.customerName}
                                onChange={e =>
                                    update("customerName", e.target.value)
                                }
                                placeholder="اكتب اسم العميل"
                            />
                        </label>

                        <label>
                            <span className="label">رقم الجوال</span>
                            <input
                                required
                                className="input"
                                dir="ltr"
                                inputMode="tel"
                                value={form.customerPhone}
                                onChange={e =>
                                    update("customerPhone", e.target.value)
                                }
                                placeholder="7xxxxxxxx"
                            />
                        </label>
                    </div>
                </section>

                {/* 2. بيانات القياسات */}
                <section className={section}>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                    background: "var(--primary)",
                                    color: "var(--text-on-primary)"
                                }}
                            >
                                <Eye size={17} />
                            </span>
                            <div>
                                <h2
                                    className="text-lg font-black"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    بيانات القياسات
                                </h2>
                                <p
                                    className="mt-0.5 text-xs"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    القياسات تحفظ داخل الفاتورة نفسها، ولا يوجد
                                    سجل مستقل للفحص.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <label>
                                <span className="label">تاريخ الفاتورة</span>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.invoiceDate}
                                    onChange={e =>
                                        update("invoiceDate", e.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span className="label">تاريخ القياسات</span>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.examDate}
                                    onChange={e =>
                                        update("examDate", e.target.value)
                                    }
                                />
                            </label>
                        </div>
                    </div>

                    <div className="mb-5 grid gap-4 md:grid-cols-3">
                        <label>
                            <span className="label">الفاحص</span>
                            <input
                                className="input"
                                value={form.examiner}
                                onChange={e =>
                                    update("examiner", e.target.value)
                                }
                                placeholder="اسم الفاحص (اختياري)"
                            />
                        </label>

                        <label>
                            <span className="label">PD</span>
                            <input
                                className="input"
                                type="number"
                                step="0.01"
                                value={form.pd}
                                onChange={e => update("pd", e.target.value)}
                                placeholder="mm"
                            />
                        </label>

                        <label>
                            <span className="label">Near PD</span>
                            <input
                                className="input"
                                type="number"
                                step="0.01"
                                value={form.nearPd}
                                onChange={e => update("nearPd", e.target.value)}
                                placeholder="mm"
                            />
                        </label>
                    </div>

                    <div
                        className="thin-scrollbar overflow-x-auto rounded-xl border"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <table className="w-full min-w-[720px] border-collapse text-center text-sm">
                            <thead>
                                <tr
                                    style={{
                                        background: "var(--primary)",
                                        color: "var(--text-on-primary)"
                                    }}
                                >
                                    <th className="p-3 text-right text-xs font-black uppercase tracking-wide">
                                        العين
                                    </th>
                                    <th className="p-3 text-xs font-black uppercase tracking-wide">
                                        SPH
                                    </th>
                                    <th className="p-3 text-xs font-black uppercase tracking-wide">
                                        CYL
                                    </th>
                                    <th className="p-3 text-xs font-black uppercase tracking-wide">
                                        AXIS
                                    </th>
                                    <th className="p-3 text-xs font-black uppercase tracking-wide">
                                        ADD
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr
                                    style={{
                                        background: "var(--surface)",
                                        borderTop: "1px solid var(--border)"
                                    }}
                                >
                                    <td
                                        className="p-3 text-right font-black"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <span
                                                className="inline-block h-2 w-2 rounded-full"
                                                style={{
                                                    background: "var(--info)"
                                                }}
                                                aria-hidden
                                            />
                                            RIGHT (OD)
                                        </span>
                                    </td>

                                    {(
                                        [
                                            "odSph",
                                            "odCyl",
                                            "odAxis",
                                            "odAdd"
                                        ] as const
                                    ).map(k => (
                                        <td key={k} className="p-2">
                                            <input
                                                className="input"
                                                type="number"
                                                step="0.01"
                                                value={form[k]}
                                                onChange={e =>
                                                    update(k, e.target.value)
                                                }
                                            />
                                        </td>
                                    ))}
                                </tr>

                                <tr
                                    style={{
                                        background: "var(--surface-soft)",
                                        borderTop: "1px solid var(--border)"
                                    }}
                                >
                                    <td
                                        className="p-3 text-right font-black"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <span
                                                className="inline-block h-2 w-2 rounded-full"
                                                style={{
                                                    background: "var(--success)"
                                                }}
                                                aria-hidden
                                            />
                                            LEFT (OS)
                                        </span>
                                    </td>

                                    {(
                                        [
                                            "osSph",
                                            "osCyl",
                                            "osAxis",
                                            "osAdd"
                                        ] as const
                                    ).map(k => (
                                        <td key={k} className="p-2">
                                            <input
                                                className="input"
                                                type="number"
                                                step="0.01"
                                                value={form[k]}
                                                onChange={e =>
                                                    update(k, e.target.value)
                                                }
                                            />
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 grid items-end gap-4 md:grid-cols-[1fr_240px]">
                        <label>
                            <span className="label">ملاحظات</span>

                            <textarea
                                className="input"
                                rows={3}
                                value={form.notes}
                                onChange={e => update("notes", e.target.value)}
                            />
                        </label>

                        <label>
                            <span className="label">السعر</span>

                            <input
                                required
                                className="input text-lg font-black"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.price}
                                onChange={e => update("price", e.target.value)}
                                placeholder="0"
                            />
                        </label>
                    </div>
                </section>

                {/* 3. الحساب */}
                <section className={section}>
                    <div className="mb-5 flex items-center gap-3">
                        <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{
                                background: "var(--primary)",
                                color: "var(--text-on-primary)"
                            }}
                        >
                            <Calculator size={17} />
                        </span>
                        <div>
                            <h2
                                className="text-lg font-black"
                                style={{ color: "var(--text-primary)" }}
                            >
                                الحساب
                            </h2>
                            <p
                                className="mt-0.5 text-xs"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                المبالغ تُحسب تلقائيًا من السعر والخصم والمدفوع.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <Summary
                            label="المجموع الفرعي"
                            value={subtotal}
                            money={money}
                        />

                        <label>
                            <span className="label">الخصم</span>

                            <input
                                className="input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.discount}
                                onChange={e =>
                                    update("discount", e.target.value)
                                }
                            />
                        </label>

                        <Summary
                            label="الإجمالي"
                            value={total}
                            money={money}
                            strong
                        />

                        <label>
                            <span className="label">المدفوع</span>

                            <input
                                className="input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.paid}
                                onChange={e => update("paid", e.target.value)}
                            />
                        </label>
                    </div>

                    <div
                        className="mt-5 flex items-center justify-between rounded-xl p-4 shadow-sm"
                        style={{
                            background:
                                remaining > 0
                                    ? "var(--danger)"
                                    : "var(--success)",
                            color: "var(--text-on-primary)"
                        }}
                    >
                        <span className="font-bold">
                            {remaining > 0
                                ? "المتبقي على العميل"
                                : "مسددة بالكامل"}
                        </span>
                        <strong className="text-2xl">{money(remaining)}</strong>
                    </div>
                </section>

                {/* الأزرار */}
                <div className="no-print flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                            mode === "edit"
                                ? router.push("/account-statement")
                                : reset()
                        }
                    >
                        <RotateCcw size={17} />
                        {mode === "edit" ? "إلغاء" : "تفريغ النموذج"}
                    </button>

                    {mode === "create" && (
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => void submit(true)}
                            className="btn-primary"
                        >
                            <Printer size={17} />
                            {saving ? "جاري الحفظ..." : "حفظ وطباعة"}
                        </button>
                    )}

                    <button disabled={saving} className="btn-primary">
                        <Save size={17} />
                        {saving
                            ? "جاري الحفظ..."
                            : mode === "edit"
                              ? "حفظ التعديلات"
                              : "حفظ الفاتورة"}
                    </button>
                </div>
            </form>
        </PageContainer>
    );
}

function Summary({
    label,
    value,
    money,
    strong = false
}: {
    label: string;
    value: number;
    money: (n: number) => string;
    strong?: boolean;
}) {
    return (
        <div
            className="rounded-xl border p-4"
            style={{
                background: "var(--surface-muted)",
                borderColor: strong ? "var(--primary)" : "var(--border)",
                borderWidth: strong ? "2px" : "1px"
            }}
        >
            <span className="label mb-1">{label}</span>
            <strong
                className={strong ? "text-xl" : "text-lg"}
                style={{
                    color: strong ? "var(--primary)" : "var(--text-primary)"
                }}
            >
                {money(value)}
            </strong>
        </div>
    );
}
