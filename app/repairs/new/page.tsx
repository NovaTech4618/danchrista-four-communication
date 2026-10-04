"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Wrench } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";

const input = "h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10";
const select = input;

export default function NewRepairPage() {
  const [customerName,setCustomerName]=useState("");
  const [phone,setPhone]=useState("");
  const [brand,setBrand]=useState("");
  const [model,setModel]=useState("");
  const [issue,setIssue]=useState("");
  const [serviceType,setServiceType]=useState("Standard Repair");
  const [estimated,setEstimated]=useState("");
  const [deposit,setDeposit]=useState("");
  const [paymentMethod,setPaymentMethod]=useState("cash");
  const [loading,setLoading]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!phone.trim()) return void toast.error("Enter the customer's phone number.");
    if(!brand.trim()||!model.trim()) return void toast.error("Enter the phone brand and model.");
    if(!issue.trim()) return void toast.error("Enter the problem.");
    const cost=estimated?Number(estimated):null, paid=deposit?Number(deposit):0;
    if(cost!==null&&(!Number.isFinite(cost)||cost<0)) return void toast.error("Enter a valid repair price.");
    if(!Number.isFinite(paid)||paid<0||(cost!==null&&paid>cost)) return void toast.error("Check the payment amount.");
    setLoading(true);
    try{
      const {data,error}=await supabase.rpc("create_walk_in_repair",{
        p_customer_name:customerName.trim()||"Walk-in customer",p_phone:phone.trim(),p_device_type:"Phone",
        p_brand:brand.trim(),p_model:model.trim(),p_serial_number:null,p_color:null,p_issue:issue.trim(),
        p_technician:null,p_estimated_cost:cost,p_deposit:paid,p_payment_method:paymentMethod,
        p_priority:"Normal",p_expected_completion_date:null,p_service_type:serviceType
      });
      if(error) throw new Error(error.message);
      const created=Array.isArray(data)?data[0]:data;
      if(!created?.repair_id) throw new Error("The repair was not returned by the database.");
      toast.success("Repair received.");
      window.location.href="/repairs/"+created.repair_id;
    }catch(err){toast.error(err instanceof Error?err.message:"Could not receive the repair.");}
    finally{setLoading(false);}
  }

  return <AppLayout><main className="mx-auto w-full max-w-2xl space-y-4">
    <div className="flex items-center gap-3"><Link href="/repairs" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white"><ArrowLeft className="size-4"/></Link><div><p className="text-xs font-semibold text-[#1d6a54]">Repair book</p><h1 className="text-2xl font-bold tracking-tight">Receive phone</h1></div></div>

    <form onSubmit={submit} className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-[#eef4f1] p-4"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#1d6a54]"><Wrench className="size-5"/></span><div><p className="text-sm font-bold">New repair</p><p className="text-xs text-[#74837e]">Only enter what the counter needs right now.</p></div></div>

      <div className="space-y-5">
        <section><p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#74837e]">Customer</p><div className="grid gap-3 sm:grid-cols-2">
          <input className={input} value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Customer name (optional)"/>
          <div className="relative"><Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><input className={input+" pl-10"} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" required/></div>
        </div></section>

        <section><p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#74837e]">Phone</p><div className="grid gap-3 sm:grid-cols-2">
          <input className={input} value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Brand e.g. Tecno" required/>
          <input className={input} value={model} onChange={e=>setModel(e.target.value)} placeholder="Model e.g. Camon 20" required/>
        </div></section>

        <section><p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#74837e]">Problem</p><textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" value={issue} onChange={e=>setIssue(e.target.value)} placeholder="What did the customer say is wrong?" required/></section>

        <section><p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#74837e]">Money</p><div className="grid gap-3 sm:grid-cols-3">
          <input className={input} type="number" min="0" value={estimated} onChange={e=>setEstimated(e.target.value)} placeholder="Repair price"/>
          <input className={input} type="number" min="0" value={deposit} onChange={e=>setDeposit(e.target.value)} placeholder="Paid now"/>
          <select className={select} value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option></select>
        </div></section>

        <section><p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#74837e]">Service</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setServiceType("Standard Repair")} className={serviceType==="Standard Repair"?"rounded-xl border border-[#123b34] bg-[#123b34] py-3 text-sm font-bold text-white":"rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700"}>Standard repair</button><button type="button" onClick={()=>setServiceType("Network Unlock")} className={serviceType==="Network Unlock"?"rounded-xl border border-[#123b34] bg-[#123b34] py-3 text-sm font-bold text-white":"rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700"}>Network unlock</button></div><p className="mt-2 text-[11px] text-[#74837e]">{serviceType==="Network Unlock"?"Network unlock is not limited by the 3-day repair rule.":"Standard repairs should be completed within 3 days."}</p></section>
      </div>

      <div className="mt-7 flex gap-3"><Link href="/repairs" className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-bold text-slate-700">Cancel</Link><button disabled={loading} className="flex-1 rounded-xl bg-[#123b34] py-3 text-sm font-bold text-white disabled:opacity-50">{loading?"Saving…":"Receive repair"}</button></div>
    </form>
  </main></AppLayout>;
}
