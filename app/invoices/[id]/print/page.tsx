"use client";
import { useEffect, useState } from "react";
import { InvoicePrint } from "@/components/printing/InvoicePrint";
import type { Invoice, Settings } from "@/types/app";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);
  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (a.success) {
          setInvoice(a.data.invoice);
          setSettings(b.data);
        }
      })
      .catch(() => {});
  }, [id]);
  useEffect(() => {
    if (invoice && settings) {
      const t = window.setTimeout(() => window.print(), 350);
      return () => window.clearTimeout(t);
    }
  }, [invoice, settings]);
  if (!invoice || !settings)
    return (
      <div className="p-8 text-center text-slate-400">
        جاري تجهيز الطباعة...
      </div>
    );
  const printCss =
    settings.paper_size === "THERMAL"
      ? "@page{size:80mm auto;margin:0} body{margin:0}"
      : "@page{size:A4;margin:0} body{margin:0}";
  return (
    <main className="min-h-screen bg-white flex justify-center items-start pt-6">
      <style>{printCss}</style>
      <InvoicePrint invoice={invoice} settings={settings} />
    </main>
  );
}
