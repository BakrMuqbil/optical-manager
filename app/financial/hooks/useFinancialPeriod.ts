"use client";

import { useMemo, useState } from "react";
import { todayISO } from "@/lib/utils/formatDate";
import type { Period } from "../types/financial";
import { getPeriodRange, moveCursor, periodLabel } from "../utils/period";

export function useFinancialPeriod() {
  const [period, setPeriod] = useState<Period>("daily");
  const [cursor, setCursor] = useState(todayISO());

  const range = useMemo(() => getPeriodRange(period, cursor), [period, cursor]);

  const changePeriod = (value: Period) => setPeriod(value);
  const changeCursor = (value: string) => {
    if (value) setCursor(value);
  };
  const previous = () => setCursor(moveCursor(period, cursor, -1));
  const next = () => setCursor(moveCursor(period, cursor, 1));
  const today = () => setCursor(todayISO());

  return {
    period,
    cursor,
    from: range.from,
    to: range.to,
    label: periodLabel(period, cursor),
    changePeriod,
    changeCursor,
    previous,
    next,
    today,
  };
}
