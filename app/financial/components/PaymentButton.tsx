"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { todayISO } from "@/lib/utils/formatDate";

type Props = {
  invoiceId: string;
  remaining: number;
  onSuccess: () => void;
};

export function PaymentButton({
  invoiceId,
  remaining,
  onSuccess,
}: Props) {
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const val = Number(amount);

    if (!val || val <= 0 || val > remaining) {
      alert("مبلغ غير صالح");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          amount: val,
          date: todayISO(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر التسجيل");
        return;
      }

      setShow(false);
      setAmount("");

      onSuccess();
    } catch {
      alert("حدث خطأ أثناء تسجيل الدفعة");
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="btn-primary px-3 py-1.5 text-xs"
      >
        <PlusCircle size={14} />
        تسجيل دفعة
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0.01"
        step="0.01"
        max={remaining}
        className="input w-28 py-1 text-xs"
        placeholder="المبلغ"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={submit}
        disabled={loading}
        className="btn-primary px-3 py-1.5 text-xs"
      >
        {loading ? "جاري الحفظ..." : "تأكيد"}
      </button>

      <button
        onClick={() => setShow(false)}
        disabled={loading}
        className="btn-secondary px-3 py-1.5 text-xs"
      >
        إلغاء
      </button>
    </div>
  );
}
