export type Settings = {
  shop_name: string;
  phone: string;
  address: string;
  currency: string;
  invoice_footer: string;
  paper_size: "A4" | "THERMAL";
  logo?: string | null;
};
