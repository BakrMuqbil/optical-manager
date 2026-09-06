"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { todayISO } from "@/lib/utils/formatDate";
import type { Settings } from "@/types/app";
import { Lock, AlertCircle } from "lucide-react";

type Summary = {
  sales: number;
  collections: number;
  expenses: number;
  oldDebtCollection: number;
  todayPaymentsOnNewInvoices: number;
};

export default function ClosurePage() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setSettings(j.data);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/financial?date=${date}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setSummary(j.data.summary);
          setClosed(j.data.closure?.status === "CLOSED");
        }
      });
  }, [date]);

  const currency = settings?.currency || "ر.ي";
  const money = (n: number) => formatCurrency(n, currency);
  const expected = summary
    ? Number(openingBalance || 0) + summary.collections - summary.expenses
    : 0;
  const difference = Number(actualCash || 0) - expected;

  const submit = async () => {
    if (
      !confirm(
        "هل أنت متأكد من إغلاق صندوق هذا اليوم؟ بعد الإغلاق لن يمكن تعديل أو إضافة حركات مالية لهذا اليوم.",
      )
    )
      return;
    setLoading(true);
    setError("");
    const r = await fetch("/api/cash-closure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        actualCash: Number(actualCash || 0),
        openingBalance: Number(openingBalance || 0),
      }),
    });
    const j = await r.json();
    setLoading(false);
    if (!r.ok) setError(j.error || "تعذر الإغلاق");
    else {
      alert("تم إغلاق الصندوق بنجاح");
      setClosed(true);
    }
  };

  if (closed) {
    return (
      <PageContainer
        title="إغلاق الصندوق"
        description="تم إغلاق هذا اليوم مسبقًا"
      >
        <div className="surface-card text-center p-10">
          <div className="status-success inline-flex mb-4">
            <Lock size={18} /> اليوم مغلق
          </div>
          <div className="mt-4">
            <button
              onClick={() =>
                window.open(`/financial/closure/print?date=${date}`, "_blank")
              }
              className="btn-primary"
            >
              طباعة التقرير
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push("/financial")}
              className="btn-secondary"
            >
              العودة للإدارة المالية
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="إغلاق الصندوق"
      description="حساب الرصيد المتوقع ومطابقته مع النقد الفعلي"
    >
      <div className="mx-auto max-w-xl space-y-5">
        {error && (
          <div
            className="flex items-center gap-2 rounded-xl border p-4 text-sm font-bold"
            style={{
              borderColor: "var(--danger)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
            }}
          >
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <section className="surface-card space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-bold"
              style={{ color: "var(--text-secondary)" }}
            >
              التاريخ:
            </span>
            <input
              type="date"
              className="input w-auto"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {summary && (
            <div className="space-y-3">
              <div
                className="flex justify-between border-b pb-2"
                style={{ borderColor: "var(--border)" }}
              >
                <span>مبيعات اليوم</span>
                <span className="font-bold">{money(summary.sales)}</span>
              </div>
              <div
                className="flex justify-between border-b pb-2"
                style={{ borderColor: "var(--border)" }}
              >
                <span>إجمالي المقبوضات</span>
                <span className="font-bold">
                  {money(summary.collections)}
                </span>
              </div>
              <div
                className="flex justify-between border-b pb-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <span>منها تحصيل ديون قديمة</span>
                <span>{money(summary.oldDebtCollection)}</span>
              </div>
              <div
                className="flex justify-between border-b pb-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <span>منها دفعات فواتير اليوم</span>
                <span>
                  {money(summary.todayPaymentsOnNewInvoices)}
                </span>
              </div>
              <div
                className="flex justify-between border-b pb-2"
                style={{ borderColor: "var(--border)" }}
              >
                <span>المصروفات</span>
                <span className="font-bold" style={{ color: "var(--danger)" }}>
                  {money(summary.expenses)}
                </span>
              </div>
            </div>
          )}

          <label>
            <span className="label">الرصيد الافتتاحي</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
            />
          </label>

          <div
            className="flex justify-between rounded-xl p-4 border"
            style={{
              background: "var(--primary-soft)",
              borderColor: "var(--primary)",
            }}
          >
            <span className="font-bold" style={{ color: "var(--primary)" }}>
              الرصيد المتوقع
            </span>
            <span
              className="font-black text-xl"
              style={{ color: "var(--primary)" }}
            >
              {money(expected)}
            </span>
          </div>

          <label>
            <span className="label">النقد الفعلي</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="0"
            />
          </label>

          <div
            className="flex justify-between rounded-xl p-4 border"
            style={
              difference === 0
                ? {
                    background: "var(--success-soft)",
                    borderColor: "var(--success)",
                  }
                : {
                    background: "var(--danger-soft)",
                    borderColor: "var(--danger)",
                  }
            }
          >
            <span
              className="font-bold"
              style={{
                color:
                  difference === 0 ? "var(--success)" : "var(--danger)",
              }}
            >
              الفرق
            </span>
            <span
              className="font-black text-xl"
              style={{
                color:
                  difference === 0 ? "var(--success)" : "var(--danger)",
              }}
            >
              {difference === 0
                ? "متطابق"
                : `${difference > 0 ? "فائض" : "عجز"} ${money(
                    Math.abs(difference),
                  )}`}
            </span>
          </div>

          <button
            onClick={submit}
            disabled={loading || !actualCash}
            className="btn-primary w-full justify-center"
          >
            <Lock size={17} />{" "}
            {loading ? "جاري الإغلاق..." : "تأكيد إغلاق الصندوق"}
          </button>
        </section>
      </div>
    </PageContainer>
  );
}
