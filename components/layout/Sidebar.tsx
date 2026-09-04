"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    ClipboardList,
    Settings,
    Menu,
    X,
    PlusCircle
} from "lucide-react";
import { useState } from "react";

const links = [
    { href: "/", label: "لوحة التحكم", icon: Home },
    { href: "/invoices/new", label: "فاتورة", icon: PlusCircle },
    { href: "/account-statement", label: "كشف الحساب", icon: ClipboardList },
    { href: "/settings", label: "الإعدادات", icon: Settings }
];

export function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    return (
        <>
            {/* Mobile trigger */}
            <button
                onClick={() => setOpen(true)}
                className="no-print fixed right-4 top-4 z-40 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-md md:hidden"
                style={{
                    background: "var(--primary)",
                    color: "var(--text-on-primary)"
                }}
                aria-label="فتح القائمة"
            >
                <Menu size={19} />
                القائمة
            </button>

            {/* Mobile overlay */}
            {open && (
                <div
                    className="no-print fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`no-print fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l transition-transform md:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)"
                }}
            >
                {/* Brand */}
                <div
                    className="flex items-center justify-between gap-3 border-b p-5"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div className="flex items-center gap-3">
                        <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm"
                            style={{
                                background: "var(--primary)",
                                color: "var(--text-on-primary)"
                            }}
                            aria-hidden
                        >
                            👓
                        </span>
                        <div className="min-w-0">
                            <div
                                className="truncate text-base font-black"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Optical Manager
                            </div>
                            <div
                                className="mt-0.5 truncate text-xs font-semibold"
                                style={{ color: "var(--text-muted)" }}
                            >
                                إدارة محل البصريات
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="rounded-lg p-2 md:hidden"
                        style={{ color: "var(--text-secondary)" }}
                        aria-label="إغلاق القائمة"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
                    <div
                        className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                    >
                        القائمة الرئيسية
                    </div>
                    {links.map(({ href, label, icon: Icon }) => {
                        const active =
                            href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setOpen(false)}
                                className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors"
                                style={
                                    active
                                        ? {
                                              background: "var(--primary)",
                                              color: "var(--text-on-primary)"
                                          }
                                        : { color: "var(--text-secondary)" }
                                }
                                onMouseEnter={e => {
                                    if (!active)
                                        e.currentTarget.style.background =
                                            "var(--surface-muted)";
                                }}
                                onMouseLeave={e => {
                                    if (!active)
                                        e.currentTarget.style.background =
                                            "transparent";
                                }}
                            >
                                {active && (
                                    <span
                                        className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full"
                                        style={{
                                            background: "var(--text-on-primary)"
                                        }}
                                        aria-hidden
                                    />
                                )}
                                <Icon
                                    size={19}
                                    strokeWidth={active ? 2.4 : 2}
                                />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div
                    className="border-t p-4 text-xs font-semibold"
                    style={{
                        borderColor: "var(--border)",
                        color: "var(--text-muted)"
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: "var(--success)" }}
                            aria-hidden
                        />
                        نسخة محلية • مستخدم واحد
                    </div>
                </div>
            </aside>
        </>
    );
}
