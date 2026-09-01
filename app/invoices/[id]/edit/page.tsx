"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Exam, InvoiceForm, InvoiceFormItem, Settings } from "@/types/app";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [settings, setSettings] = useState<Settings>({
    shop_name: "محل البصريات",
    phone: "",
    address: "",
    currency: "ر.ي",
    invoice_footer: "شكرًا لزيارتكم",
    paper_size: "A4",
  });
  const [form, setForm] = useState<InvoiceForm>({
    customerId: "",
    examId: "",
    invoiceDate: "",
    discount: "",
    paid: "",
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: "" }],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [invRes, setRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch("/api/settings"),
        ]);
        const invData = await invRes.json();
        const setParsed = await setRes.json();

        if (!isMounted) return;

        if (setParsed.success && setParsed.data) {
          setSettings(setParsed.data as Settings);
        }

        if (invData.success && invData.data) {
          const { invoice, items: fetchedItems } = invData.data;
          setCustomerName(invoice.customer_name || "");

          setForm({
            customerId: invoice.customer_id,
            examId: invoice.exam_id || "",
            invoiceDate: invoice.invoice_date,
            discount: String(invoice.discount || 0),
            paid: String(invoice.paid || 0),
            notes: invoice.notes || "",
            items: fetchedItems.map(
              (it: {
                description: string;
                quantity: number;
                unit_price: number;
              }) => ({
                description: it.description,
                quantity: it.quantity,
                unitPrice: String(it.unit_price),
              }),
            ),
          });

          if (invoice.customer_id) {
            const exRes = await fetch(
              `/api/exams?customerId=${encodeURIComponent(invoice.customer_id)}`,
            );
            const exData = await exRes.json();
            if (isMounted && exData.data) {
              setExams(exData.data as Exam[]);
            }
          }
        }
      } catch {
        // Handle failure if needed
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const subtotal = form.items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  const discount = Math.min(Number(form.discount) || 0, subtotal);
  const total = subtotal - discount;
  const paid = Math.min(Number(form.paid) || 0, total);
  const remaining = Math.max(0, total - paid);
  const money = (n: number) => formatCurrency(n, settings.currency);

  const updateItem = (
    index: number,
    key: keyof InvoiceFormItem,
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, n) =>
        n === index ? { ...item, [key]: value } : item,
      ),
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر تعديل الفاتورة");
      router.push(`/invoices/${id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تعديل الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer
        title="تعديل فاتورة"
        description="جاري تحميل بيانات الفاتورة..."
      >
        <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`تعديل الفاتورة للعميل: ${customerName}`}
      description="تحديث بنود المبيعات والمدفوعات بالفاتورة"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="label">العميل</span>
              <input
                disabled
                className="input bg-slate-50 text-slate-500"
                value={customerName}
              />
            </label>
            <label>
              <span className="label">الفحص المرتبط</span>
              <select
                className="input"
                value={form.examId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, examId: e.target.value }))
                }
              >
                <option value="">بدون فحص</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.exam_number} — {e.exam_date}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">التاريخ</span>
              <input
                type="date"
                className="input"
                value={form.invoiceDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invoiceDate: e.target.value }))
                }
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black">بنود الفاتورة</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  items: [
                    ...f.items,
                    { description: "", quantity: 1, unitPrice: "" },
                  ],
                }))
              }
            >
              <Plus size={17} />
              إضافة بند
            </button>
          </div>
          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 md:grid-cols-[1fr_120px_160px_42px]"
              >
                <input
                  required
                  className="input"
                  placeholder="وصف المنتج/الخدمة"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                />
                <input
                  required
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="الكمية"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                />
                <input
                  required
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="السعر"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", e.target.value)
                  }
                />
                <button
                  type="button"
                  disabled={form.items.length === 1}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      items: f.items.filter((_, n) => n !== index),
                    }))
                  }
                  className="rounded-xl border border-red-100 text-red-500 disabled:opacity-30"
                >
                  <Trash2 size={18} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label>
              <span className="label">ملاحظات</span>
              <textarea
                className="input"
                rows={4}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </label>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Summary label="المجموع الفرعي" value={subtotal} money={money} />
            <label className="my-3 block">
              <span className="label">الخصم</span>
              <input
                className="input"
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount: e.target.value }))
                }
              />
            </label>
            <Summary label="الإجمالي" value={total} strong money={money} />
            <label className="my-3 block">
              <span className="label">المدفوع</span>
              <input
                className="input"
                type="number"
                min="0"
                value={form.paid}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paid: e.target.value }))
                }
              />
            </label>
            <Summary label="المتبقي" value={remaining} strong money={money} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            إلغاء
          </button>
          <button disabled={saving} className="btn-primary">
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

function Summary({
  label,
  value,
  strong = false,
  money,
}: {
  label: string;
  value: number;
  strong?: boolean;
  money: (n: number) => string;
}) {
  return (
    <div
      className={`flex justify-between ${
        strong ? "text-lg font-black" : "text-sm text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}
