import { supabase } from "@/lib/supabase";
import type { ShopExpense, ShopExpenseCategory, ShopExpensePaymentMethod } from "@/types/shopOperations";

export const shopOperationsService = {
  async recordExpense(input: {
    businessDate: string;
    category: ShopExpenseCategory;
    amount: number;
    paymentMethod: ShopExpensePaymentMethod;
    description: string;
  }) {
    const result = await supabase.rpc("record_shop_expense", {
      p_business_date: input.businessDate,
      p_category: input.category,
      p_amount: input.amount,
      p_payment_method: input.paymentMethod,
      p_description: input.description.trim(),
    });
    return { data: (Array.isArray(result.data) ? result.data[0] : result.data) as ShopExpense | null, error: result.error };
  },

  async getExpenses(businessDate: string) {
    const result = await supabase
      .from("shop_expenses")
      .select("id,company_id,branch_id,business_date,category,amount,payment_method,description,financial_transaction_id,recorded_by,created_at")
      .eq("business_date", businessDate)
      .order("created_at", { ascending: false });
    return { data: (result.data ?? []) as ShopExpense[], error: result.error };
  },
};
