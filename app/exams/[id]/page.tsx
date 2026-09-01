"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Printer, Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import { PrescriptionPrint } from "@/components/printing/PrescriptionPrint";
import type { Exam } from "@/types/app";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/exams/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (isMounted) setExam(j.data ?? null);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [id]);

  const remove = async () => {
    if (
      !exam ||
      !confirm(
        "هل تريد حذف هذا الفحص نهائيًا؟ إذا كان مرتبطًا بفاتورة سيتم فك الربط فقط.",
      )
    )
      return;
    const response = await fetch(`/api/exams/${exam.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return alert(result.error || "تعذر حذف الفحص");
    router.push(`/customers/${exam.customer_id}`);
  };

  if (!exam)
    return (
      <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
    );

  return (
    <div className="mx-auto max-w-4xl p-4 pt-20 md:p-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/customers/${exam.customer_id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
        >
          <ArrowRight size={17} />
          ملف العميل
        </Link>
        <div className="flex gap-2">
          <Link href={`/exams/${exam.id}/edit`} className="btn-secondary">
            <Edit size={17} />
            تعديل
          </Link>
          <button onClick={remove} className="btn-danger">
            <Trash2 size={17} />
            حذف
          </button>
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={17} />
            طباعة الوصفة
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b pb-5">
          <div>
            <h1 className="text-2xl font-black">وصفة نظر</h1>
            <p className="mt-1 text-sm text-slate-500">
              {exam.customer_name} • {exam.customer_number}
            </p>
            <p className="mt-1 text-xs text-slate-400">{exam.exam_number}</p>
          </div>
          <span className="text-sm text-slate-500">
            {formatDate(exam.exam_date)}
          </span>
        </div>
        <PrescriptionPrint exam={exam} />
      </div>
    </div>
  );
}
