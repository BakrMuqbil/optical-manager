"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Settings } from "@/types/settings";
import { FinancialPeriodSelector } from "../financial/components/FinancialPeriodSelector";
import { InvoiceHistory } from "../financial/components/InvoiceHistory";
import { useFinancialPeriod } from "../financial/hooks/useFinancialPeriod";

export default function InvoicesPage() {
  const period = useFinancialPeriod();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/settings", { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        if (active && data.success) setSettings(data.data as Settings);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageContainer
      title="الفواتير"
      description="سجل الفواتير مع البحث والفلترة والعرض والطباعة"
      actions={
        <Link href="/invoices/new" className="btn-primary">
          <Plus size={17} />
          فاتورة جديدة
        </Link>
      }
    >
      <div className="space-y-5">
        <FinancialPeriodSelector
          period={period.period}
          label={period.label}
          onPeriodChange={period.changePeriod}
          onPrevious={period.previous}
          onNext={period.next}
          onToday={period.today}
        />
        <InvoiceHistory period={period.period} cursor={period.cursor} settings={settings} />
      </div>
    </PageContainer>
  );
}
