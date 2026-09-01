"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { CustomerForm } from "@/components/customers/CustomerForm";
import type { Customer } from "@/types/app";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [c, setC] = useState<Customer | null>(null);

  useEffect(() => {
    params.then(({ id }) =>
      fetch(`/api/customers/${id}`)
        .then((r) => r.json())
        .then((j) =>
          setC(
            (j.data?.customer as Customer | undefined) ?? null,
          ),
        ),
    );
  }, [params]);

  if (!c) {
    return (
      <div className="p-12 text-center text-slate-400">
        جاري التحميل...
      </div>
    );
  }

  return (
    <PageContainer title="تعديل بيانات العميل">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <CustomerForm
          initial={{
            name: c.name,
            phone: c.phone ?? null,
            address: c.address ?? null,
            date_of_birth: c.date_of_birth ?? null,
            notes: c.notes ?? null,
          }}
          customerId={c.id}
        />
      </div>
    </PageContainer>
  );
}