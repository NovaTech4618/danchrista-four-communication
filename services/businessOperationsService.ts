import { supabase } from "@/lib/supabase";

export const businessOperationsService = {
  async getCustomerBalances() { return await supabase.rpc("get_customer_balances"); },
  async getInvoices() { return await supabase.from("invoice_balance_view").select("*").order("issued_at", { ascending: false }); },
  async getInvoice(invoiceId: string) { return await supabase.from("invoice_balance_view").select("*").eq("id", invoiceId).single(); },
  async getRepairInvoice(repairId: string) { return await supabase.from("invoice_balance_view").select("*").eq("repair_id", repairId).neq("status", "void").order("issued_at", { ascending: true }).maybeSingle(); },
  async getInvoicePayments(invoiceId: string) { return await supabase.from("invoice_payments").select("*").eq("invoice_id", invoiceId).order("payment_date", { ascending: false }); },
  async recordInvoicePayment(input: { invoiceId: string; amount: number; paymentMethod: "cash" | "transfer" | "pos" | "other"; notes?: string | null; idempotencyKey?: string }) { const idempotencyKey = input.idempotencyKey ?? crypto.randomUUID(); return await supabase.rpc("record_invoice_payment", { p_invoice_id: input.invoiceId, p_amount: input.amount, p_payment_method: input.paymentMethod, p_notes: input.notes ?? null, p_idempotency_key: idempotencyKey }); },
  async createInvoice(input: { invoiceNumber: string; customerId: string | null; repairId?: string | null; saleId?: string | null; subtotal: number; discount?: number; total: number; dueAt?: string | null; notes?: string | null }) { return await supabase.rpc("create_invoice", { p_invoice_number: input.invoiceNumber, p_customer_id: input.customerId ?? null, p_repair_id: input.repairId ?? null, p_sale_id: input.saleId ?? null, p_subtotal: input.subtotal, p_discount: input.discount ?? 0, p_total: input.total, p_due_at: input.dueAt ?? null, p_notes: input.notes ?? null }); },
  async createInvoiceWithItem(input: { invoiceNumber: string; customerId: string | null; repairId?: string | null; saleId?: string | null; subtotal: number; discount?: number; total: number; dueAt?: string | null; notes?: string | null; description: string; quantity?: number; unitPrice: number }) { return await supabase.rpc("create_invoice_with_item", { p_invoice_number: input.invoiceNumber, p_customer_id: input.customerId ?? null, p_repair_id: input.repairId ?? null, p_sale_id: input.saleId ?? null, p_subtotal: input.subtotal, p_discount: input.discount ?? 0, p_total: input.total, p_due_at: input.dueAt ?? null, p_notes: input.notes ?? null, p_description: input.description, p_quantity: input.quantity ?? 1, p_unit_price: input.unitPrice }); },
  async createRepairInvoice(input: { repairId: string; invoiceNumber: string; dueAt?: string | null; notes?: string | null; description?: string; amount?: number; discount?: number }) { return await supabase.rpc("create_repair_invoice", { p_repair_id: input.repairId, p_invoice_number: input.invoiceNumber, p_due_at: input.dueAt ?? null, p_notes: input.notes ?? null, p_description: input.description ?? "Repair service", p_amount: input.amount ?? null, p_discount: input.discount ?? null }); },
  async addInvoiceItem(input: { invoiceId: string; description: string; quantity: number; unitPrice: number }) { return await supabase.rpc("add_invoice_item", { p_invoice_id: input.invoiceId, p_description: input.description, p_quantity: input.quantity, p_unit_price: input.unitPrice }); },
  async recordCustomerDebt(input: { customerId: string; invoiceId?: string | null; sourceType: "invoice" | "repair" | "sale" | "payment" | "adjustment"; sourceId?: string | null; debit?: number; credit?: number; branchId?: string | null; notes?: string | null }) { return await supabase.rpc("record_customer_debt", { p_customer_id: input.customerId, p_invoice_id: input.invoiceId ?? null, p_source_type: input.sourceType, p_source_id: input.sourceId ?? null, p_debit: input.debit ?? 0, p_credit: input.credit ?? 0, p_branch_id: input.branchId ?? null, p_notes: input.notes ?? null }); },
  async getAuditLogs() { return await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200); },
  async writeAudit(action: string, entityType: string, entityId?: string | null, oldData?: unknown, newData?: unknown, metadata?: unknown) { return await supabase.rpc("write_audit_log", { p_action: action, p_entity_type: entityType, p_entity_id: entityId ?? null, p_old: oldData ?? null, p_new: newData ?? null, p_metadata: metadata ?? null }); },
  async assignRepair(repairId: string, engineerId: string, notes?: string | null) { return await supabase.rpc("assign_repair_engineer", { p_repair_id: repairId, p_engineer_id: engineerId, p_notes: notes ?? null }); },
  async getEngineerPerformance() { return await supabase.from("engineer_performance_summary").select("*").order("completed_repairs", { ascending: false }); },
  async getInventoryReport() { return await supabase.from("inventory_report_summary").select("*"); },
  async getRepairReport() { return await supabase.from("repair_report_summary").select("*"); },
  async getSalesReport() { return await supabase.from("sales_report_summary").select("*"); },
  async recordStockAdjustment(inventoryId: string, quantity: number, direction: "in" | "out", notes?: string | null) { return await supabase.rpc("record_inventory_movement", { p_inventory_id: inventoryId, p_movement_type: direction === "in" ? "adjustment_in" : "adjustment_out", p_quantity: Math.abs(quantity), p_unit_cost: 0, p_reference_type: "manual_adjustment", p_reference_id: null, p_notes: notes ?? null }); },
  async getStockMovements(inventoryId?: string) { let query = supabase.from("inventory_stock_movements").select("*").order("created_at", { ascending: false }); if (inventoryId) query = query.eq("inventory_id", inventoryId); return await query.limit(100); },
  async getSupplierPayables() { return await supabase.from("supplier_payables_balance_view").select("*").order("due_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }); },
  async getSupplierPayable(payableId: string) { return await supabase.from("supplier_payables_balance_view").select("*").eq("id", payableId).single(); },
  async getSupplierPayableItems(payableId: string) { return await supabase.from("supplier_payable_items").select("*").eq("payable_id", payableId).order("created_at", { ascending: true }); },
  async getSupplierPayablePayments(payableId: string) { return await supabase.from("supplier_payable_payments").select("*").eq("payable_id", payableId).order("paid_at", { ascending: false }); },
  async createSupplierPayable(input: { personName: string; phone?: string; description?: string; agreedAmount: number; dueDate?: string | null; notes?: string | null; branchId?: string | null }) {
    const { data: companyId, error: companyError } = await supabase.rpc("get_my_company_id");
    if (companyError || !companyId) return { data: null, error: companyError ?? new Error("No company found") };
    return await supabase.from("supplier_payables").insert({ company_id: companyId, branch_id: input.branchId ?? null, person_name: input.personName.trim(), phone: input.phone?.trim() || null, description: input.description?.trim() || null, agreed_amount: input.agreedAmount, due_date: input.dueDate || null, notes: input.notes?.trim() || null }).select("id").single();
  },
  async addSupplierPayableItem(input: { payableId: string; itemName: string; quantity: number; unitValue: number }) {
    const { data: companyId, error: companyError } = await supabase.rpc("get_my_company_id");
    if (companyError || !companyId) return { data: null, error: companyError ?? new Error("No company found") };
    return await supabase.from("supplier_payable_items").insert({ company_id: companyId, payable_id: input.payableId, item_name: input.itemName.trim(), quantity: input.quantity, unit_value: input.unitValue });
  },
  async recordSupplierPayablePayment(input: { payableId: string; amount: number; paymentMethod: "cash" | "transfer" | "pos" | "other"; note?: string | null; paidAt?: string }) {
    const { data: companyId, error: companyError } = await supabase.rpc("get_my_company_id");
    if (companyError || !companyId) return { data: null, error: companyError ?? new Error("No company found") };
    const { data: payable, error: payableError } = await supabase.from("supplier_payables").select("agreed_amount").eq("id", input.payableId).single();
    if (payableError) return { data: null, error: payableError };
    const { data: paidRows, error: paidError } = await supabase.from("supplier_payable_payments").select("amount").eq("payable_id", input.payableId);
    if (paidError) return { data: null, error: paidError };
    const paid = (paidRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
    if (paid + input.amount > Number(payable.agreed_amount) + 0.01) return { data: null, error: new Error("Payment is greater than the outstanding balance.") };
    return await supabase.from("supplier_payable_payments").insert({ company_id: companyId, payable_id: input.payableId, amount: input.amount, payment_method: input.paymentMethod, note: input.note?.trim() || null, paid_at: input.paidAt || new Date().toISOString() });
  },
};
