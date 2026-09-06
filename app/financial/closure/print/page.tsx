"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { Settings, CashClosure } from "@/types/app";

function PrintContent() {
  const params = useSearchParams();
  const date = params.get("date") || "";
  const [closure, setClosure] = useState<CashClosure | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (!date) return;
    Promise.all([
      fetch(`/api/cash-closure?date=${date}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([c, s]) => {
      if (c.success) setClosure(c.data);
      if (s.success) setSettings(s.data);
    });
  }, [date]);

  useEffect(() => {
    if (closure && settings) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [closure, settings]);

  if (!closure || !settings)
    return <div className="p-8 text-center">جاري التحميل...</div>;

  const currency = settings.currency || "ر.ي";
  const money = (n: number) => formatCurrency(n, currency);

  return (
    <main className="min-h-screen bg-white p-8">
      <style>{"@page{size:A4;margin:10mm} body{margin:0}"}</style>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-black mb-1">
          {settings.shop_name || "المركز الأردني للنظارات"}
        </h1>
        <p className="text-sm font-bold mb-6" style={{ color: "var(--text-muted)" }}>
          تقرير إغلاق الصندوق
        </p>

        <div className="text-left space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between">
            <span>التاريخ</span>
            <span className="font-bold">{formatDate(closure.business_date)}</span>
          </div>
          <div className="flex justify-between">
            <span>وقت الإغلاق</span>
            <span className="font-bold" dir="ltr">
              {closure.closed_at
                ? new Date(closure.closed_at).toLocaleString("ar-SA")
                : "—"}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span>الرصيد الافتتاحي</span>
            <span>{money(closure.opening_balance)}</span>
          </div>
          <div className="flex justify-between">
            <span>إجمالي المبيعات</span>
            <span>{money(closure.total_sales)}</span>
          </div>
          <div className="flex justify-between">
            <span>إجمالي المقبوضات</span>
            <span>{money(closure.total_collections)}</span>
          </div>
          <div className="flex justify-between">
            <span>المصروفات</span>
            <span>{money(closure.total_expenses)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2 font-bold text-lg">
            <span>الرصيد المتوقع</span>
            <span>{money(closure.expected_cash)}</span>
          </div>
          <div className="flex justify-between">
            <span>النقد الفعلي</span>
            <span>{money(closure.actual_cash || 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>الفرق</span>
            <span
              className={
                closure.difference === 0 ? "text-emerald-700" : "text-rose-700"
              }
            >
              {closure.difference === 0
                ? "متطابق"
                : `${closure.difference > 0 ? "فائض" : "عجز"} ${money(
                    Math.abs(closure.difference),
                  )}`}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span>حالة الصندوق</span>
            <span className="font-bold">مغلق</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">جاري التحميل...</div>}
    >
      <PrintContent />
    </Suspense>
  );
}
