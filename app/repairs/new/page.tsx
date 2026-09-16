"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserRound, Smartphone, UserCog } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { REPAIR_PRIORITIES } from "@/types/repair";
import { businessOperationsService } from "@/services/businessOperationsService";
import { engineerService } from "@/services/engineerService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const input = "h-11 rounded-xl border-slate-200 bg-white";
const select = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

type Engineer = { id: string; name: string; status: string };

export default function NewRepairPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceType, setDeviceType] = useState("Phone");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [color, setColor] = useState("");
  const [issue, setIssue] = useState("");
  const [technician, setTechnician] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [estimated, setEstimated] = useState("");
  const [deposit, setDeposit] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [priority, setPriority] = useState("Normal");
  const [expectedDate, setExpectedDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void engineerService.getEngineers().then(({ data }) => {
      setEngineers((data ?? []) as Engineer[]);
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!customerName.trim() || !phone.trim()) return void toast.error("Customer name and phone are required.");
    if (!brand.trim() || !model.trim()) return void toast.error("Device brand and model are required.");
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
        p_expected_completion_date: expectedDate || null,
      });

      if (error) throw new Error(error.message);
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.repair_id) throw new Error("The repair was not returned by the database.");

      if (engineerId) {
        const assignment = await businessOperationsService.assignRepair(created.repair_id, engineerId);
        if (assignment.error) toast.warning("Repair created, but engineer assignment could not be saved. Assign it from the repair desk.");
      }

      toast.success("Repair desk job created successfully.");
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
          <div><p className="text-sm font-medium text-teal-700">01 · Repair intake</p><h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">New repair desk job</h1><p className="mt-1 text-sm text-slate-500">Capture the customer, device and job once. The repair desk takes over after creation.</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">{["Customer", "Device", "Repair", "Initial payment"].map((step, index) => <div key={step} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">0{index + 1}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{step}</p></div>)}</div>

        <form onSubmit={submit} className="space-y-5">
          <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4 text-teal-700" /> Customer</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label><Input className={input} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" autoComplete="name" required /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label><Input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080..." inputMode="tel" autoComplete="tel" required /></div></CardContent></Card>

          <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Smartphone className="size-4 text-teal-700" /> Device</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label><select className={select} value={deviceType} onChange={(e) => setDeviceType(e.target.value)}><option>Phone</option><option>Tablet</option><option>Laptop</option><option>Watch</option><option>Other</option></select></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Brand</label><Input className={input} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Tecno, iPhone, Samsung..." required /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Model</label><Input className={input} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camon 20, iPhone 13..." required /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">IMEI / Serial</label><Input className={input} value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Optional" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Color</label><Input className={input} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Optional" /></div></CardContent></Card>

          <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-base">Repair job</CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Customer complaint / problem</label><textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the fault exactly as reported by the customer..." required /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Engineer</label><div className="relative"><UserCog className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400"/><select className={`${select} pl-9`} value={engineerId} onChange={(e) => setEngineerId(e.target.value)}><option value="">Assign from repair desk</option>{engineers.map((engineer) => <option key={engineer.id} value={engineer.id} disabled={engineer.status !== "active"}>{engineer.name}{engineer.status !== "active" ? " · inactive" : ""}</option>)}</select></div><p className="mt-1 text-xs text-slate-500">Uses the existing engineer assignment workflow.</p></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Technician note/name</label><Input className={input} value={technician} onChange={(e) => setTechnician(e.target.value)} placeholder="Optional" /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Estimated cost</label><Input className={input} type="number" min="0" value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="0" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label><select className={select} value={priority} onChange={(e) => setPriority(e.target.value)}>{REPAIR_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></div></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Expected completion</label><Input className={input} type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></div></CardContent></Card>

          <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-base">Initial payment <span className="font-normal text-slate-500">(optional)</span></CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Deposit paid</label><Input className={input} type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0" /><p className="mt-1 text-xs text-slate-500">Recorded through the existing walk-in payment path.</p></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Payment method</label><select className={select} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></div></CardContent></Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">After creation, continue from the repair control center.</p><div className="flex gap-3"><Link href="/repairs" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700">Cancel</Link><Button type="submit" className="h-11 rounded-xl bg-slate-950 px-6 hover:bg-slate-800" disabled={loading}>{loading ? "Creating repair..." : "Create repair & open desk"}</Button></div></div>
        </form>
      </main>
    </AppLayout>
  );
}
