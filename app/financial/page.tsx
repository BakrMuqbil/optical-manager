"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, TrendingDown } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { FinancialTransaction } from "@/types/financial";
import { CashClosuresTable } from "./components/CashClosuresTable";
import { ExpenseForm } from "./components/ExpenseForm";
import { FinancialPeriodSelector } from "./components/FinancialPeriodSelector";
import { FinancialSummary } from "./components/FinancialSummary";
import { FinancialTransactionsTable } from "./components/FinancialTransactionsTable";
import { InvoiceHistory } from "./components/InvoiceHistory";
import { OutstandingDebtsTable } from "./components/OutstandingDebtsTable";
import { useFinancialData } from "./hooks/useFinancialData";
import { useFinancialPeriod } from "./hooks/useFinancialPeriod";
import type { FinancialTab } from "./types/financial";
import { PeriodClosureAlert } from "@/components/financial/PeriodClosureAlert";

export default function FinancialPage() {
  const period = useFinancialPeriod();
  const data = useFinancialData({ from: period.from, to: period.to });
  const [activeTab, setActiveTab] = useState<FinancialTab>("overview");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FinancialTransaction | null>(null);

  const currency = data.settings?.currency || "ر.ي";
  const expectedCash = data.summary
    ? data.summary.collections - data.summary.expenses
    : 0;

  const handlePeriodChange = (value: Parameters<typeof period.changePeriod>[0]) => {
    period.changePeriod(value);
  };

  const handleExpenseSuccess = async () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    await data.refresh();
  };

  const handleEditExpense = (transaction: FinancialTransaction) => {
    if (data.isClosed) {
      alert("لا يمكن تعديل مصروف في يوم مغلق");
      return;
    }
    setEditingExpense(transaction);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (transaction: FinancialTransaction) => {
    if (data.isClosed) {
      alert("لا يمكن حذف مصروف في يوم مغلق");
      return;
    }
    if (!confirm("هل تريد حذف هذا المصروف نهائيًا؟")) return;

    try {
      const response = await fetch(`/api/expenses?id=${encodeURIComponent(transaction.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.error || "تعذر حذف المصروف");
        return;
      }
      await data.refresh();
    } catch {
      alert("حدث خطأ أثناء حذف المصروف");
    }
  };

  return (
    <PageContainer
      title="الإدارة المالية"
      description="ملخص يومي، حركات مالية، تحصيل الديون، وإغلاق الصندوق"
      actions={
        <div className="flex flex-wrap items-center gap-2">
      <PeriodClosureAlert />
          {!data.isClosed && (
            <button type="button" className="btn-secondary" onClick={() => setShowExpenseForm(true)}>
              <TrendingDown size={17} />
              إضافة مصروف
            </button>
          )}
          <Link href="/financial/closure" className="btn-primary">
            <Lock size={17} />
            إغلاق الصندوق
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {data.isClosed && (
          <div className="status-success mb-4 inline-flex">
            <Lock size={18} />
            اليوم مغلق
          </div>
        )}

        <FinancialPeriodSelector
          period={period.period}
          label={period.label}
          onPeriodChange={handlePeriodChange}
          onPrevious={period.previous}
          onNext={period.next}
          onToday={period.today}
        />

        <Modal
          open={showExpenseForm}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
        >
          <ExpenseForm
            date={period.cursor}
            currency={currency}
            expense={editingExpense}
            onSuccess={handleExpenseSuccess}
            onCancel={() => {
              setShowExpenseForm(false);
              setEditingExpense(null);
            }}
          />
        </Modal>

        <FinancialSummary summary={data.summary} currency={currency} />

        {data.summary && (
          <section className="surface-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                  تحصيلات فواتير الفترة
                </div>
                <div className="mt-1 text-xl font-black" style={{ color: "var(--primary)" }}>
                  {formatCurrency(data.summary.todayPaymentsOnNewInvoices, currency)}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                  صافي حركة الصندوق
                </div>
                <div className="mt-1 text-xl font-black" style={{ color: "var(--primary)" }}>
                  {formatCurrency(expectedCash, currency)}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex w-full gap-1 rounded-xl p-1 sm:w-fit" style={{ background: "var(--surface-muted)" }}>
          {(["overview", "archive"] as const).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className="flex-1 rounded-lg px-5 py-2 text-center text-sm font-bold transition-colors sm:flex-initial"
              style={
                activeTab === value
                  ? {
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-sm)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              {value === "overview" ? "نظرة عامة" : "السجلات"}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <>
            <FinancialTransactionsTable
              transactions={data.transactions}
              pagination={data.transactionPagination}
              loading={data.transactionsLoading || data.coreLoading}
              onPageChange={data.loadTransactions}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
            <OutstandingDebtsTable
              debts={data.debts}
              pagination={data.debtPagination}
              loading={data.debtsLoading}
              onPageChange={data.loadDebts}
              onPaymentSuccess={data.refresh}
            />
          </>
        ) : (
          <>
            <CashClosuresTable
              closures={data.closures}
              pagination={data.closurePagination}
              loading={data.closuresLoading}
              onPageChange={data.loadClosures}
            />
            <InvoiceHistory period={period.period} cursor={period.cursor} settings={data.settings} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
