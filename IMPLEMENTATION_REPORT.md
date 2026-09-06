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
- Sidebar: "الإدارة المالية" بدلاً من "كشف الحساب"
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
