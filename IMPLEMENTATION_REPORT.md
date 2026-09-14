# تقرير التنفيذ — النظام المالي

## ما تم فحصه
- بنية المشروع: Next.js 16 + Electron 44 + better-sqlite3
- APIs الحالية: invoices, settings, backup
- نظام الطباعة الحرارية/A4
- Electron build (Windows NSIS + Portable)

## ما تم تغييره

### Database
- إضافة `financial_transactions` (PAYMENT, EXPENSE)
- إضافة `cash_closures` (OPEN, CLOSED)
- Migration تلقائي لترحيل `invoice.paid` القديم إلى `financial_transactions`
- `nextTransactionNumber()` للأرقام التسلسلية TX-00001

### APIs
- `POST /api/invoices` — يسجل الدفعة الأولى كـ transaction
- `PUT /api/invoices/[id]` — يمنع تعديل paid، يتحقق من اليوم المغلق
- `POST /api/invoices/[id]/cancel` — يتحقق من اليوم المغلق
- `POST /api/payments` — تسجيل دفعة جديدة atomic مع recalculateInvoiceBalance
- `POST /api/expenses` — تسجيل مصروف
- `GET/POST /api/cash-closure` — إغلاق الصندوق
- `GET /api/financial` — الملخص والحركات والديون
- `GET /api/customer-statement` — كشف حساب
- `GET/POST /api/backup` — يشمل الجداول الجديدة (version 4)

### UI
- Sidebar: "الإدارة المالية" بدلاً من "الفواتير"
- صفحة `/financial` — ملخص + حركات + ديون + دفعات
- صفحة `/financial/closure` — إغلاق الصندوق
- صفحة `/financial/closure/print` — طباعة التقرير
- صفحة `/customer-statement` — كشف حساب العميل
- تعديل الفاتورة: حقل المدفوع يصبح للعرض فقط في وضع التعديل

## القواعد المالية
- paid = SUM(PAYMENT transactions)
- remaining = total - paid
- لا يمكن تعديل/حذف/إلغاء فاتورة يوم مغلق
- لا يمكن تسجيل حركة في يوم مغلق
- يسمح بدفع فاتورة قديمة في يوم جديد
- الحركات غير قابلة للحذف (IMMUTABLE)


## Refactor النهائي
- دمج سجل الفواتير داخل `/financial` مع تبويب `السجلات`، وإضافة `/invoices` كواجهة قائمة الفواتير الرئيسية.
- إزالة واجهة `app/account-statement` وتوفير تحويل توافق قديم من `/account-statement` إلى `/invoices`.
- Sidebar أصبح أربع وجهات: لوحة التحكم، الفواتير، الإدارة المالية، الإعدادات.
- استخراج اختيار الفترة إلى `app/financial/components/FinancialPeriodSelector.tsx`.
- استخراج منطق الفترة إلى `app/financial/utils/period.ts` و`useFinancialPeriod`.
- استخراج تحميل الإدارة المالية إلى `useFinancialData`.
- استخراج تحميل/فلترة سجل الفواتير إلى `useInvoiceHistory`.
- استخراج `StatusBadge` و`Pagination` إلى `components/common`.
- تقسيم أنواع التطبيق إلى ملفات نطاقية مع إبقاء `types/app.ts` كواجهة توافق.
- تقسيم `lib/finance.ts` إلى نطاقات مستقلة مع إبقاء `lib/finance.ts` كواجهة توافق.
- تقسيم طبقة قاعدة البيانات إلى connection/schema/migrations/helpers/settings مع إبقاء `lib/db.ts` كواجهة توافق.
- استخراج خدمات مالية وفواتير في `lib/services`.
- نقل منطق نموذج الفاتورة إلى `app/invoices/hooks/useInvoiceForm.ts` مع إبقاء واجهة النموذج الحالية.
- الحفاظ على مسار بيانات Electron ومخطط SQLite وعمليات الترحيل القديمة.
