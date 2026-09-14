"use client";

import { useCallback, useEffect, useState } from "react";
import type { Invoice } from "@/types/invoice";
import type { Period } from "../types/financial";
import { getPeriodRange } from "../utils/period";

type Options = { period: Period; cursor: string };

export function useInvoiceHistory({ period, cursor }: Options) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = getPeriodRange(period, cursor);
      const params = new URLSearchParams({ ...range, q, status });
      const response = await fetch(`/api/invoices?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "تعذر تحميل الفواتير");
      setRows((data.data || []) as Invoice[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period, cursor, q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("هل تريد حذف الفاتورة نهائيًا؟")) return;
    try {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (response.ok) {
        await load();
        return;
      }
      const data = await response.json();
      alert(data.error || "تعذر حذف الفاتورة");
    } catch {
      alert("تعذر حذف الفاتورة");
    }
  };

  return { q, setQ, status, setStatus, rows, loading, load, remove };
}
