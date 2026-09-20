export type ShopExpenseCategory = "transportation" | "water" | "other";
export type ShopExpensePaymentMethod = "cash" | "transfer" | "pos" | "card" | "other";

export type ShopExpense = {
  id: string;
  company_id: string;
  branch_id: string | null;
  business_date: string;
  category: ShopExpenseCategory;
  amount: number;
  payment_method: ShopExpensePaymentMethod;
  description: string;
  financial_transaction_id: string | null;
  recorded_by: string;
  created_at: string;
};
