import { supabase } from "@/lib/supabase";
import type { RepairFinancialSummary, RepairPayment } from "@/types/repairPayment";

export const repairPaymentService = {
  async getPayments(repairId: string) {
    return await supabase
      .from("repair_payments")
      .select("*")
      .eq("repair_id", repairId)
      .order("payment_date", { ascending: false })
      .returns<RepairPayment[]>();
  },

  async getSummary(repairId: string) {
    return await supabase
      .rpc("get_repair_financial_summary", { p_repair_id: repairId })
      .returns<RepairFinancialSummary[]>();
  },

  async recordPayment(
    repairId: string,
    amount: number,
    paymentMethod: string,
    paymentDate?: string,
    notes?: string
  ) {
    return await supabase.rpc("record_repair_payment", {
      p_repair_id: repairId,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_payment_date: paymentDate || new Date().toISOString(),
      p_notes: notes?.trim() || null,
      p_idempotency_key: crypto.randomUUID(),
    });
  },
};
