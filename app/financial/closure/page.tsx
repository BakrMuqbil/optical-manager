import { Suspense } from "react";
import ClosurePageContent from "./ClosurePageContent";

export default function ClosurePage() {
  return (
    <Suspense
      fallback={
        <div className="surface-card mx-auto max-w-xl p-10 text-center">
          جاري تحميل تقرير إغلاق الصندوق...
        </div>
      }
    >
      <ClosurePageContent />
    </Suspense>
  );
}
