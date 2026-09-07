"use client";

import {
  useEffect,
  useState,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type {
  Settings,
  CashClosure,
} from "@/types/app";

function PrintContent() {
  const params = useSearchParams();

  const id = params.get("id");
  const date = params.get("date");

  const [closure, setClosure] =
    useState<CashClosure | null>(null);

  const [settings, setSettings] =
    useState<Settings | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id && !date) {
      return;
    }

    const closureQuery = id
      ? `id=${encodeURIComponent(id)}`
      : `date=${encodeURIComponent(
          date || "",
        )}`;

    Promise.all([
      fetch(
        `/api/cash-closure?${closureQuery}`,
      ).then((r) => r.json()),

      fetch("/api/settings").then((r) =>
        r.json(),
      ),
    ])
      .then(([c, s]) => {
        if (c.success && c.data) {
          setClosure(c.data);
        } else {
          setError(
            c.error ||
              "تعذر تحميل تقرير الإغلاق",
          );
        }

        if (s.success) {
          setSettings(s.data);
        }
      })
      .catch(() => {
        setError(
          "حدث خطأ أثناء تحميل التقرير",
        );
      });
  }, [id, date]);

  useEffect(() => {
    if (closure && settings) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [closure, settings]);

  if (!id && !date) {
    return (
      <div className="p-8 text-center text-red-600">
        لم يتم تحديد تقرير الإغلاق
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!closure || !settings) {
    return (
      <div className="p-8 text-center">
        جاري التحميل...
      </div>
    );
  }

  const currency =
    settings.currency || "ر.ي";

  const money = (n: number) =>
    formatCurrency(n, currency);

  const difference = Number(
    closure.difference || 0,
  );

  return (
    <main
      className="min-h-screen bg-white p-8 text-black"
      dir="rtl"
    >
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        body {
          margin: 0;
          background: white;
        }

        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-lg text-center">
        <h1 className="mb-1 text-2xl font-black">
          {settings.shop_name ||
            "المركز الأردني للنظارات"}
        </h1>

        <p className="mb-6 text-sm font-bold text-gray-500">
          تقرير إغلاق الصندوق
        </p>

        <div className="mb-4 rounded-xl border border-gray-300 bg-gray-50 p-3 text-center">
          <span className="font-bold">
            حالة الصندوق:
          </span>{" "}
          <span className="font-black">
            مغلق
          </span>
        </div>

        <div className="space-y-2 border-t pt-4 text-sm text-right">
          <div className="flex justify-between">
            <span>التاريخ</span>

            <span className="font-bold">
              {formatDate(
                closure.business_date,
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>وقت الإغلاق</span>

            <span
              className="font-bold"
              dir="ltr"
            >
              {closure.closed_at
                ? new Date(
                    closure.closed_at,
                  ).toLocaleString(
                    "ar-SA",
                  )
                : "—"}
            </span>
          </div>

          <div className="mt-2 flex justify-between border-t pt-2">
            <span>
              الرصيد الافتتاحي
            </span>

            <span>
              {money(
                Number(
                  closure.opening_balance ||
                    0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              إجمالي المبيعات
            </span>

            <span>
              {money(
                Number(
                  closure.total_sales ||
                    0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              إجمالي المقبوضات
            </span>

            <span>
              {money(
                Number(
                  closure.total_collections ||
                    0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>المصروفات</span>

            <span>
              {money(
                Number(
                  closure.total_expenses ||
                    0,
                ),
              )}
            </span>
          </div>

          <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
            <span>
              الرصيد المتوقع
            </span>

            <span>
              {money(
                Number(
                  closure.expected_cash ||
                    0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>النقد الفعلي</span>

            <span>
              {money(
                Number(
                  closure.actual_cash ||
                    0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between text-lg font-bold">
            <span>الفرق</span>

            <span
              className={
                difference === 0
                  ? "text-emerald-700"
                  : "text-rose-700"
              }
            >
              {difference === 0
                ? "متطابق"
                : `${
                    difference > 0
                      ? "فائض"
                      : "عجز"
                  } ${money(
                    Math.abs(
                      difference,
                    ),
                  )}`}
            </span>
          </div>

          <div className="mt-2 flex justify-between border-t pt-2">
            <span>
              حالة الصندوق
            </span>

            <span className="font-bold">
              مغلق
            </span>
          </div>
        </div>

        <button
          type="button"
          className="no-print btn-primary mt-8"
          onClick={() => window.print()}
        >
          طباعة
        </button>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          جاري التحميل...
        </div>
      }
    >
      <PrintContent />
    </Suspense>
  );
}