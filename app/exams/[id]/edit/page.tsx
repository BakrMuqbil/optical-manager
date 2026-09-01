"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { EyeExamForm } from "@/components/exams/EyeExamForm";
import type { Exam } from "@/types/app";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    params.then(({ id }) =>
      fetch(`/api/exams/${id}`).then((r) => r.json()).then((j) => setExam(j.data ?? null)),
    );
  }, [params]);

  if (!exam) return <div className="p-12 text-center text-slate-400">جاري التحميل...</div>;

  return (
    <PageContainer title="تعديل فحص النظر" description={`${exam.customer_name || ""} • ${exam.exam_number}`}>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <EyeExamForm customerId={exam.customer_id} initial={exam} examId={exam.id} />
      </div>
    </PageContainer>
  );
}
