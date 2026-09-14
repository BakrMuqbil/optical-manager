"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    FileText,
    Wallet,
    BarChart3,
    Settings
} from "lucide-react";

const links = [
    {
        href: "/",
        label: "لوحة التحكم",
        icon: Home
    },
    {
        href: "/invoices",
        label: "الفواتير",
        icon: FileText
    },
    {
        href: "/financial",
        label: "الإدارة المالية",
        icon: Wallet
    },
    {
        href: "/reports",
        label: "التقارير",
        icon: BarChart3
    },
    {
        href: "/settings",
        label: "الإعدادات",
        icon: Settings
    }
];

export function TopNavigation() {
    const pathname = usePathname();

    return (
        <nav
    className="top-navigation no-print fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4"
    aria-label="التنقل الرئيسي"
>
            <div
                className="flex items-center gap-1 rounded-2xl border p-1.5 shadow-lg backdrop-blur-xl sm:gap-1.5 sm:p-2"
                style={{
                    background: "color-mix(in srgb, var(--surface) 92%, transparent)",
                    borderColor: "var(--border)"
                }}
            >
                {links.map(({ href, label, icon: Icon }) => {
                    const active =
                        href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-label={label}
                            aria-current={active ? "page" : undefined}
                            className={[
                                "group flex h-10 items-center justify-center overflow-hidden rounded-xl",
                                "text-sm font-bold",
                                "transition-all duration-200 ease-out",
                                "focus-visible:outline-none focus-visible:ring-2",
                                "sm:h-11",
                                active
                                    ? "gap-2 px-3.5 sm:px-4"
                                    : "w-10 px-0 sm:w-11"
                            ].join(" ")}
                            style={
                                active
                                    ? {
                                          background: "var(--primary)",
                                          color: "var(--text-on-primary)",
                                          boxShadow:
                                              "0 4px 14px color-mix(in srgb, var(--primary) 28%, transparent)"
                                      }
                                    : {
                                          color: "var(--text-secondary)"
                                      }
                            }
                        >
                            <Icon
                                size={19}
                                strokeWidth={active ? 2.5 : 2}
                                className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                            />

                            <span
                                className={[
                                    "whitespace-nowrap overflow-hidden",
                                    "transition-all duration-200 ease-out",
                                    active
                                        ? "max-w-[120px] opacity-100"
                                        : "max-w-0 opacity-0"
                                ].join(" ")}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}