"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { todayISO } from "@/lib/utils/formatDate";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type {
  Customer,
  Exam,
  InvoiceForm,
  InvoiceFormItem,
  Settings,
} from "@/types/app";

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [settings, setSettings] = useState<Settings>({
    shop_name: "محل البصريات",
    phone: "",
    address: "",
    currency: "ر.ي",
    invoice_footer: "شكرًا لزيارتكم",
    paper_size: "A4",
  });
  const [form, setForm] = useState<InvoiceForm>({
    customerId: customerIdParam,
    examId: "",
    invoiceDate: todayISO(),
    discount: "",
    paid: "",
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: "" }],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([customersResult, settingsResult]) => {
        if (!isMounted) return;
        setCustomers((customersResult.data || []) as Customer[]);
        if (settingsResult.data) setSettings(settingsResult.data as Settings);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCustomerId = form.customerId;

  useEffect(() => {
    let isMounted = true;
    if (!selectedCustomerId) {
      return;
    }

    fetch(`/api/exams?customerId=${encodeURIComponent(selectedCustomerId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (isMounted) {
          setExams((j.data || []) as Exam[]);
        }
      })
      .catch(() => {
        if (isMounted) setExams([]);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCustomerId]);

  const handleCustomerChange = (newCustomerId: string) => {
    setForm((f) => ({
      ...f,
      customerId: newCustomerId,
      examId: "",
    }));
    if (!newCustomerId) {
      setExams([]);
    }
  };

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
    setLoading(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر حفظ الفاتورة");
      router.push(`/invoices/${result.data.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر حفظ الفاتورة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="فاتورة جديدة"
      description="أنشئ فاتورة مرتبطة بالعميل والفحص إن وجد"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="label">العميل *</span>
              <select
                required
                className="input"
                value={form.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">اختر العميل</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.phone || c.customer_number}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">الفحص المرتبط</span>
              <select
                className="input"
                value={form.examId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, examId: e.target.value }))
                }
                disabled={!form.customerId}
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
          <button disabled={loading} className="btn-primary">
            {loading ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

function LoadingState() {
  return (
    <PageContainer title="فاتورة جديدة" description="جاري تجهيز نموذج الفاتورة">
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">
        جاري التحميل...
      </div>
    </PageContainer>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewInvoiceContent />
    </Suspense>
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
