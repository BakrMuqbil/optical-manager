import { formatDate } from "@/lib/utils/formatDate";
import type { Period } from "../types/financial";

export function getPeriodRange(period: Period, cursor: string) {
  const [year, month] = cursor.split("-").map(Number);

  if (period === "daily") {
    return { from: cursor, to: cursor };
  }

  if (period === "monthly") {
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0);

    return {
      from: formatLocalDate(fromDate),
      to: formatLocalDate(toDate),
    };
  }

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

export function moveCursor(period: Period, cursor: string, delta: number) {
  const [year, month, day] = cursor.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (period === "daily") date.setDate(date.getDate() + delta);
  else if (period === "monthly") date.setMonth(date.getMonth() + delta);
  else date.setFullYear(date.getFullYear() + delta);

  return formatLocalDate(date);
}

export function periodLabel(period: Period, cursor: string) {
  const date = new Date(`${cursor}T00:00:00`);

  if (period === "daily") return formatDate(cursor);

  if (period === "monthly") {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  return String(date.getFullYear());
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
