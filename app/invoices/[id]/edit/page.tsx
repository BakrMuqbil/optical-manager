import { UnifiedInvoiceForm } from "@/components/invoices/UnifiedInvoiceForm";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UnifiedInvoiceForm mode="edit" invoiceId={id} />;
}
