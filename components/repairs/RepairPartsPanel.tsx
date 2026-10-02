"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { repairPartsService } from "@/services/repairPartsService";
import { inventoryService } from "@/services/inventoryService";
import type { RepairPartUsage } from "@/types/repairParts";
import type { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PackageCheck } from "lucide-react";

function money(value: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value); }

export default function RepairPartsPanel({ repairId }: { repairId: string }) {
  const [usage, setUsage] = useState<RepairPartUsage[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  async function load() {
    const [usageResult, inventoryResult] = await Promise.all([repairPartsService.getUsage(repairId), inventoryService.getInventory()]);
    if (usageResult.error) toast.error("Failed to load repair parts.");
    if (inventoryResult.error) toast.error("Failed to load inventory.");
    setUsage(usageResult.data || []);
    setInventory((inventoryResult.data || []) as InventoryItem[]);
  }

  useEffect(() => { void load(); }, [repairId]);
  const parts = useMemo(() => inventory.filter((item) => item.is_active !== false && (item.item_type === "part" || String(item.category || "").toLowerCase().includes("part"))), [inventory]);
  const filteredParts = useMemo(() => { const q = search.trim().toLowerCase(); return parts.filter((item) => !q || [item.item_name, item.brand, item.compatible_models, item.sku].filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0, 60); }, [parts, search]);
  const selected = useMemo(() => inventory.find((item) => item.id === inventoryId), [inventory, inventoryId]);
  const totalCost = usage.reduce((sum, row) => sum + Math.max(row.quantity_used - row.quantity_returned, 0) * Number(row.unit_cost), 0);

  async function handleUse() {
    const qty = Number(quantity);
    if (!inventoryId || !Number.isInteger(qty) || qty <= 0) return toast.error("Select a part and enter a valid quantity.");
    if (selected && qty > selected.quantity) return toast.error("Not enough stock available.");
    setSaving(true);
    const { error } = await repairPartsService.recordUsage(repairId, inventoryId, qty, notes);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${qty} × ${selected?.item_name || "part"} issued to the assigned engineer.`);
    setInventoryId(""); setQuantity("1"); setNotes(""); await load();
  }

  async function handleReturn(row: RepairPartUsage) {
    const qty = Number(returnQty[row.id] || 0);
    const outstanding = row.quantity_used - row.quantity_returned;
    if (!Number.isInteger(qty) || qty <= 0 || qty > outstanding) return toast.error(`Enter a return quantity from 1 to ${outstanding}.`);
    setReturningId(row.id);
    const { error } = await repairPartsService.returnUsage(row.id, qty, "Unused part returned from repair");
    setReturningId(null);
    if (error) return toast.error(error.message);
    toast.success(`${qty} part${qty === 1 ? "" : "s"} returned to inventory and credited back to the engineer.`);
    setReturnQty((current) => ({ ...current, [row.id]: "" }));
    await load();
  }

  return <Card><CardHeader><CardTitle className="text-base sm:text-lg">Parts & engineer accountability</CardTitle></CardHeader><CardContent className="space-y-4">
    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs text-teal-800">Parts cannot be issued until an engineer is assigned. Every issue debits that engineer's account; every unused return credits it back.</div>
    <div className="space-y-3 rounded-2xl border bg-muted/20 p-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 pl-9" placeholder="Find a phone part..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">{filteredParts.map((item) => <button type="button" key={item.id} onClick={() => setInventoryId(item.id)} disabled={item.quantity <= 0} className={`rounded-xl border p-3 text-left transition hover:border-teal-300 hover:bg-teal-50 ${inventoryId === item.id ? "border-teal-500 bg-teal-50 ring-1 ring-teal-200" : "bg-background"} `}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.item_name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.brand || "Phone part"}{item.compatible_models ? ` · ${item.compatible_models}` : ""}</p></div><span className={item.quantity > 0 ? "rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700" : "rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700"}>{item.quantity} left</span></div></button>)}</div><div className="grid gap-3 sm:grid-cols-[100px_1fr_auto] sm:items-end"><label className="text-sm font-medium">Qty<Input className="mt-1" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label><label className="text-sm font-medium">Note<Input className="mt-1" placeholder="e.g. Charging repair" value={notes} onChange={(e) => setNotes(e.target.value)} /></label><Button onClick={handleUse} disabled={saving || !inventoryId}>{saving ? "Issuing..." : <><PackageCheck className="mr-2 size-4" /> Issue Part</>}</Button></div></div>
    {selected && <p className="text-xs text-muted-foreground">Current stock: <span className="font-medium text-foreground">{selected.quantity}</span> · Cost captured: {money(Number(selected.cost_price || 0))} each</p>}
    {usage.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No parts have been recorded for this repair.</p> : <div className="space-y-2">{usage.map((row) => { const outstanding = row.quantity_used - row.quantity_returned; return <div key={row.id} className="rounded-2xl border p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium">{row.inventory?.item_name || "Inventory item"}</p><p className="text-xs text-muted-foreground">Engineer linked · Used {row.quantity_used} · Returned {row.quantity_returned} · Cost {money(Number(row.unit_cost))}/unit</p></div><div className="text-sm font-semibold">{money(outstanding * Number(row.unit_cost))}</div></div>{outstanding > 0 && <div className="mt-3 flex gap-2 sm:justify-end"><Input className="w-24" type="number" min="1" max={outstanding} placeholder="Qty" value={returnQty[row.id] || ""} onChange={(e) => setReturnQty((current) => ({ ...current, [row.id]: e.target.value }))} /><Button size="sm" variant="secondary" onClick={() => handleReturn(row)} disabled={returningId === row.id}>{returningId === row.id ? "Returning..." : "Return"}</Button></div>}</div>; })}</div>}
    <div className="flex items-center justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">Current parts cost</span><span className="font-bold">{money(totalCost)}</span></div>
    <p className="text-xs text-muted-foreground">Inventory, repair COGS and engineer accountability are updated together by the secured database workflow.</p>
  </CardContent></Card>;
}
