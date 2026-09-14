export type Customer = {
  id: string;
  customer_number: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  status?: "ACTIVE" | "ARCHIVED";
};
