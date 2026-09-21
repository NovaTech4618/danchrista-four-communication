import { supabase } from "@/lib/supabase";
import type {
  EngineerAccountSummary,
  EngineerBalance,
  EngineerInput,
  EngineerTransaction,
} from "@/types/engineer";

export const engineerService = {
  async getEngineers() {
    return await supabase.from("engineers").select("*").order("name", { ascending: true });
  },

  async getEngineer(id: string) {
    return await supabase.from("engineers").select("*").eq("id", id).single();
  },

  async createEngineer(input: EngineerInput) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .single();

    if (profileError || !profile?.company_id) {
      return { data: null, error: profileError ?? new Error("Your account is not linked to a company.") };
    }

    return await supabase
      .from("engineers")
      .insert({ company_id: profile.company_id, name: input.name.trim(), phone: input.phone?.trim() || null, business_name: input.business_name?.trim() || null, address: input.address?.trim() || null, notes: input.notes?.trim() || null, status: "active" })
      .select()
      .single();
  },

  async updateEngineer(id: string, input: EngineerInput) {
    return await supabase.from("engineers").update({ name: input.name.trim(), phone: input.phone?.trim() || null, business_name: input.business_name?.trim() || null, address: input.address?.trim() || null, notes: input.notes?.trim() || null }).eq("id", id).select().single();
  },

  async setEngineerStatus(id: string, status: "active" | "inactive") {
    return await supabase.from("engineers").update({ status }).eq("id", id).select().single();
  },

  async getBalances() { return await supabase.rpc("get_engineer_balances").returns<EngineerBalance[]>(); },
  async getBalance(engineerId: string) { return await supabase.rpc("get_engineer_balance", { p_engineer_id: engineerId }); },
  async getAccountSummary(engineerId: string) { return await supabase.rpc("get_engineer_account_summary", { p_engineer_id: engineerId }).returns<EngineerAccountSummary[]>(); },
  async getTransactions(engineerId: string) { return await supabase.from("engineer_transactions").select("*").eq("engineer_id", engineerId).order("transaction_date", { ascending: false }); },

  async recordPartsOut(engineerId: string, inventoryId: string, quantity: number, unitPrice?: number, notes?: string | null) {
    return await supabase.rpc("engineer_parts_out", { p_engineer_id: engineerId, p_inventory_id: inventoryId, p_quantity: quantity, p_unit_price: unitPrice ?? null, p_notes: notes ?? null });
  },

  async recordPartsIn(engineerId: string, inventoryId: string, quantity: number, condition: "normal" | "faulty", notes?: string | null) {
    return await supabase.rpc("engineer_part_return", { p_engineer_id: engineerId, p_inventory_id: inventoryId, p_quantity: quantity, p_condition: condition, p_notes: notes ?? null });
  },

  async recordReplacement(faultyReturnId: string, inventoryId: string, quantity: number, notes?: string | null) {
    return await supabase.rpc("engineer_replacement_part", { p_faulty_return_id: faultyReturnId, p_inventory_id: inventoryId, p_quantity: quantity, p_notes: notes ?? null });
  },

  async recordWork(engineerId: string, amount: number, description: string, notes?: string | null) {
    return await supabase.rpc("engineer_work_charge", { p_engineer_id: engineerId, p_amount: amount, p_description: description, p_notes: notes ?? null });
  },

  async recordPaymentIn(engineerId: string, amount: number, paymentMethod?: string | null, notes?: string | null) {
    return await supabase.rpc("engineer_payment_in", { p_engineer_id: engineerId, p_amount: amount, p_payment_method: paymentMethod ?? null, p_notes: notes ?? null });
  },
  async recordPaymentOut(engineerId: string, amount: number, paymentMethod?: string | null, notes?: string | null) {
    return await supabase.rpc("engineer_payment_out", { p_engineer_id: engineerId, p_amount: amount, p_payment_method: paymentMethod ?? null, p_notes: notes ?? null });
  },
  async recordOpeningBalance(engineerId: string, amount: number, notes?: string | null) {
    return await supabase.rpc("engineer_opening_balance", { p_engineer_id: engineerId, p_amount: amount, p_notes: notes ?? null });
  },
};
