export const PAYMENT_METHODS = ["Cash", "Transfer", "POS", "Other"] as const;

export type SaleItemInput = {
  inventory_id: string;
  quantity: number;
  unit_price: number;
};

export type Sale = {
  id: string;
  customer_id: string | null;
  sale_date: string;
  payment_method: string | null;
  subtotal: number | null;
  discount: number;
  total: number | null;
  staff_name: string | null;
  notes: string | null;
  customers?: { full_name: string } | { full_name: string }[] | null;
  sale_items?: SaleItem[];
};

export type SaleItem = {
  id: string;
  sale_id: string;
  inventory_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  inventory?: { item_name: string } | { item_name: string }[] | null;
};
