"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate, todayISO } from "@/lib/utils/formatDate";
import type { Settings, CashClosure } from "@/types/app";
import {
  Lock,
  AlertCircle,
  Printer,
  ArrowRight,
} from "lucide-react";

type Summary = {
  sales: number;
  collections: number;
  expenses: number;
  oldDebtCollection: number;
  todayPaymentsOnNewInvoices: number;
};

export default function ClosurePage() {
  const router = useRouter();
  const params = useSearchParams();

  const closureId = params.get("id");
  const historical = Boolean(closureId);

  const [date, setDate] = useState(todayISO());
  const [settings, setSettings] =
    useState<Settings | null>(null);
  const [summary, setSummary] =
    useState<Summary | null>(null);
  const [closure, setClosure] =
    useState<CashClosure | null>(null);

  const [openingBalance, setOpeningBalance] =
    useState("");
  const [actualCash, setActualCash] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [closed, setClosed] =
    useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setSettings(j.data);
        }
      });
  }, []);

  useEffect(() => {
    if (closureId) {
      fetch(
        `/api/cash-closure?id=${encodeURIComponent(
          closureId,
        )}`,
        {
          cache: "no-store",
        },
      )
        .then((r) => r.json())
        .then((j) => {
          if (!j.success) {
            setError(
              j.error ||
                "تعذر تحميل تقرير الإغلاق",
            );
            return;
          }

          const data =
            j.data as CashClosure;

          setClosure(data);
          setDate(data.business_date);
          setClosed(
            data.status === "CLOSED",
          );
          setOpeningBalance(
            String(
              data.opening_balance || 0,
            ),
          );
          setActualCash(
            String(
              data.actual_cash || 0,
            ),
          );
        })
        .catch(() => {
          setError(
            "تعذر تحميل تقرير الإغلاق",
          );
        });

      return;
    }

    fetch(
      `/api/financial?date=${date}`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setSummary(j.data.summary);

          setClosure(
            j.data.closure || null,
          );

          setClosed(
            j.data.closure?.status ===
              "CLOSED",
          );
        }
      })
      .catch(() => {
        setError(
          "تعذر تحميل بيانات اليوم",
        );
      });
  }, [date, closureId]);

  const currency =
    settings?.currency || "ر.ي";

  const money = (n: number) =>
    formatCurrency(n, currency);

  const expected = historical
    ? Number(
        closure?.expected_cash || 0,
      )
    : summary
      ? Number(openingBalance || 0) +
        summary.collections -
        summary.expenses
      : 0;

  const difference = historical
    ? Number(
        closure?.difference || 0,
      )
    : Number(actualCash || 0) -
      expected;

  const submit = async () => {
    if (
      !confirm(
        "هل أنت متأكد من إغلاق صندوق هذا اليوم؟ بعد الإغلاق لن يمكن تعديل أو إضافة حركات مالية لهذا اليوم.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const r = await fetch(
        "/api/cash-closure",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            date,
            actualCash: Number(
              actualCash || 0,
            ),
            openingBalance: Number(
              openingBalance || 0,
            ),
          }),
        },
      );

      const j = await r.json();

      if (!r.ok) {
        setError(
          j.error || "تعذر الإغلاق",
        );
        return;
      }

      alert(
        "تم إغلاق الصندوق بنجاح",
      );

      setClosed(true);
    } catch {
      setError(
        "حدث خطأ أثناء إغلاق الصندوق",
      );
    } finally {
      setLoading(false);
    }
  };

  if (historical) {
    return (
      <PageContainer
        title="تقرير إغلاق الصندوق"
        description="عرض تقرير إغلاق سابق — للقراءة والطباعة فقط"
      >
        <div className="mx-auto max-w-xl space-y-5">
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl border p-4 text-sm font-bold"
              style={{
                borderColor:
                  "var(--danger)",
                background:
                  "var(--danger-soft)",
                color:
                  "var(--danger)",
              }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {!closure ? (
            <div className="surface-card p-10 text-center">
              جاري تحميل التقرير...
            </div>
          ) : (
            <>
              <section className="surface-card">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="status-success inline-flex">
                      <Lock size={17} />
                      اليوم مغلق
                    </div>

                    <h2 className="mt-3 text-xl font-black">
                      {formatDate(
                        closure.business_date,
                      )}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      window.open(
                        `/financial/closure/print?id=${encodeURIComponent(
                          String(
                            closure.id,
                          ),
                        )}`,
                        "_blank",
                      )
                    }
                  >
                    <Printer size={17} />
                    طباعة التقرير
                  </button>
                </div>

                <div className="space-y-3">
                  <SummaryRow
                    label="الرصيد الافتتاحي"
                    value={money(
                      Number(
                        closure.opening_balance ||
                          0,
                      ),
                    )}
                  />

                  <SummaryRow
                    label="إجمالي المبيعات"
                    value={money(
                      Number(
                        closure.total_sales ||
                          0,
                      ),
                    )}
                  />

                  <SummaryRow
                    label="إجمالي المقبوضات"
                    value={money(
                      Number(
                        closure.total_collections ||
                          0,
                      ),
                    )}
                  />

                  <SummaryRow
                    label="المصروفات"
                    value={money(
                      Number(
                        closure.total_expenses ||
                          0,
                      ),
                    )}
                    danger
                  />

                  <SummaryRow
                    label="الرصيد المتوقع"
                    value={money(
                      Number(
                        closure.expected_cash ||
                          0,
                      ),
                    )}
                    strong
                  />

                  <SummaryRow
                    label="النقد الفعلي"
                    value={money(
                      Number(
                        closure.actual_cash ||
                          0,
                      ),
                    )}
                    strong
                  />

                  <SummaryRow
                    label="الفرق"
                    value={
                      difference === 0
                        ? "متطابق"
                        : `${
                            difference > 0
                              ? "فائض"
                              : "عجز"
                          } ${money(
                            Math.abs(
                              difference,
                            ),
                          )}`
                    }
                    color={
                      difference === 0
                        ? "var(--success)"
                        : "var(--danger)"
                    }
                    strong
                  />
                </div>
              </section>

              <button
                type="button"
                className="btn-secondary w-full justify-center"
                onClick={() =>
                  router.push(
                    "/financial",
                  )
                }
              >
                <ArrowRight size={17} />
                العودة للإدارة المالية
              </button>
            </>
          )}
        </div>
      </PageContainer>
    );
  }

  if (closed) {
    return (
      <PageContainer
        title="إغلاق الصندوق"
        description="تم إغلاق هذا اليوم مسبقًا"
      >
        <div className="surface-card p-10 text-center">
          <div className="status-success mb-4 inline-flex">
            <Lock size={18} />
            اليوم مغلق
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {closure?.id && (
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `/financial/closure/print?id=${encodeURIComponent(
                      String(
                        closure.id,
                      ),
                    )}`,
                    "_blank",
                  )
                }
                className="btn-primary"
              >
                <Printer size={17} />
                طباعة التقرير
              </button>
            )}

            <button
              onClick={() =>
                router.push(
                  "/financial",
                )
              }
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
              borderColor:
                "var(--danger)",
              background:
                "var(--danger-soft)",
              color:
                "var(--danger)",
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="surface-card space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-bold"
              style={{
                color:
                  "var(--text-secondary)",
              }}
            >
              التاريخ:
            </span>

            <input
              type="date"
              className="input w-auto"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />
          </div>

          {summary && (
            <div className="space-y-3">
              <SummaryRow
                label="مبيعات اليوم"
                value={money(
                  summary.sales,
                )}
              />

              <SummaryRow
                label="إجمالي المقبوضات"
                value={money(
                  summary.collections,
                )}
              />

              <SummaryRow
                label="منها تحصيل ديون قديمة"
                value={money(
                  summary.oldDebtCollection,
                )}
                muted
              />

              <SummaryRow
                label="منها دفعات فواتير اليوم"
                value={money(
                  summary.todayPaymentsOnNewInvoices,
                )}
                muted
              />

              <SummaryRow
                label="المصروفات"
                value={money(
                  summary.expenses,
                )}
                danger
              />
            </div>
          )}

          <label>
            <span className="label">
              الرصيد الافتتاحي
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={openingBalance}
              onChange={(e) =>
                setOpeningBalance(
                  e.target.value,
                )
              }
              placeholder="0"
            />
          </label>

          <div
            className="flex justify-between rounded-xl border p-4"
            style={{
              background:
                "var(--primary-soft)",
              borderColor:
                "var(--primary)",
            }}
          >
            <span
              className="font-bold"
              style={{
                color:
                  "var(--primary)",
              }}
            >
              الرصيد المتوقع
            </span>

            <span
              className="text-xl font-black"
              style={{
                color:
                  "var(--primary)",
              }}
            >
              {money(expected)}
            </span>
          </div>

          <label>
            <span className="label">
              النقد الفعلي
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={actualCash}
              onChange={(e) =>
                setActualCash(
                  e.target.value,
                )
              }
              placeholder="0"
            />
          </label>

          <div
            className="flex justify-between rounded-xl border p-4"
            style={
              difference === 0
                ? {
                    background:
                      "var(--success-soft)",
                    borderColor:
                      "var(--success)",
                  }
                : {
                    background:
                      "var(--danger-soft)",
                    borderColor:
                      "var(--danger)",
                  }
            }
          >
            <span
              className="font-bold"
              style={{
                color:
                  difference === 0
                    ? "var(--success)"
                    : "var(--danger)",
              }}
            >
              الفرق
            </span>

            <span
              className="text-xl font-black"
              style={{
                color:
                  difference === 0
                    ? "var(--success)"
                    : "var(--danger)",
              }}
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

          <button
            onClick={submit}
            disabled={
              loading || !actualCash
            }
            className="btn-primary w-full justify-center"
          >
            <Lock size={17} />
            {loading
              ? "جاري الإغلاق..."
              : "تأكيد إغلاق الصندوق"}
          </button>
        </section>
      </div>
    </PageContainer>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
  danger = false,
  strong = false,
  color,
}: {
  label: string;
  value: string;
  muted?: boolean;
  danger?: boolean;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div
      className={`flex justify-between border-b pb-2 ${
        strong ? "text-lg" : ""
      } ${muted ? "text-sm" : ""}`}
      style={{
        borderColor: "var(--border)",
      }}
    >
      <span
        className={
          strong
            ? "font-bold"
            : ""
        }
        style={{
          color:
            color ||
            (muted
              ? "var(--text-muted)"
              : danger
                ? "var(--danger)"
                : undefined),
        }}
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-black"
            : "font-bold"
        }
        style={{
          color:
            color ||
            (danger
              ? "var(--danger)"
              : undefined),
        }}
      >
        {value}
      </span>
    </div>
  );
}