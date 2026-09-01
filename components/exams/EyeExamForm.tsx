"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { todayISO } from "@/lib/utils/formatDate";
import type { Exam } from "@/types/app";

type Form = {
  customerId: string;
  examDate: string;
  odSph: string; odCyl: string; odAxis: string; odAdd: string; odPrism: string; odBase: string;
  osSph: string; osCyl: string; osAxis: string; osAdd: string; osPrism: string; osBase: string;
  pd: string; nearPd: string; examiner: string; notes: string;
};

function toForm(customerId: string, exam?: Exam): Form {
  return {
    customerId,
    examDate: exam?.exam_date || todayISO(),
    odSph: String(exam?.od_sph ?? ""), odCyl: String(exam?.od_cyl ?? ""), odAxis: String(exam?.od_axis ?? ""),
    odAdd: String(exam?.od_add ?? ""), odPrism: String(exam?.od_prism ?? ""), odBase: exam?.od_base ?? "",
    osSph: String(exam?.os_sph ?? ""), osCyl: String(exam?.os_cyl ?? ""), osAxis: String(exam?.os_axis ?? ""),
    osAdd: String(exam?.os_add ?? ""), osPrism: String(exam?.os_prism ?? ""), osBase: exam?.os_base ?? "",
    pd: String(exam?.pd ?? ""), nearPd: String(exam?.near_pd ?? ""),
    examiner: exam?.examiner ?? "", notes: exam?.notes ?? "",
  };
}

export function EyeExamForm({
  customerId,
  initial,
  examId,
}: {
  customerId: string;
  initial?: Exam;
  examId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => toForm(customerId, initial));
  const [loading, setLoading] = useState(false);

  const set = (key: keyof Form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(examId ? `/api/exams/${examId}` : "/api/exams", {
        method: examId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر حفظ الفحص");
      router.push(examId ? `/exams/${examId}` : `/customers/${customerId}`);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر حفظ الفحص");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label><span className="label">تاريخ الفحص</span><input className="input" type="date" value={form.examDate} onChange={(e) => set("examDate", e.target.value)} required /></label>
        <label><span className="label">اسم الفاحص</span><input className="input" value={form.examiner} onChange={(e) => set("examiner", e.target.value)} /></label>
        <label><span className="label">PD</span><input className="input" type="number" step="0.5" value={form.pd} onChange={(e) => set("pd", e.target.value)} placeholder="63" /></label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[720px] text-center text-sm">
          <thead className="bg-slate-50"><tr><th className="p-4 text-right">العين</th>{["SPH","CYL","AXIS","ADD","Prism","Base"].map((x) => <th key={x} className="p-4">{x}</th>)}</tr></thead>
          <tbody>
            <EyeRow label="اليمنى (OD)" prefix="od" form={form} set={set} />
            <EyeRow label="اليسرى (OS)" prefix="os" form={form} set={set} />
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label><span className="label">Near PD</span><input className="input" type="number" step="0.5" value={form.nearPd} onChange={(e) => set("nearPd", e.target.value)} /></label>
        <label><span className="label">ملاحظات</span><textarea className="input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary">إلغاء</button>
        <button disabled={loading} className="btn-primary">{loading ? "جاري الحفظ..." : examId ? "حفظ التعديلات" : "حفظ الفحص"}</button>
      </div>
    </form>
  );
}

function EyeRow({
  label, prefix, form, set,
}: {
  label: string; prefix: "od" | "os"; form: Form; set: (key: keyof Form, value: string) => void;
}) {
  const fields: Array<[keyof Form, string, string]> =
    prefix === "od"
      ? [["odSph","sph","number"],["odCyl","cyl","number"],["odAxis","axis","number"],["odAdd","add","number"],["odPrism","prism","number"],["odBase","base","text"]]
      : [["osSph","sph","number"],["osCyl","cyl","number"],["osAxis","axis","number"],["osAdd","add","number"],["osPrism","prism","number"],["osBase","base","text"]];

  return (
    <tr className="border-t border-slate-100">
      <td className="p-3 text-right font-black">{label}</td>
      {fields.map(([key, name, type]) => (
        <td className="p-2" key={name}>
          <input className="w-full rounded-lg border border-slate-200 bg-white p-2 text-center outline-none focus:border-indigo-500" type={type}
            step={type === "number" ? "0.25" : undefined}
            min={name === "axis" ? 0 : undefined} max={name === "axis" ? 180 : undefined}
            value={form[key] || ""} onChange={(e) => set(key, e.target.value)} />
        </td>
      ))}
    </tr>
  );
}
