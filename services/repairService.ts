import { supabase } from "@/lib/supabase";
import { notifyOwnerOnWhatsApp } from "@/lib/whatsapp";

export type RepairFinancialSummary = {
  repair_id: string;
  total_cost: number;
  total_paid: number;
  outstanding: number;
  payment_status: string;
};

export const repairService = {
  async getRepairs(deviceId: string) {
    return await supabase.from("repairs").select("*, repair_tickets(id, ticket_number, issued_at)").eq("device_id", deviceId).order("created_at", { ascending: false });
  },

  async getRepairById(id: string) {
    return await supabase.from("repairs").select("*, devices(id, brand, model, customers(id, full_name, phone)), repair_tickets(id, ticket_number, issued_at)").eq("id", id).single();
  },

  async getRepairProfit(id: string) {
    const { data, error } = await supabase.rpc("get_repair_profit", { p_repair_id: id });
    if (error) return { data: null, error };
    return { data: Array.isArray(data) ? data[0] ?? null : data, error: null };
  },

  async getFinancialSummary(id: string) {
    const { data, error } = await supabase.rpc("get_repair_financial_summary", { p_repair_id: id });
    if (error) return { data: null, error };
    return { data: (Array.isArray(data) ? data[0] ?? null : data) as RepairFinancialSummary | null, error: null };
  },

  async getPayments(id: string) {
    return await supabase.from("repair_payments").select("*").eq("repair_id", id).order("payment_date", { ascending: false });
  },

  async recordPayment(id: string, amount: number, paymentMethod: string, notes?: string) {
    const idempotencyKey = crypto.randomUUID();
    const { data, error } = await supabase.rpc("record_repair_payment", {
      p_repair_id: id,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_payment_date: new Date().toISOString(),
      p_notes: notes || null,
      p_idempotency_key: idempotencyKey,
    });
    return { data: Array.isArray(data) ? data[0] ?? null : data, error };
  },

  async getAllRepairs() {
    return await supabase.from("repairs").select("*, devices(brand, model, customers(full_name)), repair_tickets(id, ticket_number)").order("created_at", { ascending: false });
  },

  async getAllRepairBalances() {
    return await supabase.from("repair_balance_view").select("repair_id, outstanding, paid_amount, total_amount, payment_status");
  },

  async addRepair(repair: { device_id: string; technician: string | null; issue: string; diagnosis: string | null; repair_notes: string | null; solution: string | null; priority: string; deposit: number; deposit_payment_method?: string; expected_completion_date: string | null; estimated_cost: number | null; final_cost: number | null; status: string; }) {
    const result = await supabase.from("repairs").insert([repair]).select("id").single();
    if (!result.error && result.data?.id) await notifyOwnerOnWhatsApp("repair", result.data.id);
    return result;
  },

  async updateRepair(id: string, repair: {
    technician: string | null;
    issue: string;
    diagnosis: string | null;
    repair_notes: string | null;
    solution: string | null;
    priority: string;
    expected_completion_date: string | null;
    deposit?: number;
    estimated_cost?: number | null;
    final_cost?: number | null;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from("repairs")
      .update({
        technician: repair.technician,
        issue: repair.issue,
        diagnosis: repair.diagnosis,
        repair_notes: repair.repair_notes,
        solution: repair.solution,
        priority: repair.priority,
        expected_completion_date: repair.expected_completion_date,
      })
      .eq("id", id)
      .select("*")
      .single();
    return { data, error };
  },

  async changeStatus(id: string, status: string, note?: string | null) {
    const { data, error } = await supabase.rpc("change_repair_status", { p_repair_id: id, p_status: status, p_note: note ?? null });
    const result = { data: Array.isArray(data) ? data[0] ?? null : data, error };
    if (!error) await notifyOwnerOnWhatsApp("repair", id);
    return result;
  },

  async deleteRepair(id: string) {
    return await supabase.from("repairs").delete().eq("id", id);
  },

  async completeRepair(id: string) {
    const { data, error } = await supabase.rpc("complete_repair", { p_repair_id: id });
    if (error) return { data: null, error };
    return { data: Array.isArray(data) ? data[0] : data, error: null };
  },
};
