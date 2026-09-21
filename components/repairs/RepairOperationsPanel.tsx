import { supabase } from "@/lib/supabase";
import type { RepairApprovalHistory, RepairIntake, RepairQuote, RepairQuoteStatus } from "@/types/repairPhase4";
import type { RepairHandover, RepairRepeatLink } from "@/types/repairHandover";

export type RepairOutcome = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  outcome: "repaired" | "no_fix" | "failed_repair" | "cancelled" | "returned_unrepaired";
  reason: string | null;
  customer_notes: string | null;
  technician_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RepairWarranty = {
  id: string;
  company_id: string;
  branch_id: string | null;
  repair_id: string;
  customer_id: string;
  device_id: string;
  warranty_days: number;
  starts_at: string;
  expires_at: string;
  terms: string | null;
  status: "active" | "expired" | "void";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const repairOperationsService = {
  async getIntake(repairId: string) {
    return await supabase.from("repair_intake").select("*").eq("repair_id", repairId).maybeSingle<RepairIntake>();
  },
  async saveIntake(input: Omit<RepairIntake, "id" | "created_at" | "updated_at">) {
    // Never send UI placeholder strings to timestamptz columns. The intake form
    // uses empty strings for text inputs, but timestamps must be null or omitted.
    const payload = {
      ...input,
      acknowledged_at: input.acknowledged_at || null,
      acknowledged_by: input.acknowledged_by || null,
    };
    return await supabase.from("repair_intake").upsert(payload, { onConflict: "repair_id" }).select("*").single<RepairIntake>();
  },
  async getQuote(repairId: string) {
    return await supabase.from("repair_quotes").select("*").eq("repair_id", repairId).maybeSingle<RepairQuote>();
  },
  async getApprovalHistory(repairId: string) {
    return await supabase.from("repair_approval_history").select("*").eq("repair_id", repairId).order("acted_at", { ascending: false }).returns<RepairApprovalHistory[]>();
  },
  async sendQuote(repairId: string, amount: number, notes?: string | null, expiresAt?: string | null) {
    return await supabase.rpc("send_repair_quote", { p_repair_id: repairId, p_amount: amount, p_notes: notes ?? null, p_expires_at: expiresAt ?? null });
  },
  async respondToQuote(quoteId: string, action: Extract<RepairQuoteStatus, "approved" | "rejected">, notes?: string | null) {
    return await supabase.rpc("respond_to_repair_quote", { p_quote_id: quoteId, p_action: action, p_notes: notes ?? null });
  },
  async getOutcome(repairId: string) {
    return await supabase.from("repair_outcomes").select("*").eq("repair_id", repairId).maybeSingle<RepairOutcome>();
  },
  async recordOutcome(repairId: string, outcome: RepairOutcome["outcome"], reason?: string | null, customerNotes?: string | null, technicianNotes?: string | null) {
    return await supabase.rpc("record_repair_outcome", { p_repair_id: repairId, p_outcome: outcome, p_reason: reason ?? null, p_customer_notes: customerNotes ?? null, p_technician_notes: technicianNotes ?? null });
  },
  async getWarranty(repairId: string) {
    return await supabase.from("repair_warranties").select("*").eq("repair_id", repairId).maybeSingle<RepairWarranty>();
  },
  async createWarranty(repairId: string, days: number, terms?: string | null) {
    return await supabase.rpc("create_repair_warranty", { p_repair_id: repairId, p_warranty_days: days, p_terms: terms ?? null });
  },
  async getHandover(repairId: string) {
    return await supabase.from("repair_handovers").select("*").eq("repair_id", repairId).maybeSingle<RepairHandover>();
  },
  async recordHandover(input: { repairId: string; recipientName: string; recipientPhone?: string | null; idType?: string | null; idReference?: string | null; deviceCondition?: string | null; notes?: string | null }) {
    return await supabase.rpc("record_repair_handover", { p_repair_id: input.repairId, p_recipient_name: input.recipientName, p_recipient_phone: input.recipientPhone ?? null, p_id_type: input.idType ?? null, p_id_reference: input.idReference ?? null, p_device_condition: input.deviceCondition ?? null, p_customer_confirmed: true, p_notes: input.notes ?? null });
  },
  async getRepeatLinks(repairId: string) {
    return await supabase.from("repair_repeat_links").select("*").or(`original_repair_id.eq.${repairId},repeat_repair_id.eq.${repairId}`).order("created_at", { ascending: false }).returns<RepairRepeatLink[]>();
  },
  async linkRepeatRepair(originalRepairId: string, repeatRepairId: string, warrantyId?: string | null, reason?: string | null) {
    return await supabase.rpc("link_repeat_repair", { p_original_repair_id: originalRepairId, p_repeat_repair_id: repeatRepairId, p_warranty_id: warrantyId ?? null, p_reason: reason ?? null });
  },
  async getSla(repairId: string) {
    return await supabase.from("repair_sla_summary").select("*").eq("id", repairId).maybeSingle();
  },
};