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

  async getPartLedger(engineerId: string) {
    const [out, returned, used, paid] = await Promise.all([
      supabase.from("engineer_parts_out").select("id,inventory_id,quantity,unit_price,created_at,notes").eq("engineer_id", engineerId).order("created_at", { ascending: false }),
      supabase.from("engineer_parts_in").select("id,inventory_id,quantity,unit_price,created_at,return_condition,notes").eq("engineer_id", engineerId).order("created_at", { ascending: false }),
      supabase.from("engineer_parts_used").select("id,inventory_id,quantity,unit_price,created_at,notes").eq("engineer_id", engineerId).order("created_at", { ascending: false }),
      supabase.from("engineer_parts_paid").select("id,inventory_id,quantity,unit_price,created_at,payment_method,notes").eq("engineer_id", engineerId).order("created_at", { ascending: false }),
    ]);
    const rows = [...(out.data ?? []), ...(returned.data ?? []), ...(used.data ?? []), ...(paid.data ?? [])];
    const ids = [...new Set(rows.map((r) => r.inventory_id))];
    const inv = ids.length ? await supabase.from("inventory").select("id,item_name").in("id", ids) : { data: [], error: null };
    const names = new Map((inv.data ?? []).map((i) => [i.id, i.item_name]));
    const withNames = (items: any[]) => items.map((item) => ({ ...item, item_name: names.get(item.inventory_id) ?? "Unknown item" }));
    return { out: withNames(out.data ?? []), returned: withNames(returned.data ?? []), used: withNames(used.data ?? []), paid: withNames(paid.data ?? []), error: out.error ?? returned.error ?? used.error ?? paid.error ?? inv.error ?? null };
  },

  async recordPartsOut(engineerId: string, inventoryId: string, quantity: number, unitPrice?: number, notes?: string | null) {
    return await supabase.rpc("engineer_parts_out", { p_engineer_id: engineerId, p_inventory_id: inventoryId, p_quantity: quantity, p_unit_price: unitPrice ?? null, p_notes: notes ?? null });
  },

  async recordPartsIn(engineerId: string, inventoryId: string, quantity: number, condition: "normal" | "faulty", notes?: string | null) {
    return await supabase.rpc("engineer_part_return", { p_engineer_id: engineerId, p_inventory_id: inventoryId, p_quantity: quantity, p_condition: condition, p_notes: notes ?? null });
  },

  async recordReplacement(faultyReturnId: string, inventoryId: string, quantity: number, notes?: string | null) {
    return await supabase.rpc("engineer_replacement_part", { p_faulty_return_id: faultyReturnId, p_inventory_id: inventoryId, p_quantity: quantity, p_notes: notes ?? null });
  },

  async recordPartUsed(engineerId: string, inventoryId: string, quantity: number, notes?: string | null) {
    return await supabase.rpc("engineer_part_used", { p_engineer_id: engineerId, p_inventory_id: inventoryId, p_quantity: quantity, p_notes: notes ?? null });
  },

  async recordPartPaid(engineerId: string, inventoryId: string, quantity: number, paymentMethod: string, notes?: string | null) {
    return await supabase.rpc("engineer_part_paid", { p_engineer_id: engineerId, p_inventory_id: inventoryId, p_quantity: quantity, p_payment_method: paymentMethod, p_notes: notes ?? null });
  },

  async getTodayPartMovement(date?: string) {
    const day = date ?? new Date().toISOString().slice(0, 10);
    const start = `${day}T00:00:00.000Z`;
    const end = `${day}T23:59:59.999Z`;
    const [out, returned, used, paid] = await Promise.all([
      supabase.from("engineer_parts_out").select("id,engineer_id,inventory_id,quantity,unit_price,created_at,notes").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
      supabase.from("engineer_parts_in").select("id,engineer_id,inventory_id,quantity,unit_price,created_at,return_condition,notes").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
      supabase.from("engineer_parts_used").select("id,engineer_id,inventory_id,quantity,unit_price,created_at,notes").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
      supabase.from("engineer_parts_paid").select("id,engineer_id,inventory_id,quantity,unit_price,created_at,payment_method,notes").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
    ]);
    const rows = [
      ...(out.data ?? []).map((r) => ({ ...r, movement: "collected" as const })),
      ...(returned.data ?? []).map((r) => ({ ...r, movement: "returned" as const })),
      ...(used.data ?? []).map((r) => ({ ...r, movement: "used" as const })),
      ...(paid.data ?? []).map((r) => ({ ...r, movement: "paid" as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const engineerIds = [...new Set(rows.map((r) => r.engineer_id))];
    const inventoryIds = [...new Set(rows.map((r) => r.inventory_id))];
    const [engineersRes, inventoryRes] = await Promise.all([
      engineerIds.length ? supabase.from("engineers").select("id,name").in("id", engineerIds) : Promise.resolve({ data: [], error: null }),
      inventoryIds.length ? supabase.from("inventory").select("id,item_name,brand,compatible_models,subcategory").in("id", inventoryIds) : Promise.resolve({ data: [], error: null }),
    ]);
    const engineers = new Map((engineersRes.data ?? []).map((e) => [e.id, e.name]));
    const inventory = new Map((inventoryRes.data ?? []).map((i) => [i.id, i]));
    return {
      data: rows.map((r) => ({ ...r, engineer_name: engineers.get(r.engineer_id) ?? "Unknown engineer", item: inventory.get(r.inventory_id) ?? null })),
      error: out.error ?? returned.error ?? used.error ?? paid.error ?? engineersRes.error ?? inventoryRes.error ?? null,
    };
  },

  async getDailyCollectionSummary(date?: string) {
    return await supabase.rpc("get_engineer_daily_collection_summary", { p_date: date ?? new Date().toISOString().slice(0, 10) });
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
