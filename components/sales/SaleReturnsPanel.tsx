"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saleService } from "@/services/saleService";
import { Button } from "@/components/ui/button";

type Sale={id:string;sale_date:string;total:number|null;sale_items:Array<{id:string;inventory_id:string;quantity:number;unit_price:number;inventory?:{item_name:string}|{item_name:string}[]|null}>};
const money=(n:number)=>`₦${Number(n||0).toLocaleString("en-NG",{maximumFractionDigits:0})}`;
export default function SaleReturnsPanel({sales}:{sales:Sale[]}) {
 const [saleId,setSaleId]=useState(""); const [itemId,setItemId]=useState(""); const [qty,setQty]=useState("1"); const [action,setAction]=useState<"return"|"refund"|"replacement">("refund"); const [amount,setAmount]=useState(""); const [method,setMethod]=useState("cash"); const [reason,setReason]=useState(""); const [busy,setBusy]=useState(false);
 const sale=sales.find(s=>s.id===saleId); const item=sale?.sale_items.find(i=>i.id===itemId);
 useEffect(()=>{setItemId("");setAmount("");},[saleId]);
 async function submit(){
  if(!sale||!item||!reason.trim()) return toast.error("Select the sale, item and return reason.");
  setBusy(true);
  const {error}=await saleService.requestSaleReturn({saleId,action,refundAmount:action==="refund"?Number(amount):0,refundPaymentMethod:action==="refund"?method:null,reason,items:[{sale_item_id:item.id,quantity:Number(qty)}]});
  setBusy(false); if(error)return toast.error(error.message);
  toast.success("Return request sent to the Boss. Nothing was changed yet."); setSaleId("");setReason("");setQty("1");setAmount("");
 }
 return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Returns & refunds</h2><p className="mt-1 text-xs text-slate-500">Requests are recorded first. The Boss approves exceptional returns, refunds and replacements before stock or money changes.</p>
 <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
 <select aria-label="Sale" value={saleId} onChange={e=>setSaleId(e.target.value)} className="h-11 rounded-xl border px-3 text-sm"><option value="">Select sale…</option>{sales.map(s=><option key={s.id} value={s.id}>{new Date(s.sale_date).toLocaleDateString("en-NG")} · {money(Number(s.total))}</option>)}</select>
 <select aria-label="Item" value={itemId} onChange={e=>setItemId(e.target.value)} disabled={!sale} className="h-11 rounded-xl border px-3 text-sm"><option value="">Select item…</option>{sale?.sale_items.map(i=>{const n=Array.isArray(i.inventory)?i.inventory[0]?.item_name:i.inventory?.item_name;return <option key={i.id} value={i.id}>{n||"Item"} · {i.quantity} sold</option>})}</select>
 <select aria-label="Action" value={action} onChange={e=>setAction(e.target.value as typeof action)} className="h-11 rounded-xl border px-3 text-sm"><option value="refund">Refund</option><option value="return">Return to stock</option><option value="replacement">Replacement</option></select>
 <input aria-label="Quantity" type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} className="h-11 rounded-xl border px-3 text-sm" />
 {action==="refund"&&<><input aria-label="Refund amount" type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Refund amount" className="h-11 rounded-xl border px-3 text-sm"/><select aria-label="Refund method" value={method} onChange={e=>setMethod(e.target.value)} className="h-11 rounded-xl border px-3 text-sm"><option>cash</option><option>transfer</option><option>pos</option><option>other</option></select></>}
 </div>
 <div className="mt-3 flex flex-col gap-3 sm:flex-row"><input aria-label="Reason" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for return / refund…" className="h-11 flex-1 rounded-xl border px-3 text-sm"/><Button disabled={busy||!sale||!item||!reason.trim()} onClick={()=>void submit()} className="h-11 rounded-xl">{busy?"Sending…":"Request Boss approval"}</Button></div>
 </section>;
}