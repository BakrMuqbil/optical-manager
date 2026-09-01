export function PageContainer({ children, title, description, actions }: { children: React.ReactNode; title: string; description?: string; actions?: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl p-4 pt-20 md:p-8">
    <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>
      {actions}
    </header>{children}
  </div>
}
