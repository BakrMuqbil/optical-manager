"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Period } from "../types/financial";

type Props = {
  period: Period;
  label: string;
  onPeriodChange: (period: Period) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

const periods: Array<[Period, string]> = [
  ["daily", "يومي"],
  ["monthly", "شهري"],
  ["yearly", "سنوي"],
];

export function FinancialPeriodSelector({
  period,
  label,
  onPeriodChange,
  onPrevious,
  onNext,
  onToday,
}: Props) {
  return (
    <section className="surface-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex w-full rounded-xl p-1 sm:w-auto"
          style={{ background: "var(--surface-muted)" }}
        >
          {periods.map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => onPeriodChange(value)}
              className="flex-1 rounded-lg px-4 py-2 text-center text-sm font-bold transition-colors sm:flex-initial"
              style={
                period === value
                  ? {
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-sm)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              {text}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            className="btn-secondary px-3"
            onClick={onPrevious}
            aria-label="الفترة السابقة"
          >
            <ChevronRight size={17} />
          </button>

          <div
            className="min-w-[140px] flex-1 rounded-xl border px-3 py-2 text-center text-sm font-black sm:min-w-[170px] sm:flex-none"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {label}
          </div>

          <button
            type="button"
            className="btn-secondary px-3"
            onClick={onNext}
            aria-label="الفترة التالية"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            className="btn-secondary whitespace-nowrap"
            onClick={onToday}
          >
            <CalendarDays size={17} />
            اليوم
          </button>
        </div>
      </div>
    </section>
  );
}
