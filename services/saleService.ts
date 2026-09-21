import { supabase } from "@/lib/supabase";
import { notifyOwnerOnWhatsApp } from "@/lib/whatsapp";
import type { SaleItemInput } from "@/types/sale";

export const saleService = {
  async getSales() {
    return await supabase
      .from("sales")
      .select("*, customers(full_name), sale_items(id,inventory_id,quantity,unit_price,total_price,inventory(item_name))")
      .order("sale_date", { ascending: false });
  },

  async getSaleById(id: string) {
    return await supabase
      .from("sales")
      .select("*, customers(full_name), sale_items(*, inventory(item_name))")
      .eq("id", id)
      .single();
  },

  async requestPriceOverride(params: { customerId: string | null; paymentMethod: string; discount: number; staffName: string | null; notes: string | null; items: SaleItemInput[]; reason?: string }) {
    return await supabase.rpc("request_sale_price_override", {
      p_customer_id: params.customerId,
      p_payment_method: params.paymentMethod,
      p_discount: params.discount,
      p_staff_name: params.staffName,
      p_notes: params.notes,
      p_items: params.items,
      p_reason: params.reason ?? null,
    });
  },

  async listPriceOverrideRequests() {
    return await supabase.rpc("list_sale_price_override_requests");
  },

  async approvePriceOverride(id: string, note?: string | null) {
    const result = await supabase.rpc("approve_sale_price_override", { p_request_id: id, p_decision_note: note ?? null });
    if (!result.error && result.data) void notifyOwnerOnWhatsApp("sale", result.data).catch(() => undefined);
    return result;
  },

  async rejectPriceOverride(id: string, note?: string | null) {
    return await supabase.rpc("reject_sale_price_override", { p_request_id: id, p_decision_note: note ?? null });
  },

  async requestSaleReturn(params: { saleId: string; action: "return" | "refund" | "replacement"; refundAmount: number; refundPaymentMethod: string | null; reason: string; notes?: string | null; items: Array<{ sale_item_id: string; quantity: number }>; replacementInventoryId?: string | null; replacementQuantity?: number | null }) {
    return await supabase.rpc("request_sale_return", {
      p_sale_id: params.saleId, p_action: params.action, p_refund_amount: params.refundAmount,
      p_refund_payment_method: params.refundPaymentMethod, p_reason: params.reason, p_notes: params.notes ?? null,
      p_items: params.items, p_replacement_inventory_id: params.replacementInventoryId ?? null,
      p_replacement_quantity: params.replacementQuantity ?? null,
    });
  },
  async listSaleReturnRequests() { return await supabase.rpc("list_sale_return_requests"); },
  async approveSaleReturn(id: string, note?: string | null) { return await supabase.rpc("approve_sale_return", { p_request_id: id, p_decision_note: note ?? null }); },
  async rejectSaleReturn(id: string, note?: string | null) { return await supabase.rpc("reject_sale_return", { p_request_id: id, p_decision_note: note ?? null }); },
  async requestRepairRefund(params: { repairId: string; amount: number; paymentMethod: string; reason: string; notes?: string | null }) {
    return await supabase.rpc("request_repair_refund", { p_repair_id: params.repairId, p_amount: params.amount, p_payment_method: params.paymentMethod, p_reason: params.reason, p_notes: params.notes ?? null });
  },
  async approveRepairRefund(id: string, note?: string | null) { return await supabase.rpc("approve_repair_refund", { p_request_id: id, p_decision_note: note ?? null }); },
  async rejectRepairRefund(id: string, note?: string | null) { return await supabase.rpc("reject_repair_refund", { p_request_id: id, p_decision_note: note ?? null }); },

  async createSale(params: {
    customerId: string | null;
    paymentMethod: string;
    discount: number;
    staffName: string | null;
    notes: string | null;
    items: SaleItemInput[];
    idempotencyKey?: string;
  }) {
    const result = await supabase.rpc("create_sale", {
      p_customer_id: params.customerId,
      p_payment_method: params.paymentMethod,
      p_discount: params.discount,
      p_staff_name: params.staffName,
      p_notes: params.notes,
      p_items: params.items,
      p_idempotency_key: params.idempotencyKey ?? null,
    });
    if (!result.error && result.data) {
      const saleId = Array.isArray(result.data) ? result.data[0]?.id : result.data;
      if (saleId) void notifyOwnerOnWhatsApp("sale", saleId).catch((error) => console.error("Sale WhatsApp notification failed", error));
    }
    return result;
  },
};
