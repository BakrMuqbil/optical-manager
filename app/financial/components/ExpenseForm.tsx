"use client";

import { useState } from "react";
import { PlusCircle, Save, X } from "lucide-react";
import type { FinancialTransaction } from "@/types/financial";

type Props = {
  date: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
  expense?: FinancialTransaction | null;
};

export function ExpenseForm({
  date,
  currency,
  onSuccess,
  onCancel,
  expense = null,
}: Props) {
  const isEditMode = Boolean(expense);

  const [amount, setAmount] = useState(
    expense ? String(expense.amount) : ""
  );
  const [description, setDescription] = useState(
    expense ? expense.description || "" : ""
  );
  const [notes, setNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    expense ? expense.transaction_date : date
  );
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const value = Number(amount);

    if (!value || value <= 0) {
      alert("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (!description.trim()) {
      alert("يرجى إدخال وصف المصروف");
      return;
    }

    if (!expenseDate) {
      alert("يرجى اختيار تاريخ المصروف");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/expenses", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditMode ? { id: expense!.id } : {}),
          amount: value,
          date: expenseDate,
          description: description.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            (isEditMode ? "تعذر تعديل المصروف" : "تعذر تسجيل المصروف")
        );
        return;
      }

      alert(isEditMode ? "تم تعديل المصروف بنجاح" : "تم تسجيل المصروف بنجاح");

      onSuccess();
    } catch {
      alert(
        isEditMode
          ? "حدث خطأ أثناء تعديل المصروف"
          : "حدث خطأ أثناء تسجيل المصروف"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="surface-card border">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-black">
            {isEditMode ? "تعديل مصروف" : "إضافة مصروف"}
          </h2>

          <p
            className="mt-1 text-xs"
            style={{
              color: "var(--text-muted)",
            }}
          >
            {isEditMode
              ? "تعديل بيانات المصروف المحدد"
              : "تسجيل مصروف جديد ضمن الحركات المالية"}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary"
          aria-label="إغلاق"
        >
          <X size={17} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-bold">
            المبلغ ({currency})
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            className="input w-full"
            placeholder="مثال: 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">
            التاريخ
          </label>

          <input
            type="date"
            className="input w-full"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-bold">
            وصف المصروف
          </label>

          <input
            type="text"
            className="input w-full"
            placeholder="مثال: شراء أدوات مكتبية"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-bold">
            ملاحظات{" "}
            <span className="font-normal">(اختياري)</span>
          </label>

          <textarea
            className="input min-h-24 w-full resize-y"
            placeholder="أي تفاصيل إضافية عن المصروف..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary"
        >
          إلغاء
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="btn-primary"
        >
          {isEditMode ? <Save size={17} /> : <PlusCircle size={17} />}
          {loading
            ? "جاري الحفظ..."
            : isEditMode
              ? "حفظ التعديلات"
              : "حفظ المصروف"}
        </button>
      </div>
    </section>
  );
}