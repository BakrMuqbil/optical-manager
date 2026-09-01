export type Customer = {
  id: string;
  customer_number: string;
  name: string;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: "ACTIVE" | "ARCHIVED";
};

export type Exam = {
  id: string;
  exam_number: string;
  customer_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_number?: string | null;
  exam_date: string;
  od_sph?: number | string | null;
  od_cyl?: number | string | null;
  od_axis?: number | string | null;
  od_add?: number | string | null;
  od_prism?: number | string | null;
  od_base?: string | null;
  os_sph?: number | string | null;
  os_cyl?: number | string | null;
  os_axis?: number | string | null;
  os_add?: number | string | null;
  os_prism?: number | string | null;
  os_base?: string | null;
  pd?: number | string | null;
  near_pd?: number | string | null;
  examiner?: string | null;
  notes?: string | null;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  exam_id?: string | null;
  exam_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_number?: string | null;
  invoice_date: string;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  status: "PAID" | "PARTIALLY_PAID" | "UNPAID" | "CANCELLED";
  notes?: string | null;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type CustomerProfile = {
  customer: Customer;
  exams: Exam[];
  invoices: Invoice[];
};

export type InvoiceFormItem = {
  description: string;
  quantity: number | string;
  unitPrice: number | string;
};

export type InvoiceForm = {
  customerId: string;
  examId: string;
  invoiceDate: string;
  discount: string;
  paid: string;
  notes: string;
  items: InvoiceFormItem[];
};

export type Settings = {
  shop_name: string;
  phone: string;
  address: string;
  currency: string;
  invoice_footer: string;
  paper_size: "A4" | "THERMAL";
  logo?: string | null;
};
