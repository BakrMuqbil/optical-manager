export type TransactionType = "PAYMENT" | "EXPENSE";
export type TransactionStatus = "ACTIVE" | "VOID";

export type FinancialTransaction = {
  id: string;
  transaction_number: string;
  transaction_date: string;
  created_at: string;
  type: TransactionType;
  amount: number;
  invoice_id?: string | null;
  customer_id?: string | null;
  description?: string | null;
  notes?: string | null;
  status: TransactionStatus;
  invoice_number?: string | null;
  customer_name?: string | null;
};

export type CashClosure = {
  id: string;
  business_date: string;
  opened_at: string;
  closed_at?: string | null;
  opening_balance: number;
  total_sales: number;
  total_collections: number;
  total_expenses: number;
  expected_cash: number;
  actual_cash?: number | null;
  difference: number;
  status: "OPEN" | "CLOSED";
};
