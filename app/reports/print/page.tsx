import { getSettings } from "@/lib/db";
import {
    getOpeningBalance,
    getPeriodClosure,
    getReportData,
    periodFromKey
} from "@/lib/reports";
import { todayISO } from "@/lib/utils/formatDate";
import PrintReady from "./print-ready";
export const dynamic = "force-dynamic";
export default async function PrintPage({
    searchParams
}: {
    searchParams: Promise<{ type?: string; key?: string }>;
}) {
    const q = await searchParams;
    const type = q.type === "YEAR" ? "YEAR" : "MONTH";
    const key = q.key ?? todayISO().slice(0, 7);
    const period = periodFromKey(type, key);
    const closure = getPeriodClosure(type, key);
    const opening =
        closure?.opening_balance != null
            ? Number(closure.opening_balance)
            : getOpeningBalance(type, key);
    const report = getReportData(period, opening);
    const settings = getSettings() as
        | { currency?: string; shop_name?: string }
        | undefined;
    return (
        <PrintReady
            type={type}
            keyValue={key}
            period={period}
            report={report}
            closure={closure}
            currency={settings?.currency || "ر.ي"}
            shopName={settings?.shop_name || "محل البصريات"}
        />
    );
}
