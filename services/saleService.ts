import { supabase } from "@/lib/supabase";
import { notifyOwnerOnWhatsApp } from "@/lib/whatsapp";
import type { SaleItemInput } from "@/types/sale";

export const saleService = {
  async getSales() {
    return await supabase.from("sales").select("*, customers(full_name)").order("sale_date", { ascending: false });
  },
  async getSaleById(id: string) {
    return await supabase.from("sales").select("*, customers(full_name), sale_items(*, inventory(item_name))").eq("id", id).single();
  },
  async createSale(params: { customerId: string | null; paymentMethod: string; discount: number; staffName: string | null; notes: string | null; items: SaleItemInput[] }) {
    const result = await supabase.rpc("create_sale", { p_customer_id: params.customerId, p_payment_method: params.paymentMethod, p_discount: params.discount, p_staff_name: params.staffName, p_notes: params.notes, p_items: params.items });
    if (!result.error && result.data) {
      const saleId = Array.isArray(result.data) ? result.data[0]?.id : result.data?.id;
      if (saleId) {
        // Notification failure must never roll back a successful sale.
        void notifyOwnerOnWhatsApp("sale", saleId).catch((error) => console.error("Sale WhatsApp notification failed", error));
      }
    }
    return result;
  },
};
