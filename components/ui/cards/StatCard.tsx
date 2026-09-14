
import type { ElementType, ReactNode } from "react";

type StatCardTone =
    | "primary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "neutral";

interface StatCardProps {
    label: string;
    value: string;
    icon?: ElementType;
    tone?: StatCardTone;
    description?: string;
    trend?: string;
    trendUp?: boolean;
    children?: ReactNode;
}

const toneStyles: Record<
    StatCardTone,
    {
        iconBackground: string;
        iconColor: string;
        valueColor: string;
        accent: string;
    }
> = {
    primary: {
        iconBackground: "var(--primary-soft)",
        iconColor: "var(--primary)",
        valueColor: "var(--primary)",
        accent: "var(--primary)"
    },
    success: {
        iconBackground: "var(--success-soft)",
        iconColor: "var(--success)",
        valueColor: "var(--success)",
        accent: "var(--success)"
    },
    danger: {
        iconBackground: "var(--danger-soft)",
        iconColor: "var(--danger)",
        valueColor: "var(--danger)",
        accent: "var(--danger)"
    },
    warning: {
        iconBackground: "var(--warning-soft)",
        iconColor: "var(--warning)",
        valueColor: "var(--warning)",
        accent: "var(--warning)"
    },
    info: {
        iconBackground: "var(--info-soft)",
        iconColor: "var(--info)",
        valueColor: "var(--info)",
        accent: "var(--info)"
    },
    neutral: {
        iconBackground: "var(--surface-muted)",
        iconColor: "var(--text-secondary)",
        valueColor: "var(--text-primary)",
        accent: "var(--border-strong)"
    }
};

export function StatCard({
    label,
    value,
    icon: Icon,
    tone = "neutral",
    description,
    trend,
    trendUp,
    children
}: StatCardProps) {
    const styles = toneStyles[tone];

    return (
        <article
            className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)"
            }}
        >
            <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: styles.accent }}
            />

            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div
                        className="text-sm font-bold"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {label}
                    </div>

                    <div
                        className="mt-3 truncate text-2xl font-black tracking-tight"
                        style={{ color: styles.valueColor }}
                    >
                        {value}
                    </div>

                    {description && (
                        <div
                            className="mt-2 text-xs font-medium"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {description}
                        </div>
                    )}

                    {trend && (
                        <div
                            className="mt-3 inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold"
                            style={{
                                background: trendUp
                                    ? "var(--success-soft)"
                                    : "var(--danger-soft)",
                                color: trendUp
                                    ? "var(--success)"
                                    : "var(--danger)"
                            }}
                        >
                            {trend}
                        </div>
                    )}
                </div>

                {Icon && (
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                        style={{
                            background: styles.iconBackground,
                            color: styles.iconColor
                        }}
                    >
                        <Icon size={21} strokeWidth={2.3} />
                    </div>
                )}
            </div>

            {children}
        </article>
    );
}