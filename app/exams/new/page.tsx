"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { EyeExamForm } from "@/components/exams/EyeExamForm";
import type { Customer } from "@/types/app";

function NewExamContent() {
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [id, setId] = useState(searchParams.get("customerId") || "");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((j) => setCustomers(j.data || []));
  }, []);

  return (
    <PageContainer
      title="تسجيل فحص نظر"
      description="اختر العميل ثم أدخل قياسات النظر"
    >
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="label">العميل *</span>

          <select
            className="input"
            value={id}
            onChange={(e) => setId(e.target.value)}
          >
            <option value="">اختر العميل</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} — {customer.phone || customer.customer_number}
              </option>
            ))}
          </select>
        </label>
      </div>

      {id ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <EyeExamForm customerId={id} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">
          اختر عميلًا للبدء.
        </div>
      )}
    </PageContainer>
  );
}

function LoadingState() {
  return (
    <PageContainer
      title="تسجيل فحص نظر"
      description="اختر العميل ثم أدخل قياسات النظر"
    >
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">
        جاري التحميل...
      </div>
    </PageContainer>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewExamContent />
    </Suspense>
  );
}
