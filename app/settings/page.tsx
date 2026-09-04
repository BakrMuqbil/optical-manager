"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Download,
    Save,
    ShieldAlert,
    Store,
    Upload
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Settings } from "@/types/app";

export default function Page() {
    const [form, setForm] = useState<Settings>({
            shop_name: "محل البصريات",
            phone: "",
            address: "",
            currency: "ر.ي",
            invoice_footer: "شكرًا لزيارتكم",
            paper_size: "A4"
        }),
        [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/settings")
            .then(r => r.json())
            .then(j => {
                if (j.data) {
                    setForm(j.data);
                }
            });
    }, []);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();

        await fetch("/api/settings", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                shopName: form.shop_name,
                phone: form.phone,
                address: form.address,
                logo: form.logo,
                currency: form.currency,
                invoiceFooter: form.invoice_footer,
                paperSize: form.paper_size
            })
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <PageContainer
            title="الإعدادات"
            description="بيانات المحل وإعدادات الطباعة والنسخ الاحتياطي"
        >
            <div className="grid gap-6 lg:grid-cols-2">
                {/* بيانات المحل */}
                <form
                    onSubmit={save}
                    className="rounded-2xl border p-6 shadow-sm"
                    style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)"
                    }}
                >
                    <div className="mb-6 flex items-center gap-3">
                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: "var(--primary-soft)",
                                color: "var(--primary)"
                            }}
                        >
                            <Store size={19} />
                        </span>
                        <div>
                            <h2
                                className="text-lg font-black"
                                style={{ color: "var(--text-primary)" }}
                            >
                                بيانات المحل
                            </h2>
                            <p
                                className="mt-0.5 text-sm"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                هذه البيانات تظهر في الفواتير المطبوعة.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label>
                            <span className="label">اسم المحل</span>

                            <input
                                className="input"
                                value={form.shop_name || ""}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        shop_name: e.target.value
                                    })
                                }
                            />
                        </label>

                        <label>
                            <span className="label">رقم الهاتف</span>

                            <input
                                className="input"
                                dir="ltr"
                                value={form.phone || ""}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        phone: e.target.value
                                    })
                                }
                            />
                        </label>

                        <label>
                            <span className="label">العنوان</span>

                            <input
                                className="input"
                                value={form.address || ""}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        address: e.target.value
                                    })
                                }
                            />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label>
                                <span className="label">العملة</span>

                                <input
                                    className="input"
                                    value={form.currency || ""}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            currency: e.target.value
                                        })
                                    }
                                />
                            </label>

                            <label>
                                <span className="label">مقاس الطباعة</span>

                                <select
                                    className="input"
                                    value={form.paper_size || "A4"}
                                    onChange={e => {
                                        const paperSize =
                                            e.target.value === "THERMAL"
                                                ? "THERMAL"
                                                : "A4";

                                        setForm({
                                            ...form,
                                            paper_size: paperSize
                                        });
                                    }}
                                >
                                    <option value="A4">A4</option>
                                    <option value="THERMAL">حرارية</option>
                                </select>
                            </label>
                        </div>

                        <label>
                            <span className="label">أسفل الفاتورة</span>

                            <input
                                className="input"
                                value={form.invoice_footer || ""}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        invoice_footer: e.target.value
                                    })
                                }
                            />
                        </label>
                    </div>

                    <button className="btn-primary mt-6 w-full sm:w-auto">
                        {saved ? (
                            <CheckCircle2 size={17} />
                        ) : (
                            <Save size={17} />
                        )}
                        {saved ? "تم الحفظ" : "حفظ الإعدادات"}
                    </button>
                </form>

                {/* النسخ الاحتياطي */}
                <div
                    className="rounded-2xl border p-6 shadow-sm"
                    style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)"
                    }}
                >
                    <div className="mb-6 flex items-center gap-3">
                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: "var(--info-soft)",
                                color: "var(--info)"
                            }}
                        >
                            <ShieldAlert size={19} />
                        </span>
                        <div>
                            <h2
                                className="text-lg font-black"
                                style={{ color: "var(--text-primary)" }}
                            >
                                النسخ الاحتياطي
                            </h2>
                            <p
                                className="mt-0.5 text-sm leading-6"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                احفظ نسخة JSON من العملاء والفواتير والإعدادات
                                في مكان آمن.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a href="/api/backup" className="btn-secondary">
                            <Download size={17} />
                            تحميل نسخة احتياطية
                        </a>

                        <label className="btn-secondary cursor-pointer">
                            <Upload size={17} />
                            استعادة نسخة
                            <input
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={async e => {
                                    const file = e.target.files?.[0];

                                    if (
                                        !file ||
                                        !confirm(
                                            "سيتم استبدال البيانات الحالية ببيانات النسخة. هل تريد المتابعة؟"
                                        )
                                    ) {
                                        return;
                                    }

                                    const r = await fetch("/api/backup", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json"
                                        },
                                        body: await file.text()
                                    });

                                    const j = await r.json();

                                    alert(
                                        j.success
                                            ? "تمت استعادة النسخة بنجاح"
                                            : "فشلت الاستعادة: " + j.error
                                    );

                                    if (j.success) {
                                        location.reload();
                                    }
                                }}
                            />
                        </label>
                    </div>

                    <div
                        className="mt-6 rounded-xl border p-4 text-sm leading-6"
                        style={{
                            borderColor:
                                "color-mix(in srgb, var(--warning) 25%, transparent)",
                            background: "var(--warning-soft)",
                            color: "var(--warning)"
                        }}
                    >
                        <strong className="font-black">مهم: </strong>
                        لا تعتمد على جهاز واحد فقط. احتفظ بنسخة احتياطية خارج
                        الجهاز بشكل دوري.
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
