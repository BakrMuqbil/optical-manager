# Optical Manager — Refactor Report

## Scope
This refactor was applied to the uploaded project as the source of truth. Existing business behavior, SQLite compatibility, Electron data storage, invoice printing, and financial rules were preserved unless explicitly changed below.

## Main changes

### Navigation and screens
- Sidebar now has four main sections: لوحة التحكم, الفواتير, الإدارة المالية, الإعدادات.
- `/invoices` is now the real invoice-history screen.
- The old `app/account-statement/page.tsx` UI was removed.
- `/account-statement` remains backward-compatible through a Next.js redirect to `/invoices`.
- Existing invoice links were updated to `/invoices`.

### Financial management
- The existing daily/monthly/yearly period selector was extracted to `FinancialPeriodSelector`.
- Period range calculations were centralized in `app/financial/utils/period.ts`.
- Period state/navigation was extracted to `useFinancialPeriod`.
- Financial loading/pagination/refresh logic was extracted to `useFinancialData`.
- Invoice filtering/history loading was extracted to `useInvoiceHistory`.
- Invoice history remains available inside the `السجلات` tab of `/financial`.
- Cash closures remain independent from the selected invoice/financial period.
- Outstanding debts remain a current outstanding-debt list rather than being restricted to the selected period.

### Invoice form
- State, loading, settings, calculations, save/print, reset and edit logic were extracted to `app/invoices/hooks/useInvoiceForm.ts`.
- `UnifiedInvoiceForm` keeps its existing visual structure and fields.

### Shared UI and types
- `Pagination` was moved to `components/common/Pagination.tsx` with a compatibility export at the old path.
- Invoice status rendering was extracted to `components/common/StatusBadge.tsx`.
- Domain types were split into `types/customer.ts`, `types/invoice.ts`, `types/financial.ts`, and `types/settings.ts`.
- `types/app.ts` remains as a compatibility barrel for existing imports.

### Database
- `lib/db.ts` is now a compatibility facade.
- Database connection/path handling lives in `lib/db/connection.ts`.
- Schema creation lives in `lib/db/schema.ts`.
- Existing migrations live in `lib/db/migrations.ts`.
- Numbering and normalization helpers live in `lib/db/helpers.ts`.
- Settings access lives in `lib/db/settings.ts`.
- SQLite schema and legacy migration behavior were kept equivalent to the uploaded source.

### Finance core
- `lib/finance.ts` is now a compatibility facade.
- Finance logic was split into summary, transactions, payments, debts, cash closure, and dashboard modules under `lib/finance/`.
- Existing exported function names remain available through the facade.

### Services
- Financial API aggregation/closure operations were extracted to `lib/services/financialService.ts`.
- Invoice list/filter queries were extracted to `lib/services/invoiceService.ts`.
- The corresponding API routes now act as thinner transport layers.

### Customer identity rule
- Phone number is not treated as a unique customer identifier.
- Creating a new invoice creates a new customer record for the entered customer data.
- Editing an invoice updates only its existing `customer_id` record.
- Matching phone numbers never automatically switch, merge, or rename customers.

## Safety preservation
- Electron production data path remains controlled by `ELECTRON_DATA_DIR`.
- `better-sqlite3` remains a server-external package.
- SQLite WAL and foreign keys remain enabled.
- Legacy `exams` compatibility table and invoice migrations remain present.
- Financial transaction/cash-closure APIs remain in their existing locations.
- Windows NSIS and Portable electron-builder targets remain unchanged.
- No database files from the uploaded project were intentionally modified in the final archive.

## Validation performed
- `package.json` JSON validation: passed.
- Local source import/path validation: passed.
- Structural brace validation on source files: passed.
- Uploaded SQLite database was inspected for schema/data integrity during review; the final archive restores the original uploaded database files byte-for-byte.

## Build validation note
A full `npm ci`, `npm run lint`, `npm run build`, and Electron build could not be completed in the execution environment because npm registry access failed with DNS `EAI_AGAIN` errors while fetching dependencies. The final archive therefore does not claim that a fresh dependency install/build was successfully executed here.
