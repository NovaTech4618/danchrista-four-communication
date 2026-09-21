"use client";
import {useEffect,useState} from "react";
import {toast} from "sonner";
import {saleService} from "@/services/saleService";
import {staffService} from "@/services/staffService";
import {Button} from "@/components/ui/button";
const money=(n:number)=>`₦${Number(n||0).toLocaleString("en-NG",{maximumFractionDigits:0})}`;
export default function ReturnApprovalPanel(){
 const [sales,setSales]=useState<any[]>([]); const [isOwner,setIsOwner]=useState(false); const [repairs,setRepairs]=useState<any[]>([]); const [busy,setBusy]=useState<string|null>(null);
 async function load(){const [a,b]=await Promise.all([saleService.listSaleReturnRequests(),saleService.listRepairRefundRequests()]);if(!a.error)setSales(a.data||[]);if(!b.error)setRepairs(b.data||[]);}
 useEffect(()=>{void staffService.getMyRole().then(({data})=>setIsOwner(data==="owner")); void load()},[]);
 async function decide(id:string,kind:"sale"|"repair",approve:boolean){setBusy(id);const r=kind==="sale"?(approve?await saleService.approveSaleReturn(id):await saleService.rejectSaleReturn(id,"Boss rejected the request.")):(approve?await saleService.approveRepairRefund(id):await saleService.rejectRepairRefund(id,"Boss rejected the refund."));setBusy(null);if(r.error)return toast.error(r.error.message);toast.success(approve?"Approved and recorded.":"Request rejected.");void load();}
 if(!isOwner) return null;
 const pending=[...sales.filter(x=>x.status==="pending").map(x=>({...x,kind:"sale"})),...repairs.filter(x=>x.status==="pending").map(x=>({...x,kind:"repair"}))];
 return <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Boss control</p><h2 className="mt-1 text-lg font-bold text-slate-900">Returns, refunds & replacements</h2><p className="mt-1 text-xs text-slate-500">Nothing is refunded, returned to stock or replaced until you approve it.</p></div>{pending.length===0?<p className="mt-4 text-sm text-slate-500">No pending requests.</p>:<div className="mt-4 space-y-3">{pending.map(x=><div key={x.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">{x.kind==="sale"?`${x.action} · sale ${String(x.sale_id).slice(0,8)}`:`refund · repair ${String(x.repair_id).slice(0,8)}`}</p><p className="mt-1 text-xs text-slate-500">{x.reason}</p>{Number(x.refund_amount||x.amount)>0&&<p className="mt-1 text-sm font-bold text-slate-800">{money(Number(x.refund_amount||x.amount))}</p>}</div><div className="flex gap-2"><Button variant="outline" disabled={busy===x.id} onClick={()=>void decide(x.id,x.kind,false)}>Reject</Button><Button disabled={busy===x.id} onClick={()=>void decide(x.id,x.kind,true)}>{busy===x.id?"Processing…":"Approve"}</Button></div></div></div>)}</div>}</section>;
}