export function PageContainer({
    children,
    title,
    description,
    actions
}: {
    children: React.ReactNode;
    title: string;
    description?: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="mx-auto w-full max-w-7xl p-4 pt-20 md:p-8 md:pt-10">
            <header className="mb-7 flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <span
                        className="mt-1 hidden h-9 w-1.5 shrink-0 rounded-full sm:block"
                        style={{ background: "var(--primary)" }}
                        aria-hidden
                    />
                    <div>
                        <h1
                            className="text-2xl font-black tracking-tight"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {title}
                        </h1>
                        {description && (
                            <p
                                className="mt-1.5 text-sm leading-6"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                        {actions}
                    </div>
                )}
            </header>
            {children}
        </div>
    );
}
