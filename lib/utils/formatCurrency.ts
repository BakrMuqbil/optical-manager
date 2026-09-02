export function formatCurrency(value: number, currency = "ر.ي") {
  return `${new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 2 }).format(value || 0)} ${currency}`;
}
