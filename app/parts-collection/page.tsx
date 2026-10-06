"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeft, CheckCircle2, ClipboardList, RotateCcw, Search, Undo2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import EngineerPartIssuePanel from "@/components/inventory/EngineerPartIssuePanel";
import { engineerService } from "@/services/engineerService";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

type Movement = {
  id: string;
  engineer_id: string;
  engineer_name: string;
  inventory_id: string;
  quantity: number;
  unit_price?: number | null;
  created_at: string;
  notes?: string | null;
  movement: "collected" | "returned" | "used" | "paid";
  return_condition?: "normal" | "faulty" | null;
  item?: { id: string; item_name: string; brand?: string | null; compatible_models?: string | null; subcategory?: string | null } | null;
};

function localDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function qty(rows: Movement[]) {
  return rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
}

function movementLabel(m: Movement["movement"]) {
  return m === "collected" ? "Collected" : m === "returned" ? "Returned" : m === "used" ? "Used" : "Paid";
}

export default function PartsCollectionPage() {
  const [date, setDate] = useState(localDate());
  const [movements, setMovements] = useState<Movement[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [engineerFilter, setEngineerFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<{ movement: Movement; type: "used" | "returned" } | null>(null);
  const [actionQty, setActionQty] = useState("1");
  const [actionNotes, setActionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const [movementResult, inventoryResult] = await Promise.all([
      engineerService.getTodayPartMovement(date),
      inventoryService.getInventory(),
    ]);
    setMovements((movementResult.data || []) as Movement[]);
    setItems((inventoryResult.data || []) as InventoryItem[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [date]);

  const engineers = useMemo(() => {
    const map = new Map<string, string>();
    movements.forEach((m) => map.set(m.engineer_id, m.engineer_name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [movements]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((m) => {
      const text = [m.engineer_name, m.item?.item_name, m.item?.brand, m.item?.compatible_models, m.item?.subcategory, m.notes].filter(Boolean).join(" ").toLowerCase();
      return (!q || text.includes(q)) && (engineerFilter === "all" || m.engineer_id === engineerFilter);
    });
  }, [movements, query, engineerFilter]);

  const collected = movements.filter((m) => m.movement === "collected");
  const returned = movements.filter((m) => m.movement === "returned");
  const used = movements.filter((m) => m.movement === "used");
  const paid = movements.filter((m) => m.movement === "paid");
  const stillOut = Math.max(0, qty(collected) - qty(returned) - qty(used) - qty(paid));

  async function saveAction() {
    if (!action) return;
    const quantity = Number(actionQty);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > Number(action.movement.quantity)) {
      setMessage("Enter a valid quantity.");
      return;
    }
    setSaving(true);
    setMessage("");
    const result = action.type === "used"
      ? await engineerService.recordPartUsed(action.movement.engineer_id, action.movement.inventory_id, quantity, actionNotes || null)
      : await engineerService.recordPartsIn(action.movement.engineer_id, action.movement.inventory_id, quantity, "normal", actionNotes || null);
    if (result.error) {
      setMessage(result.error.message || "Could not save this movement.");
    } else {
      setMessage(action.type === "used" ? "Marked as used." : "Marked as returned.");
      setAction(null);
      setActionNotes("");
      setActionQty("1");
      await load();
    }
    setSaving(false);
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-5">
        <header className="rounded-3xl border border-[#dfe6df] bg-white p-5 shadow-[0_12px_32px_rgba(18,59,52,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">
                <span className="grid size-7 place-items-center rounded-lg bg-[#eef4f1]"><ClipboardList className="size-4" /></span>
                Amezing Limited · Daily book
              </div>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#182a28] sm:text-4xl">Daily Parts Collection</h1>
              <p className="mt-1 max-w-3xl text-sm text-[#74837e]">This is the daily record of what engineers collect from the stockroom and what happens to each part afterwards.</p>
            </div>
            <label className="text-xs font-bold text-[#285c4d]">
              Record date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-semibold text-[#182a28] outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" />
            </label>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Collected" value={qty(collected)} icon={ArrowDownToLine} />
          <Stat label="Used" value={qty(used)} icon={CheckCircle2} />
          <Stat label="Returned" value={qty(returned)} icon={Undo2} />
          <Stat label="Still out" value={stillOut} icon={RotateCcw} warn={stillOut > 0} />
          <Stat label="Movements" value={movements.length} icon={ClipboardList} />
        </section>

        <section className="rounded-3xl border border-[#dfe6df] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Step 1</p>
              <h2 className="mt-1 text-xl font-bold text-[#182a28]">Record a collection</h2>
              <p className="mt-1 text-sm text-[#74837e]">Choose the engineer and exact part. The existing stock transaction reduces inventory and links the part to that engineer.</p>
            </div>
          </div>
          <div className="mt-4">
            <EngineerPartIssuePanel items={items} onSaved={load} />
          </div>
        </section>

        <section className="rounded-3xl border border-[#dfe6df] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Step 2</p>
              <h2 className="mt-1 text-xl font-bold text-[#182a28]">Today's movement record</h2>
              <p className="mt-1 text-sm text-[#74837e]">Every collection stays here until you record that it was used, returned or paid/closed.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#87958f]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search engineer or part..." className="h-10 rounded-xl border border-[#dfe6df] pl-9 pr-3 text-sm outline-none focus:border-[#1d6a54]" />
              </div>
              <select value={engineerFilter} onChange={(e) => setEngineerFilter(e.target.value)} className="h-10 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-semibold outline-none focus:border-[#1d6a54]">
                <option value="all">All engineers</option>
                {engineers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
          </div>

          {message && <div className="mt-4 rounded-xl border border-[#d7a95a] bg-[#f6f1e9] px-4 py-3 text-sm font-semibold text-[#285c4d]">{message}</div>}

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#e5ebe7]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[#f8faf8] text-[10px] font-bold uppercase tracking-[0.14em] text-[#74837e]">
                  <tr><th className="px-4 py-3 text-left">Time</th><th className="px-4 py-3 text-left">Engineer</th><th className="px-4 py-3 text-left">Part</th><th className="px-4 py-3 text-left">Qty</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-[#87958f]">Loading daily record...</td></tr> :
                  filtered.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-[#87958f]">No part movement recorded for this date.</td></tr> :
                  filtered.map((m) => (
                    <tr key={m.movement + m.id} className="border-t border-[#edf1ee]">
                      <td className="whitespace-nowrap px-4 py-3 text-[#74837e]">{new Date(m.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3 font-semibold text-[#182a28]">{m.engineer_name}</td>
                      <td className="px-4 py-3"><p className="font-semibold text-[#182a28]">{m.item?.item_name || "Unknown part"}</p><p className="text-xs text-[#87958f]">{[m.item?.brand, m.item?.compatible_models, m.item?.subcategory].filter(Boolean).join(" · ")}</p></td>
                      <td className="px-4 py-3 font-bold">{m.quantity}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${m.movement === "collected" ? "bg-amber-50 text-amber-700" : m.movement === "used" ? "bg-emerald-50 text-emerald-700" : m.movement === "returned" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"}`}>{movementLabel(m.movement)}</span></td>
                      <td className="px-4 py-3 text-right">{m.movement === "collected" && <div className="flex justify-end gap-2"><button type="button" onClick={() => { setAction({ movement: m, type: "used" }); setActionQty(String(m.quantity)); }} className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Used</button><button type="button" onClick={() => { setAction({ movement: m, type: "returned" }); setActionQty(String(m.quantity)); }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Return</button></div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {action && (
          <section className="rounded-3xl border border-[#d7a95a] bg-[#fffdf8] p-5 shadow-[0_12px_32px_rgba(18,59,52,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Update movement</p><h2 className="mt-1 text-xl font-bold text-[#182a28]">{action.type === "used" ? "Mark part as used" : "Record part return"}</h2><p className="mt-1 text-sm text-[#74837e]">{action.movement.engineer_name} · {action.movement.item?.item_name || "Part"} · collected qty {action.movement.quantity}</p></div>
              <button type="button" onClick={() => setAction(null)} className="self-start rounded-lg px-3 py-2 text-sm font-bold text-[#74837e] hover:bg-white">Cancel</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
              <input type="number" min="1" max={action.movement.quantity} value={actionQty} onChange={(e) => setActionQty(e.target.value)} className="h-11 rounded-xl border border-[#dfe6df] px-3 text-sm font-semibold" />
              <input value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Optional note" className="h-11 rounded-xl border border-[#dfe6df] px-3 text-sm" />
              <button type="button" disabled={saving} onClick={() => void saveAction()} className="h-11 rounded-xl bg-[#1d6a54] px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving..." : action.type === "used" ? "Confirm used" : "Confirm returned"}</button>
            </div>
          </section>
        )}
      </main>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon, warn = false }: { label: string; value: number; icon: typeof ClipboardList; warn?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${warn ? "border-amber-200 bg-amber-50" : "border-[#dfe6df] bg-white"}`}><div className="flex items-center gap-2 text-xs font-bold text-[#74837e]"><Icon className="size-4 text-[#1d6a54]" />{label}</div><p className="mt-2 text-2xl font-bold text-[#182a28]">{value}</p></div>;
}
