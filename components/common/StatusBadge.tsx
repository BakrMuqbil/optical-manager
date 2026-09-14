import type { InvoiceStatus } from "@/types/invoice";

type Props = { status: InvoiceStatus };

export function StatusBadge({ status }: Props) {
  const text =
    status === "PAID"
      ? "مسددة بالكامل"
      : status === "PARTIALLY_PAID"
        ? "مسددة جزئيًا"
        : status === "CANCELLED"
          ? "ملغاة"
          : "عليها مبلغ";

  const style =
    status === "PAID"
      ? { background: "var(--success-soft)", color: "var(--success)" }
      : status === "CANCELLED"
        ? { background: "var(--surface-muted)", color: "var(--text-muted)" }
        : status === "PARTIALLY_PAID"
          ? { background: "var(--warning-soft)", color: "var(--warning)" }
          : { background: "var(--danger-soft)", color: "var(--danger)" };

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
      style={style}
    >
      {text}
    </span>
  );
}
