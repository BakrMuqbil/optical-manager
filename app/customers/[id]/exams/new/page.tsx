"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { EyeExamForm } from "@/components/exams/EyeExamForm";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    params.then(({ id }) => {
      setId(id);
      fetch(`/api/customers/${id}`)
        .then((r) => r.json())
        .then((j) => setName(j.data?.customer?.name || ""));
    });
  }, [params]);
  if (!id)
    return (
      <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
    );
  return (
    <PageContainer
      title="تسجيل فحص نظر"
      description={name ? `العميل: ${name}` : ""}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <EyeExamForm customerId={id} />
      </div>
    </PageContainer>
  );
}
