"use client";

import { useCallback, useEffect, useState } from "react";
import type { CashClosure, FinancialTransaction, Invoice, Settings } from "@/types/app";
import {
  EMPTY_PAGINATION,
  type Summary,
  type TablePagination,
} from "../types/financial";

type UseFinancialDataOptions = {
  from: string;
  to: string;
};

export function useFinancialData({ from, to }: UseFinancialDataOptions) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [debts, setDebts] = useState<Invoice[]>([]);
  const [closure, setClosure] = useState<CashClosure | null>(null);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [periodClosed, setPeriodClosed] = useState(false);

  const [transactionPagination, setTransactionPagination] =
    useState<TablePagination>(EMPTY_PAGINATION);
  const [debtPagination, setDebtPagination] =
    useState<TablePagination>(EMPTY_PAGINATION);
  const [closurePagination, setClosurePagination] =
    useState<TablePagination>(EMPTY_PAGINATION);

  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [debtsLoading, setDebtsLoading] = useState(false);
  const [closuresLoading, setClosuresLoading] = useState(false);
  const [coreLoading, setCoreLoading] = useState(false);

  const loadCoreData = useCallback(async () => {
    setCoreLoading(true);
    try {
      const [financialResponse, settingsResponse] = await Promise.all([
        fetch(
          `/api/financial?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=10`,
          { cache: "no-store" },
        ),
        fetch("/api/settings", { cache: "no-store" }),
      ]);

      const [financial, settingsData] = await Promise.all([
        financialResponse.json(),
        settingsResponse.json(),
      ]);

      if (!financialResponse.ok || !financial.success) {
        throw new Error(financial.error || "تعذر تحميل البيانات المالية");
      }

      setSummary(financial.data.summary || null);
      setClosure((financial.data.closure || null) as CashClosure | null);
      setPeriodClosed(Boolean(financial.data.periodClosed));

      if (settingsData.success) setSettings(settingsData.data);
    } catch {
      setSummary(null);
      setClosure(null);
    } finally {
      setCoreLoading(false);
    }
  }, [from, to]);

  const loadTransactions = useCallback(
    async (page = 1) => {
      setTransactionsLoading(true);
      try {
        const params = new URLSearchParams({
          from,
          to,
          transactionPage: String(page),
          debtPage: "1",
          limit: "10",
        });
        const response = await fetch(`/api/financial?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "تعذر جلب الحركات المالية");
        }

        setTransactions((data.data.transactions || []) as FinancialTransaction[]);
        setTransactionPagination(
          data.data.transactionPagination || { ...EMPTY_PAGINATION, page },
        );
      } catch {
        setTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    },
    [from, to],
  );

  const loadDebts = useCallback(async (page = 1) => {
    setDebtsLoading(true);
    try {
      const params = new URLSearchParams({
        from,
        to,
        transactionPage: "1",
        debtPage: String(page),
        limit: "10",
      });
      const response = await fetch(`/api/financial?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "تعذر جلب الفواتير غير المسددة");
      }

      setDebts((data.data.debts || []) as Invoice[]);
      setDebtPagination(
        data.data.debtPagination || { ...EMPTY_PAGINATION, page },
      );
    } catch {
      setDebts([]);
    } finally {
      setDebtsLoading(false);
    }
  }, [from, to]);

  const loadClosures = useCallback(async (page = 1) => {
    setClosuresLoading(true);
    try {
      const response = await fetch(`/api/cash-closure?page=${page}&limit=10`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "تعذر جلب سجل الإغلاقات");
      }

      setClosures((data.data || []) as CashClosure[]);
      setClosurePagination(data.pagination || { ...EMPTY_PAGINATION, page });
    } catch {
      setClosures([]);
    } finally {
      setClosuresLoading(false);
    }
  }, []);

    useEffect(() => {
    // Data fetching is intentionally triggered by the selected range.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCoreData();
    
    void loadTransactions(1);
    
    void loadDebts(1);
  }, [loadCoreData, loadTransactions, loadDebts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadClosures(1);
  }, [loadClosures]);


  const refresh = useCallback(
    async (pages = {
      transaction: transactionPagination.page,
      debt: debtPagination.page,
      closure: closurePagination.page,
    }) => {
      await Promise.all([
        loadCoreData(),
        loadTransactions(pages.transaction),
        loadDebts(pages.debt),
        loadClosures(pages.closure),
      ]);
    },
    [
      closurePagination.page,
      debtPagination.page,
      loadClosures,
      loadCoreData,
      loadDebts,
      loadTransactions,
      transactionPagination.page,
    ],
  );

  return {
    settings,
    summary,
    transactions,
    debts,
    closure,
    closures,
    transactionPagination,
    debtPagination,
    closurePagination,
    transactionsLoading,
    debtsLoading,
    closuresLoading,
    coreLoading,
    isClosed: periodClosed || closure?.status === "CLOSED",
    loadTransactions,
    loadDebts,
    loadClosures,
    refresh,
  };
}
