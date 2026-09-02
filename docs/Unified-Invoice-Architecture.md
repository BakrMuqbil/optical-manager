# Optical Manager — Unified Invoice Architecture

## Business model

The application now has one primary business record: **فاتورة**.

A saved invoice contains:
- customer name and mobile number
- invoice date
- eye measurement data
- price, discount, paid and remaining amounts
- notes
- one invoice number

There is no separate UI or numbering system for an eye exam.

## Main screens

1. **لوحة التحكم** — invoice count, total due/billed, total paid and total remaining, plus recent invoices.
2. **فاتورة** — one fast-entry form with three sections: customer, measurements, accounting.
3. **كشف الحساب** — daily/monthly/yearly statement with search, payment-status filtering, totals, edit, print and delete actions.
4. **الإعدادات** — shop data, currency, print size and backup/restore.

## Data compatibility

The SQLite database stores measurement fields directly on `invoices`. The old `exams` table is retained only as a legacy compatibility layer for existing installations/backups. New invoices never create a separate exam record and never generate an exam number.

Legacy invoice rows linked to an old exam are migrated into the invoice fields automatically when the database starts.

## Printing

`InvoicePrint` prints a combined document containing customer data, one invoice number, measurements and financial summary. Currency and paper size are read from current settings each time the invoice is opened for printing.
