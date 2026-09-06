# CHANGELOG — النظام المالي

## Added
- `financial_transactions` table (PAYMENT, EXPENSE)
- `cash_closures` table (OPEN, CLOSED)
- Debt settlement API (`POST /api/payments`)
- Expenses API (`POST /api/expenses`)
- Cash closing with expected/actual/difference
- Daily financial summary API (`GET /api/financial`)
- Customer statement API (`GET /api/customer-statement`)
- Closure print report page (`/financial/closure/print`)
- Backup/Restore v4 includes financial data
- Automatic migration of legacy `invoice.paid` to `financial_transactions`

## Changed
- Invoice payment flow: first payment creates `financial_transaction`
- Invoice balance calculation: derived from `financial_transactions` via `recalculateInvoiceBalance()`
- Invoice edit: `paid` field is read-only (display only)
- Sidebar label: "الإدارة المالية" replaces "كشف الحساب"
- Backup version bumped to 4
- `PUT /api/invoices/[id]` validates day is not closed before editing
- `POST /api/invoices/[id]/cancel` validates day is not closed

## Not Added
- Refund system (reverse payment)
- Multiple payment methods (cash/card/transfer)
- Prisma ORM (still using better-sqlite3 directly)
- SaaS / multi-user support
- API authentication / authorization
