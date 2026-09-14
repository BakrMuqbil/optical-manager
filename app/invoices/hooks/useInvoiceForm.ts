"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { todayISO } from "@/lib/utils/formatDate";
import type { Invoice } from "@/types/invoice";
import type { Settings } from "@/types/settings";

type Mode = "create" | "edit";

const emptyForm = () => ({
  customerName: "",
  customerPhone: "",
  invoiceDate: todayISO(),
  examiner: "",
  odSph: "",
  odCyl: "",
  odAxis: "",
  odAdd: "",
  osSph: "",
  osCyl: "",
  osAxis: "",
  osAdd: "",
  pd: "",
  nearPd: "",
  price: "",
  discount: "",
  paid: "",
  notes: "",
});

type FormState = ReturnType<typeof emptyForm>;

export function useInvoiceForm(mode: Mode, invoiceId?: string) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [settings, setSettings] = useState<Settings>({
    shop_name: "محل البصريات",
    phone: "",
    address: "",
    currency: "ر.ي",
    invoice_footer: "شكرًا لزيارتكم",
    paper_size: "A4",
  });
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data) setSettings(j.data as Settings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !invoiceId) return;

    fetch(`/api/invoices/${invoiceId}`)
      .then(r => r.json())
      .then(j => {
        if (!j.success) throw new Error(j.error || "تعذر تحميل الفاتورة");
        const i = j.data.invoice as Invoice;
        setForm({
          customerName: i.customer_name || "",
          customerPhone: i.customer_phone || "",
          invoiceDate: i.invoice_date || todayISO(),
          examiner: i.examiner || "",
          odSph: String(i.od_sph ?? ""),
          odCyl: String(i.od_cyl ?? ""),
          odAxis: String(i.od_axis ?? ""),
          odAdd: String(i.od_add ?? ""),
          osSph: String(i.os_sph ?? ""),
          osCyl: String(i.os_cyl ?? ""),
          osAxis: String(i.os_axis ?? ""),
          osAdd: String(i.os_add ?? ""),
          pd: String(i.pd ?? ""),
          nearPd: String(i.near_pd ?? ""),
          price: String(i.subtotal ?? ""),
          discount: String(i.discount ?? ""),
          paid: String(i.paid ?? ""),
          notes: i.notes || i.exam_notes || "",
        });
      })
      .catch(e => setError(e instanceof Error ? e.message : "تعذر تحميل الفاتورة"))
      .finally(() => setLoading(false));
  }, [mode, invoiceId]);

  const subtotal = Math.max(0, Number(form.price) || 0);
  const discount = Math.min(Math.max(0, Number(form.discount) || 0), subtotal);
  const total = Math.max(0, subtotal - discount);
  const paid = Math.min(Math.max(0, Number(form.paid) || 0), total);
  const remaining = Math.max(0, total - paid);
  const money = (value: number) => formatCurrency(value, settings.currency || "ر.ي");

  const update = (key: keyof FormState, value: string) =>
    setForm(current => ({ ...current, [key]: value }));

  const reset = () => {
    setForm(emptyForm());
    setError("");
  };

  const cancelEdit = () => router.push("/invoices");

  const submit = async (printAfter: boolean) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        mode === "edit" ? `/api/invoices/${invoiceId}` : "/api/invoices",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "تعذر حفظ الفاتورة");

      const id = json.data.id;
      if (printAfter) {
        window.open(`/invoices/${id}?print=1`, "_blank", "noopener,noreferrer");
      }

      if (mode === "create") reset();
      else router.push("/invoices");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حفظ الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    settings,
    loading,
    saving,
    error,
    subtotal,
    discount,
    total,
    paid,
    remaining,
    money,
    update,
    reset,
    submit,
    cancelEdit,
  };
}
