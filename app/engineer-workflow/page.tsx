"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { engineerService } from "@/services/engineerService";
import { supabase } from "@/lib/supabase";

type Engineer = { id: string; name: string; status: string };
type InventoryItem = { id: string; item_name: string; quantity: number; selling_price: number };
const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

export default function EngineerWorkflowPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [engineerId, setEngineerId] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [partPrice, setPartPrice] = useState("");
  const [returnCondition, setReturnCondition] = useState<"normal" | "faulty">("normal");
  const [workAmount, setWorkAmount] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [people, stock] = await Promise.all([
      engineerService.getEngineers(),
      supabase.from("inventory").select("id,item_name,quantity,selling_price").eq("is_active", true).order("item_name"),
    ]);
    setEngineers((people.data ?? []).filter((e) => e.status === "active") as Engineer[]);
    setItems((stock.data ?? []) as InventoryItem[]);
  }
  useEffect(() => { void load(); }, []);

  async function run(action: () => Promise<{ error: { message?: string } | null }>) {
    setBusy(true); setMessage("");
    const result = await action();
    setMessage(result.error ? result.error.message || "Could not save this record." : "Recorded successfully. The original record remains in the ledger.");
    if (!result.error) { setNotes(""); setQuantity("1"); setPartPrice(""); setReturnCondition("normal"); setWorkAmount(""); setWorkDescription(""); await load(); }
    setBusy(false);
  }

  const selectedItem = items.find((i) => i.id === inventoryId);

  return <AppLayout><div className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Workshop records</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Engineer Work</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Record parts collected and work done. Nothing here can delete an engineer record; returned parts are recorded as returns.</p></header>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Who is this for?</h2>
      <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)} className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"><option value="">Select engineer</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold text-slate-950">Part collected</h2><p className="mt-1 text-sm text-slate-500">Stock leaves the shop and becomes part of the engineer’s outstanding record.</p></div>
        <div className="mt-4 space-y-3">
          <select value={inventoryId} onChange={(e) => { setInventoryId(e.target.value); const item = items.find((i) => i.id === e.target.value); setPartPrice(item ? String(item.selling_price ?? 0) : ""); }} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Select part</option>{items.map((i) => <option key={i.id} value={i.id}>{i.item_name} · {i.quantity} in stock</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><input type="number" min="1" max={selectedItem?.quantity ?? undefined} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input type="number" min="0" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} placeholder="Price" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /></div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          <button disabled={busy || !engineerId || !inventoryId} onClick={() => run(() => engineerService.recordPartsOut(engineerId, inventoryId, Number(quantity), Number(partPrice), notes))} className="h-11 w-full rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Record part collected</button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold text-slate-950">Part returned</h2><p className="mt-1 text-sm text-slate-500">Never delete the original collection. Record the quantity that came back.</p></div>
        <div className="mt-4 space-y-3">
          <select value={inventoryId} onChange={(e) => { setInventoryId(e.target.value); const item = items.find((i) => i.id === e.target.value); setPartPrice(item ? String(item.selling_price ?? 0) : ""); }} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Select returned part</option>{items.map((i) => <option key={i.id} value={i.id}>{i.item_name} · {i.quantity} sellable</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty returned" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input type="number" min="0" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} placeholder="Return value" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /></div>
          <button disabled={busy || !engineerId || !inventoryId} onClick={() => run(() => engineerService.recordPartsIn(engineerId, inventoryId, Number(quantity), "normal", notes))} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Record returned part</button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div><h2 className="font-semibold text-slate-950">Work done</h2><p className="mt-1 text-sm text-slate-500">Record the service/work completed for the engineer. This adds to the engineer’s outstanding debit; it does not record a payment.</p></div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} placeholder="e.g. Screen replacement" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" />
          <input type="number" min="0" value={workAmount} onChange={(e) => setWorkAmount(e.target.value)} placeholder="Amount" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" />
          <button disabled={busy || !engineerId || !workDescription.trim() || Number(workAmount) <= 0} onClick={() => run(() => engineerService.recordWork(engineerId, Number(workAmount), workDescription, notes))} className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Record work</button>
        </div>
      </section>
    </div>

    {message && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>}
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Record rule:</strong> staff can add collections, returns and work. They cannot delete, edit, receive engineer payments, change opening balances, or manage engineer accounts.</div>
  </div></AppLayout>;
}
