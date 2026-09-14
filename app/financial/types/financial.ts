export type Period = "daily" | "monthly" | "yearly";
export type FinancialTab = "overview" | "archive";

export type Summary = {
  sales: number;
  collections: number;
  expenses: number;
  oldDebtCollection: number;
  todayPaymentsOnNewInvoices: number;
};

export type TablePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export const EMPTY_PAGINATION: TablePagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};
