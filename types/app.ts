export type Customer = {
  id: string;
  customer_number: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  status?: "ACTIVE" | "ARCHIVED";
};

export type InvoiceStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID" | "CANCELLED";

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_number?: string | null;
  invoice_date: string;
  exam_date?: string | null;
  od_sph?: number | string | null;
  od_cyl?: number | string | null;
  od_axis?: number | string | null;
  od_add?: number | string | null;
  os_sph?: number | string | null;
  os_cyl?: number | string | null;
  os_axis?: number | string | null;
  os_add?: number | string | null;
  pd?: number | string | null;
  near_pd?: number | string | null;
  examiner?: string | null;
  exam_notes?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
  notes?: string | null;
};

export type InvoiceForm = {
  customerName: string;
  customerPhone: string;
  invoiceDate: string;
  examDate: string;
  examiner: string;
  odSph: string;
  odCyl: string;
  odAxis: string;
  odAdd: string;
  osSph: string;
  osCyl: string;
  osAxis: string;
  osAdd: string;
  pd: string;
  nearPd: string;
  price: string;
  discount: string;
  paid: string;
  notes: string;
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
