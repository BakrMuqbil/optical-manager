"use client";

import type { ElementType, ReactNode } from "react";

interface SummaryItem {
    label: string;
    value: string;
    icon?: ElementType;
    tone?: "primary" | "success" | "danger" | "warning" | "info";
}

interface SummaryCardProps {
    title?: string;
    description?: string;
    items: SummaryItem[];
    columns?: 1 | 2 | 3 | 4;
    icon?: ElementType;
    children?: ReactNode;
}

const toneColors = {
    primary: "var(--primary)",
    success: "var(--success)",
    danger: "var(--danger)",
    warning: "var(--warning)",
    info: "var(--info)"
};

const toneBackgrounds = {
    primary: "var(--primary-soft)",
    success: "var(--success-soft)",
    danger: "var(--danger-soft)",
    warning: "var(--warning-soft)",
    info: "var(--info-soft)"
};

export function SummaryCard({
    title,
    description,
    items,
    columns = 2,
    icon: HeaderIcon,
    children
}: SummaryCardProps) {
    const gridColumns =
        columns === 1
            ? "grid-cols-1"
            : columns === 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : columns === 4
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2";

    return (
        <section
            className="overflow-hidden rounded-2xl border"
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)"
            }}
        >
            {(title || description || HeaderIcon) && (
                <header
                    className="flex items-center gap-3 border-b px-5 py-4"
                    style={{ borderColor: "var(--border)" }}
                >
                    {HeaderIcon && (
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: "var(--primary-soft)",
                                color: "var(--primary)"
                            }}
                        >
                            <HeaderIcon size={19} strokeWidth={2.3} />
                        </div>
                    )}

                    <div>
                        {title && (
                            <h3
                                className="text-base font-black"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {title}
                            </h3>
                        )}

                        {description && (
                            <p
                                className="mt-0.5 text-xs font-medium"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {description}
                            </p>
                        )}
                    </div>
                </header>
            )}

            <div className={`grid ${gridColumns}`}>
                {items.map((item, index) => {
                    const tone = item.tone ?? "primary";
                    const ItemIcon = item.icon;

                    return (
                        <div
                            key={`${item.label}-${index}`}
                            className="group relative p-5"
                            style={{
                                borderColor: "var(--border)"
                            }}
                        >
                            {index > 0 && (
                                <div
                                    className="absolute inset-y-5 start-0 hidden w-px sm:block"
                                    style={{
                                        background: "var(--border)"
                                    }}
                                />
                            )}

                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div
                                        className="text-xs font-bold"
                                        style={{
                                            color: "var(--text-muted)"
                                        }}
                                    >
                                        {item.label}
                                    </div>

                                    <div
                                        className="mt-2 text-xl font-black tracking-tight"
                                        style={{
                                            color: toneColors[tone]
                                        }}
                                    >
                                        {item.value}
                                    </div>
                                </div>

                                {ItemIcon && (
                                    <div
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{
                                            background:
                                                toneBackgrounds[tone],
                                            color: toneColors[tone]
                                        }}
                                    >
                                        <ItemIcon size={17} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {children}
        </section>
    );
}