export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ar-YE', { dateStyle: 'medium' }).format(new Date(value))
}
export function todayISO() { return new Date().toISOString().slice(0, 10) }
