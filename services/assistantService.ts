import { supabase } from "@/lib/supabase";

export type AssistantReply = { text: string; items?: { label: string; value: string; href?: string }[] };
const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export const assistantService = {
  async ask(input: string): Promise<{ data: AssistantReply; error: Error | null }> {
    const q = input.trim().toLowerCase();
    if (!q) return { data: { text: "Ask me about repairs, inventory, payments, customers, engineers, or today's shop." }, error: null };
    if (/low stock|stock low|running low|out of stock/.test(q)) {
      const { data, error } = await supabase.from("inventory").select("id,item_name,quantity,reorder_level").order("quantity", { ascending: true });
      if (error) return { data: { text: "I couldn't read inventory right now." }, error };
      const low = (data ?? []).filter(x => Number(x.quantity ?? 0) <= Number(x.reorder_level ?? 0));
      return { data: { text: low.length ? `${low.length} inventory item${low.length === 1 ? " is" : "s are"} at or below the reorder level.` : "Nothing is currently at or below its reorder level.", items: low.slice(0, 8).map(x => ({ label: x.item_name, value: `${x.quantity} in stock`, href: "/inventory" })) }, error: null };
    }
    if (/outstanding|owe|debt|unpaid|balance/.test(q)) {
      const { data, error } = await supabase.from("customer_debt_ledger").select("customer_id,debit,credit,customers(full_name)");
      if (error) return { data: { text: "I couldn't read customer balances right now." }, error };
      const totals = new Map<string, { name: string; balance: number }>();
      for (const row of data ?? []) { const c = Array.isArray(row.customers) ? row.customers[0] : row.customers; const name = (c as { full_name?: string } | null)?.full_name ?? "Customer"; const x = totals.get(row.customer_id) ?? { name, balance: 0 }; x.balance += Number(row.debit ?? 0) - Number(row.credit ?? 0); totals.set(row.customer_id, x); }
      const owing = [...totals.entries()].filter(([, x]) => x.balance > 0).sort((a,b) => b[1].balance-a[1].balance); const total = owing.reduce((s,[,x]) => s+x.balance,0);
      return { data: { text: owing.length ? `Customers currently owe ${money(total)} across ${owing.length} account${owing.length === 1 ? "" : "s"}.` : "There are no outstanding customer balances.", items: owing.slice(0,8).map(([id,x]) => ({ label:x.name, value:money(x.balance), href:`/customers/${id}` })) }, error:null };
    }
    if (/engineer|technician/.test(q)) {
      const { data, error } = await supabase.from("engineer_transactions").select("engineer_id,debit,credit,engineers(name)");
      if (error) return { data: { text: "I couldn't read engineer accounts right now." }, error };
      const totals = new Map<string,{name:string;balance:number}>();
      for (const row of data ?? []) { const e=Array.isArray(row.engineers)?row.engineers[0]:row.engineers; const name=(e as {name?:string}|null)?.name??"Engineer"; const x=totals.get(row.engineer_id)??{name,balance:0}; x.balance+=Number(row.debit??0)-Number(row.credit??0); totals.set(row.engineer_id,x); }
      const rows=[...totals.values()].sort((a,b)=>b.balance-a.balance);
      return { data:{ text:rows.length?"Here are the current engineer account balances.":"No engineer transactions have been recorded yet.", items:rows.slice(0,8).map(x=>({label:x.name,value:money(x.balance)})) }, error:null };
    }
    if (/repair|repairs|job|jobs/.test(q)) {
      const { data, error } = await supabase.from("repairs").select("id,status,issue,devices(brand,model)").order("created_at",{ascending:false}).limit(20);
      if (error) return { data:{text:"I couldn't read repairs right now."},error };
      const active=(data??[]).filter(x=>!["Completed","Collected"].includes(x.status));
      return { data:{text:`There are ${active.length} active repair${active.length===1?"":"s"} in the latest shop records.`,items:active.slice(0,8).map(x=>{const d=Array.isArray(x.devices)?x.devices[0]:x.devices;return{label:`${d?.brand??"Device"} ${d?.model??""}`.trim(),value:`${x.status} · ${x.issue??"No issue recorded"}`,href:`/repairs/${x.id}`};})},error:null };
    }
    if (/today|cash|revenue|profit|dashboard|sales/.test(q)) {
      const { data,error }=await supabase.rpc("get_dashboard_summary"); if(error)return{data:{text:"I couldn't load today's business summary right now."},error}; const s=Array.isArray(data)?data[0]:data; if(!s)return{data:{text:"There isn't enough dashboard data to summarize yet."},error:null};
      return {data:{text:"Here is the live shop snapshot I can access.",items:Object.entries(s).slice(0,8).map(([k,v])=>({label:k.replaceAll("_"," "),value:typeof v==="number"?money(v):String(v??"—")}))},error:null};
    }
    return { data:{text:"I can help with live Danchrista records. Try: 'What's low in stock?', 'Who owes money?', 'How are the engineers doing?', 'Show active repairs', or 'How is the shop today?'"},error:null };
  }
};
