import { PageContainer } from "@/components/layout/PageContainer";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function Page() {
  return (
    <PageContainer
      title="إضافة عميل جديد"
      description="أنشئ ملفًا رقميًا للعميل للوصول إليه لاحقًا بسهولة"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <CustomerForm />
      </div>
    </PageContainer>
  );
}
