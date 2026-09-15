import { supabase } from "@/lib/supabase";

export type BusinessReport = {
  sales_revenue:number;
  repair_revenue:number;
  engineer_revenue:number;
  standalone_invoice_revenue:number;
  cash_received:number;
  inventory_cogs:number;
  gross_profit:number;
  operating_expenses:number;
  engineer_cost:number;
  net_profit:number;
  repairs_received:number;
  repairs_completed:number;
  customer_outstanding:number;
  engineer_outstanding:number;
  low_stock_items:number;
};
export type RepairReportRow = { id:string; status:string|null; final_cost:number|null; created_at:string; received_at:string|null; completed_at:string|null; expected_completion_date:string|null; technician:string|null };
export type CustomerAnalyticsRow = { id:string; full_name:string; phone:string; created_at:string };
export type CustomerSaleRow = { customer_id:string|null; total:number|null; sale_date:string };
export type CustomerRepairRow = { customer_id:string|null; final_cost:number|null; created_at:string };
export type InventoryValuationRow = { id:string; item_name:string; category:string|null; quantity:number|null; minimum_stock:number|null; cost_price:number|null; selling_price:number|null; branch_id:string|null };

export const reportsService = {
  async getBusinessReport(from?:string,to?:string){const {data,error}=await supabase.rpc("get_business_report",{p_from:from??new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString(),p_to:to??new Date().toISOString()});return {data:(data?.[0]??null) as BusinessReport|null,error};},
  async getSalesWithItems(from?:string,to?:string){let query=supabase.from("sales").select("id, sale_date, total, discount, sale_items(quantity, unit_price, total_price, inventory(item_name, cost_price))").order("sale_date",{ascending:false});if(from)query=query.gte("sale_date",from);if(to)query=query.lte("sale_date",to);return await query;},
  async getRepairsForReports(from?:string,to?:string){let query=supabase.from("repairs").select("id, status, final_cost, created_at, received_at, completed_at, expected_completion_date, technician").order("created_at",{ascending:false});if(from)query=query.gte("received_at",from);if(to)query=query.lte("received_at",to);const result=await query;return {data:(result.data??[]) as RepairReportRow[],error:result.error};},
  async getCustomerAnalytics(from?:string,to?:string){let customersQuery=supabase.from("customers").select("id, full_name, phone, created_at").order("created_at",{ascending:false});if(from)customersQuery=customersQuery.lte("created_at",to??new Date().toISOString());let salesQuery=supabase.from("sales").select("customer_id, total, sale_date");if(from)salesQuery=salesQuery.gte("sale_date",from);if(to)salesQuery=salesQuery.lte("sale_date",to);let repairsQuery=supabase.from("repairs").select("final_cost, created_at, devices!inner(customer_id)");if(from)repairsQuery=repairsQuery.gte("created_at",from);if(to)repairsQuery=repairsQuery.lte("created_at",to);const [customers,sales,repairs]=await Promise.all([customersQuery,salesQuery,repairsQuery]);const repairRows=(repairs.data??[]).map(row=>{const device=Array.isArray(row.devices)?row.devices[0]:row.devices;return {customer_id:device?.customer_id??null,final_cost:row.final_cost,created_at:row.created_at} as CustomerRepairRow});return {customers:(customers.data??[]) as CustomerAnalyticsRow[],sales:(sales.data??[]) as CustomerSaleRow[],repairs:repairRows,error:customers.error||sales.error||repairs.error};},
  async getLowStockItems(){return await supabase.from("inventory").select("id, item_name, quantity, minimum_stock").order("quantity",{ascending:true});},
  async getInventoryValuation(){return await supabase.from("inventory").select("id, item_name, category, quantity, minimum_stock, cost_price, selling_price, branch_id").order("item_name",{ascending:true}) as {data:InventoryValuationRow[]|null;error:any};},
};
