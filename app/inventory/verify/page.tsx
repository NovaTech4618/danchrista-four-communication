"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Search, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import InventoryImage from "@/components/inventory/InventoryImage";
import { inventoryService } from "@/services/inventoryService";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";
import type { InventoryItem } from "@/types/inventory";

type Filter = "all" | "unverified" | "verified";

function money(value: string | number | null | undefined) {
  return `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export default function PhysicalVerificationPage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("unverified");
  const [section, setSection] = useState<"all" | "Phone Parts" | "Accessories">("all");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: roleData }, { data }] = await Promise.all([
      staffService.getMyRole(),
      inventoryService.getInventory(),
    ]);
    setRole(roleData);
    setItems((data || []) as InventoryItem[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const verified = items.filter(i => Boolean((i as InventoryItem & { physical_verified_at?: string | null }).physical_verified_at)).length;
    return { total: items.length, verified, remaining: items.length - verified };
  }, [items]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(item => {
      const verified = Boolean((item as InventoryItem & { physical_verified_at?: string | null }).physical_verified_at);
      const sectionMatch = section === "all"
        || (section === "Phone Parts" && item.category === "Phone Parts")
        || (section === "Accessories" && (item.category === "Accessories" || item.item_type === "accessory"));
      const filterMatch = filter === "all" || (filter === "verified" ? verified : !verified);
      const text = `${item.item_name} ${item.brand || ""} ${item.compatible_models || ""} ${item.subcategory || ""} ${item.sku || ""}`.toLowerCase();
      return sectionMatch && filterMatch && (!needle || text.includes(needle));
    });
  }, [items, query, filter, section]);

  if (role && role !== "owner") {
    return <AppLayout><main className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-800"><h1 className="font-bold">Owner access only</h1><p className="mt-1 text-sm">Physical stock verification changes the shop's stock ledger and prices.</p></div></main></AppLayout>;
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/inventory" className="inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]"><ArrowLeft className="size-3.5" /> Back to inventory</Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Amezing Limited · Stockroom</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Physical verification</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">Walk through the shop, count what is physically present, check the real cost and selling price, then mark each item verified. This does not create products.</p>
          </div>
          <div className="rounded-2xl border border-[#dfe6df] bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#74837e]">Progress</p>
            <p className="mt-1 text-2xl font-bold text-[#182a28]">{stats.verified} / {stats.total}</p>
            <p className="text-xs text-[#74837e]">{stats.remaining} still to verify</p>
          </div>
        </header>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-[#87958f]" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exact product, model, brand or SKU..." className="h-11 w-full rounded-xl border border-[#dfe6df] pl-9 pr-3 text-sm outline-none focus:border-[#1d6a54]" />
            </div>
            <select value={section} onChange={e => setSection(e.target.value as typeof section)} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm">
              <option value="all">All inventory</option>
              <option value="Phone Parts">Phone Parts</option>
              <option value="Accessories">Accessories</option>
            </select>
            <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm">
              <option value="unverified">Needs verification</option>
              <option value="verified">Already verified</option>
              <option value="all">Everything</option>
            </select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-bold text-amber-800">{stats.remaining} to check</span>
            <span className="rounded-full bg-[#eef4f1] px-3 py-1.5 font-bold text-[#1d6a54]">{stats.verified} verified</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">{visible.length} shown</span>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#d6dfda] bg-white px-5 py-14 text-center text-sm text-[#74837e]">Loading inventory...</div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d6dfda] bg-white px-5 py-14 text-center">
            <CheckCircle2 className="mx-auto size-8 text-[#1d6a54]" />
            <p className="mt-3 font-bold text-[#182a28]">{filter === "unverified" ? "Physical verification is complete for this view." : "No matching inventory."}</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map(item => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_5px_18px_rgba(18,59,52,0.05)]">
                <div className="flex h-32 items-center justify-center bg-[#f7f8f5]"><InventoryImage src={item.image_url} alt={item.item_name} size="md" /></div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-[#182a28]">{item.item_name}</h2>
                      <p className="mt-1 text-xs text-[#74837e]">{item.brand || "No brand"}{item.compatible_models ? ` · ${item.compatible_models}` : ""}</p>
                    </div>
                    {item.physical_verified_at && <CheckCircle2 className="size-4 shrink-0 text-[#1d6a54]" />}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    <span className="rounded-lg bg-slate-50 p-2"><b className="block text-[#182a28]">{item.quantity}</b>qty</span>
                    <span className="rounded-lg bg-slate-50 p-2"><b className="block text-[#182a28]">{money(item.cost_price)}</b>cost</span>
                    <span className="rounded-lg bg-slate-50 p-2"><b className="block text-[#182a28]">{money(item.selling_price)}</b>sell</span>
                  </div>
                  <button type="button" onClick={() => setSelected(item)} className="mt-3 w-full rounded-xl bg-[#1d6a54] px-4 py-2.5 text-xs font-bold text-white">{item.physical_verified_at ? "Review verification" : "Verify physical stock"}</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {selected && <VerificationModal item={selected} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load(); }} />}
      </main>
    </AppLayout>
  );
}

function VerificationModal({ item, onClose, onSaved }: { item: InventoryItem; onClose: () => void; onSaved: () => Promise<void> }) {
  const [quantity, setQuantity] = useState(String(item.quantity ?? 0));
  const [cost, setCost] = useState(String(item.cost_price ?? 0));
  const [selling, setSelling] = useState(String(item.selling_price ?? 0));
  const [floor, setFloor] = useState(String((item as InventoryItem & { minimum_selling_price?: number }).minimum_selling_price ?? item.selling_price ?? 0));
  const [minimum, setMinimum] = useState(String(item.minimum_stock ?? 0));
  const [notes, setNotes] = useState(item.physical_verification_note ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = Number(quantity), cp = Number(cost), sp = Number(selling), fp = Number(floor), min = Number(minimum);
    if (!Number.isInteger(q) || q < 0) return alert("Quantity must be a whole number, including 0.");
    if (!Number.isFinite(cp) || cp < 0) return alert("Enter a valid cost price.");
    if (!Number.isFinite(sp) || sp <= 0) return alert("Selling price must be greater than 0.");
    if (!Number.isFinite(fp) || fp < 0 || fp > sp) return alert("Minimum selling price must be between 0 and the selling price.");
    if (!Number.isInteger(min) || min < 0) return alert("Minimum stock must be a whole number.");
    setSaving(true);
    const { error } = await inventoryService.verifyInventoryItem(item.id, q, cp, sp, fp, min, notes);
    setSaving(false);
    if (error) return alert(error.message);
    await onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e5ebe6] bg-white p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Physical count</p>
            <h2 className="mt-1 text-xl font-bold text-[#182a28]">{item.item_name}</h2>
            <p className="mt-1 text-xs text-[#74837e]">{item.brand || "No brand"}{item.compatible_models ? ` · ${item.compatible_models}` : ""}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-[#74837e] hover:bg-slate-50"><X className="size-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><b>Count first.</b> Enter only what you physically confirm in the shop. Saving updates the stock ledger and marks this catalogue item as physically verified.</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Physical quantity" value={quantity} onChange={setQuantity} />
            <Field label="Real cost price" value={cost} onChange={setCost} />
            <Field label="Real selling price" value={selling} onChange={setSelling} />
            <Field label="Minimum selling price" value={floor} onChange={setFloor} />
            <Field label="Low-stock threshold" value={minimum} onChange={setMinimum} />
          </div>
          <label className="block"><span className="text-xs font-bold text-[#5b6d68]">Verification note (optional)</span><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Example: 4 pieces counted in glass shelf; price confirmed with boss." className="mt-1 w-full rounded-xl border border-[#dfe6df] p-3 text-sm outline-none focus:border-[#1d6a54]" /></label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#dfe6df] px-5 py-3 text-sm font-bold text-[#285c4d]">Cancel</button>
            <button disabled={saving} className="rounded-xl bg-[#1d6a54] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving verification..." : "Save physical verification"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-1"><span className="text-xs font-semibold text-[#5b6d68]">{label}</span><input type="number" min="0" step="0.01" value={value} onChange={e => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[#dfe6df] px-3 text-sm outline-none focus:border-[#1d6a54]" /></label>;
}
