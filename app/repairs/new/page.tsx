"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Phone, Search, UserRound, Smartphone } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { REPAIR_PRIORITIES } from "@/types/repair";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const input = "h-11 rounded-xl border-slate-200 bg-white";
const select = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function NewRepairPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("Standard Repair");
  const [models, setModels] = useState<{ brand: string; model: string }[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [showModels, setShowModels] = useState(false);
  const [deviceType, setDeviceType] = useState("Phone");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [color, setColor] = useState("");
  const [issue, setIssue] = useState("");
  const [technician, setTechnician] = useState("");
  const [estimated, setEstimated] = useState("");
  const [deposit, setDeposit] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [priority, setPriority] = useState("Normal");
  const [loading, setLoading] = useState(false);

  useEffect(() => { void (async () => { const { data } = await supabase.from("inventory").select("brand, compatible_models").not("compatible_models", "is", null).limit(2000); const list: { brand: string; model: string }[] = []; for (const row of (data || []) as { brand: string | null; compatible_models: string | null }[]) { const b = (row.brand || "").trim(); for (const raw of (row.compatible_models || "").split(/[,;|]/)) { const m = raw.trim(); if (b && m && !list.some((x) => x.brand.toLowerCase() === b.toLowerCase() && x.model.toLowerCase() === m.toLowerCase())) list.push({ brand: b, model: m }); } } setModels(list.sort((a,b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))); })(); }, []);
  const brands = useMemo(() => [...new Set(models.map((x) => x.brand))], [models]);
  const filteredModels = useMemo(() => { const q = modelSearch.trim().toLowerCase(); return models.filter((x) => (!brand || x.brand === brand) && (!q || (x.brand + " " + x.model).toLowerCase().includes(q))).slice(0, 80); }, [models, brand, modelSearch]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!phone.trim()) return void toast.error("Enter the customer phone number.");
    if (!brand.trim() || !model.trim()) return void toast.error("Select the device brand and model.");
    if (!issue.trim()) return void toast.error("Tell us what is wrong with the device.");

    const estimatedCost = estimated ? Number(estimated) : null;
    const paid = deposit ? Number(deposit) : 0;
    if (estimatedCost !== null && (!Number.isFinite(estimatedCost) || estimatedCost < 0)) return void toast.error("Estimated cost is invalid.");
    if (!Number.isFinite(paid) || paid < 0) return void toast.error("Deposit is invalid.");
    if (estimatedCost !== null && paid > estimatedCost) return void toast.error("Deposit cannot be greater than the estimated cost.");

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_walk_in_repair", {
        p_customer_name: customerName.trim(),
        p_phone: phone.trim(),
        p_device_type: deviceType.trim() || "Phone",
        p_brand: brand.trim(),
        p_model: model.trim(),
        p_serial_number: serial.trim() || null,
        p_color: color.trim() || null,
        p_issue: issue.trim(),
        p_technician: technician.trim() || null,
        p_estimated_cost: estimatedCost,
        p_deposit: paid,
        p_payment_method: paymentMethod,
        p_priority: priority,
        p_expected_completion_date: null,
        p_service_type: serviceType,
      });

      if (error) throw new Error(error.message);
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.repair_id) throw new Error("The repair was not returned by the database.");

      toast.success("Walk-in repair created successfully.");
      window.location.href = `/repairs/${created.repair_id}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create repair.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-4xl space-y-5 p-5 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <Link href="/repairs" className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft className="size-4" /></Link>
          <div><p className="text-sm font-medium text-teal-700">Repair desk</p><h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">New walk-in repair</h1><p className="mt-1 text-sm text-slate-500">Create the customer, device and repair job together at the counter.</p></div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4 text-teal-700" /> Customer</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label><Input className={input} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" autoComplete="name" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label><div className="relative"><Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className={`${input} pl-10`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080..." inputMode="tel" autoComplete="tel" required /></div></div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Smartphone className="size-4 text-teal-700" /> Device</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label><select className={select} value={deviceType} onChange={(e) => setDeviceType(e.target.value)}><option>Phone</option><option>Tablet</option><option>Laptop</option><option>Watch</option><option>Other</option></select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Brand</label><select className={select} value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); setModelSearch(""); }}><option value="">Select brand</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="relative"><label className="mb-1.5 block text-sm font-medium text-slate-700">Model</label><button type="button" onClick={() => setShowModels((v) => !v)} className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm"><span className={model ? "font-semibold text-slate-900" : "text-slate-400"}>{model || "Select phone model"}</span><ChevronDown className="size-4 text-slate-400" /></button>{showModels && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 p-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input autoFocus value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Search model..." className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none" /></div></div><div className="max-h-64 overflow-y-auto p-1">{filteredModels.map((item) => <button type="button" key={item.brand+"-"+item.model} onClick={() => { setBrand(item.brand); setModel(item.model); setModelSearch(""); setShowModels(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-teal-50"><span><b>{item.model}</b><span className="ml-2 text-xs text-slate-400">{item.brand}</span></span>{model === item.model && brand === item.brand && <Check className="size-4 text-teal-700" />}</button>)}</div></div>}</div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">IMEI / Serial</label><Input className={input} value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Optional" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Color</label><Input className={input} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Optional" /></div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-base">Repair job</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Customer complaint / problem</label><textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the fault exactly as reported by the customer..." required /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Service</label><select className={select} value={serviceType} onChange={(e) => setServiceType(e.target.value)}><option>Standard Repair</option><option>Network Unlock</option></select></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Technician</label><Input className={input} value={technician} onChange={(e) => setTechnician(e.target.value)} placeholder="Optional" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Collection rule</label><div className="flex h-11 items-center rounded-xl border border-teal-100 bg-teal-50 px-3 text-sm font-semibold text-teal-800">{serviceType === "Network Unlock" ? "No 3-day limit" : "Maximum 3 days"}</div></div></div>
              <div className="grid gap-4 sm:grid-cols-3"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Estimated cost</label><Input className={input} type="number" min="0" value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="0" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Deposit paid</label><Input className={input} type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Payment method</label><select className={select} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></div></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label><select className={select} value={priority} onChange={(e) => setPriority(e.target.value)}>{REPAIR_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/repairs" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700">Cancel</Link><Button type="submit" className="h-11 rounded-xl bg-slate-950 px-6 hover:bg-slate-800" disabled={loading}>{loading ? "Creating repair..." : "Create walk-in repair"}</Button></div>
        </form>
      </main>
    </AppLayout>
  );
}
