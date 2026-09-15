import { supabase } from "@/lib/supabase";
import type { DailyProfit, FinancialSummary, FinancialTransactionInput, ProfitSummary } from "@/types/finance";

export const financeService = {
  async getTransactions() {
    return await supabase.from("financial_transactions").select("*").order("occurred_at", { ascending: false });
  },

  async getSummary(start: string, end: string) {
    return await supabase.rpc("get_financial_summary", { p_start: start, p_end: end }).returns<FinancialSummary[]>();
  },

  async getProfitSummary(start: string, end: string) {
    return await supabase.rpc("get_profit_summary", { p_start: start, p_end: end }).returns<ProfitSummary[]>();
  },

  async getDailyProfitTrend(start: string, end: string) {
    return await supabase.rpc("get_daily_profit_trend", { p_start: start, p_end: end }).returns<DailyProfit[]>();
  },

  /**
   * Kept as a compatibility boundary for the existing Finance screen.
   * Direct financial_transactions writes are intentionally unavailable.
   * A future manual-expense workflow must use an authoritative RPC instead.
   */
  async createTransaction(_input: FinancialTransactionInput) {
    return {
      data: null,
      error: new Error("Manual financial ledger entries are unavailable until an authoritative workflow is provided."),
    };
  },
};
