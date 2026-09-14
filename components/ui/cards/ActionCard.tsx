"use client";

import Link from "next/link";
import type { ElementType, ReactNode } from "react";

type ActionCardTone =
    | "primary"
    | "neutral"
    | "success"
    | "warning"
    | "danger";

interface ActionCardProps {
    href: string;
    title: string;
    description?: string;
    icon: ElementType;
    arrowIcon?: ElementType;
    tone?: ActionCardTone;
    children?: ReactNode;
}

const toneStyles: Record<
    ActionCardTone,
    {
        background: string;
        border: string;
        iconBackground: string;
        iconColor: string;
        titleColor: string;
        arrowColor: string;
    }
> = {
    primary: {
        background: "var(--primary)",
        border: "var(--primary)",
        iconBackground: "rgba(255,255,255,0.16)",
        iconColor: "var(--text-on-primary)",
        titleColor: "var(--text-on-primary)",
        arrowColor: "var(--text-on-primary)"
    },
    neutral: {
        background: "var(--surface)",
        border: "var(--border)",
        iconBackground: "var(--primary-soft)",
        iconColor: "var(--primary)",
        titleColor: "var(--text-primary)",
        arrowColor: "var(--text-secondary)"
    },
    success: {
        background: "var(--surface)",
        border: "var(--border)",
        iconBackground: "var(--success-soft)",
        iconColor: "var(--success)",
        titleColor: "var(--text-primary)",
        arrowColor: "var(--success)"
    },
    warning: {
        background: "var(--surface)",
        border: "var(--border)",
        iconBackground: "var(--warning-soft)",
        iconColor: "var(--warning)",
        titleColor: "var(--text-primary)",
        arrowColor: "var(--warning)"
    },
    danger: {
        background: "var(--surface)",
        border: "var(--border)",
        iconBackground: "var(--danger-soft)",
        iconColor: "var(--danger)",
        titleColor: "var(--text-primary)",
        arrowColor: "var(--danger)"
    }
};

export function ActionCard({
    href,
    title,
    description,
    icon: Icon,
    arrowIcon: ArrowIcon,
    tone = "neutral",
    children
}: ActionCardProps) {
    const styles = toneStyles[tone];

    return (
        <Link
            href={href}
            className="group block rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            style={{
                background: styles.background,
                borderColor: styles.border,
                boxShadow: "var(--shadow-sm)"
            }}
        >
            <div className="flex items-center gap-4">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{
                        background: styles.iconBackground,
                        color: styles.iconColor
                    }}
                >
                    <Icon size={22} strokeWidth={2.3} />
                </div>

                <div className="min-w-0 flex-1">
                    <div
                        className="text-base font-black"
                        style={{ color: styles.titleColor }}
                    >
                        {title}
                    </div>

                    {description && (
                        <div
                            className="mt-1 text-sm font-medium"
                            style={{
                                color:
                                    tone === "primary"
                                        ? "rgba(255,255,255,0.78)"
                                        : "var(--text-muted)"
                            }}
                        >
                            {description}
                        </div>
                    )}
                </div>

                {ArrowIcon && (
                    <ArrowIcon
                        size={20}
                        className="shrink-0 transition-transform duration-200 group-hover:-translate-x-1"
                        style={{ color: styles.arrowColor }}
                    />
                )}
            </div>

            {children}
        </Link>
    );
}