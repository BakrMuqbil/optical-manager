"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  Settings,
  Menu,
  X,
  PlusCircle,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "لوحة التحكم", icon: Home },
  { href: "/invoices/new", label: "فاتورة", icon: PlusCircle },
  { href: "/account-statement", label: "كشف الحساب", icon: ClipboardList },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed right-4 top-4 z-40 rounded-xl bg-slate-900 p-3 text-white md:hidden"
        aria-label="فتح القائمة"
      >
        <Menu size={20} />
      </button>
      {open && (
        <div
          className="no-print fixed inset-0 z-40 bg-slate-900/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`no-print fixed inset-y-0 right-0 z-50 w-64 border-l border-slate-200 bg-white transition-transform md:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <div className="text-lg font-black text-slate-900">
                👓 Optical Manager
              </div>
              <div className="mt-1 text-xs text-slate-500">
                إدارة محل البصريات
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  <Icon size={19} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-100 p-4 text-xs text-slate-400">
            نسخة محلية • مستخدم واحد
          </div>
        </div>
      </aside>
    </>
  );
}
