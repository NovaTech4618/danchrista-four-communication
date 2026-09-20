"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BatteryCharging, Cable, ChevronRight, Headphones, Package, Search, Smartphone, Wrench } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import InventoryTable from "@/components/inventory/InventoryTable";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

type Shelf = "all" | "parts" | "accessories";
type StockFilter = "all" | "healthy" | "low" | "out";

const PART_GROUPS = [
  { name: "Displays", description: "LCD, OLED and replacement screens", matches: ["Displays"], icon: Smartphone },
  { name: "Charging & Power", description: "Downboards, charging flexes and power flexes", matches: ["Downboards", "Charging Flex", "Power Flex", "Charging", "Power"], icon: Cable },
  { name: "Audio", description: "Earpiece, speaker and audio flex parts", matches: ["Earpiece Flex", "Audio"], icon: Headphones },
  { name: "Housing & Glass", description: "Back glass, housings and covers", matches: ["Back Glass", "Housing", "Back Glass/Housing"], icon: Smartphone },
  { name: "Camera", description: "Camera modules and camera flex parts", matches: ["Camera"], icon: Smartphone },
  { name: "Batteries", description: "Replacement phone batteries", matches: ["Batteries", "Battery"], icon: BatteryCharging },
  { name: "Other Phone Parts", description: "Any workshop part outside the main shelves", matches: ["Other Phone Parts", "Other"], icon: Package },
] as const;

const ACCESSORY_GROUPS = [
  { name: "Charging", description: "Chargers, cables and charging accessories", matches: ["Chargers", "Cables"], icon: Cable },
  { name: "Audio", description: "Earphones, headsets and speakers", matches: ["Earphones", "Headsets", "Speakers"], icon: Headphones },
  { name: "Power", description: "Power banks and portable power", matches: ["Power Banks"], icon: BatteryCharging },
  { name: "Protection", description: "Screen protectors and phone protection", matches: ["Screen Protectors"], icon: Smartphone },
  { name: "Wearables", description: "Smartwatches and wearable gadgets", matches: ["Smartwatches"], icon: Package },
  { name: "Other Accessories", description: "Other counter goods", matches: ["Other Accessories", "Other"], icon: Package },
] as const;


function groupFor(item: InventoryItem): Shelf {
  return item.item_type === "part" || item.category === "Phone Parts" ? "parts" : "accessories";
}

function stateFor(item: InventoryItem): Exclude<StockFilter, "all"> {
  const quantity = Number(item.quantity || 0);
  if (quantity === 0) return "out";
  if (quantity <= Number(item.minimum_stock || 0)) return "low";
  return "healthy";
}
function matchesGroup(item: InventoryItem, matches: readonly string[]) {
  const value = (item.subcategory || item.category || "").toLowerCase();
  return matches.some(match => value === match.toLowerCase());
}

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export default function StockroomPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [shelf, setShelf] = useState<Shelf>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");

  useEffect(() => {
    let active = true;
    void inventoryService.getInventory().then(({ data }) => {
      if (active) setItems((data || []) as InventoryItem[]);
    });
    return () => { active = false; };
  }, []);

  const parts = items.filter(item => groupFor(item) === "parts");
  const accessories = items.filter(item => groupFor(item) === "accessories");
  const low = items.filter(item => stateFor(item) === "low");
  const out = items.filter(item => stateFor(item) === "out");
  const stockValue = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.cost_price || 0), 0);

  const selectedGroup = [...PART_GROUPS, ...ACCESSORY_GROUPS].find(group => group.name === category);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(item => {
      const searchable = [item.item_name, item.brand, item.compatible_models, item.sku, item.subcategory, item.category].filter(Boolean).join(" ").toLowerCase();
      const categoryMatch = !selectedGroup || matchesGroup(item, selectedGroup.matches);
      const filterMatch = filter === "all" || stateFor(item) === filter;
      return (!needle || searchable.includes(needle)) && (shelf === "all" || groupFor(item) === shelf) && categoryMatch && filterMatch;
    });
  }, [items, shelf, selectedGroup, query, filter]);

  const title = category || (shelf === "parts" ? "Phone Parts" : shelf === "accessories" ? "Gadgets & Accessories" : "All Stock");

  function reset() {
    setShelf("all");
    setCategory(null);
    setQuery("");
    setFilter("all");
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/inventory" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]"><ArrowLeft className="size-3.5" /> Inventory</Link>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Workshop stockroom</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Inventory Stock</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">Browse the shop shelves the way you would in the physical stockroom.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/inventory/movements" className="inline-flex min-h-11 items-center rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-semibold text-[#285c4d]">Stock history</Link>
            <Link href="/inventory" className="inline-flex min-h-11 items-center rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white">Manage stock</Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="All items" value={items.length} onClick={() => reset()} />
          <Metric label="Phone parts" value={parts.length} active={shelf === "parts" && !category} onClick={() => { setShelf("parts"); setCategory(null); }} />
          <Metric label="Accessories" value={accessories.length} active={shelf === "accessories" && !category} onClick={() => { setShelf("accessories"); setCategory(null); }} />
          <Metric label="Low stock" value={low.length} tone="amber" onClick={() => { setFilter("low"); setCategory(null); }} />
          <div className="rounded-2xl border border-[#dfe6df] bg-[#123b34] p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d7a95a]">Stock at cost</p><p className="mt-2 font-heading text-xl font-bold">{money(stockValue)}</p><p className="mt-1 text-[11px] text-[#c7d8d2]">{out.length} currently empty</p></div>
        </section>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Shelf browser</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">{title}</h2></div>
            {(shelf !== "all" || category || filter !== "all") && <button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#1d6a54] hover:bg-[#eef4f1]"><ArrowLeft className="size-3.5" /> Reset</button>}
          </div>

          {!category && shelf === "all" && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Shelf title="Phone Parts" count={parts.length} description="Repair parts used by the workshop" icon={Wrench} onClick={() => setShelf("parts")} />
              <Shelf title="Gadgets & Accessories" count={accessories.length} description="Shop goods sold from the counter" icon={Package} onClick={() => setShelf("accessories")} />
            </div>
          )}

          {!category && shelf === "parts" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PART_GROUPS.map(({ name, description, icon: Icon, matches }) => <Category key={name} name={name} count={parts.filter(item => matchesGroup(item, matches)).length} description={description} icon={Icon} onClick={() => setCategory(name)} />)}
            </div>
          )}

          {!category && shelf === "accessories" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ACCESSORY_GROUPS.map(({ name, description, icon: Icon, matches }) => <Category key={name} name={name} count={accessories.filter(item => matchesGroup(item, matches)).length} description={description} icon={Icon} onClick={() => setCategory(name)} />)}
            </div>
          )}

          {category && (
            <div className="mt-5">
              <div className="mb-4 flex items-center gap-2 text-xs text-[#74837e]"><button type="button" onClick={() => setCategory(null)} className="font-bold text-[#1d6a54]">{shelf === "parts" ? "Phone Parts" : "Accessories"}</button><ChevronRight className="size-3.5" /><span>{category}</span></div>
              <div className="rounded-2xl bg-[#f7f8f5] p-4 text-sm text-[#53635d]">Showing <strong>{visible.length}</strong> stock item{visible.length === 1 ? "" : "s"} in this shelf. Use the search below to find a model or SKU.</div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5b6d68]" /><input aria-label="Search stockroom" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search product, model, brand or SKU..." className="h-11 w-full rounded-xl border border-[#dfe6df] pl-10 pr-3 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" /></div>
            <select aria-label="Stock filter" value={filter} onChange={event => setFilter(event.target.value as StockFilter)} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm"><option value="all">All stock</option><option value="healthy">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
            <button type="button" onClick={() => { setFilter("out"); setCategory(null); }} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-semibold text-[#285c4d]">Empty stock ({out.length})</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#74837e]"><span><strong className="text-[#182a28]">{visible.length}</strong> items shown</span>{category && <span>· {category}</span>}{query && <span>· “{query}”</span>}</div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
          <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Stock records</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">{title}</h2></div><span className="text-xs font-semibold text-[#74837e]">{visible.length} shown</span></div>
          <InventoryTable refreshKey={0} onEdit={() => {}} itemsOverride={visible} embedded showActions={false} />
        </section>
      </main>
    </AppLayout>
  );
}

function Metric({ label, value, onClick, active, tone }: { label: string; value: number; onClick: () => void; active?: boolean; tone?: "amber" }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-[#1d6a54] bg-[#eef4f1]" : "border-[#dfe6df] bg-white"}`}><span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone === "amber" ? "bg-[#fff8e9] text-[#8a641d]" : "bg-[#eef4f1] text-[#1d6a54]"}`}>{label}</span><p className="mt-3 font-heading text-2xl font-bold text-[#182a28]">{value}</p></button>;
}

function Shelf({ title, count, description, icon: Icon, onClick }: { title: string; count: number; description: string; icon: typeof Package; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-[#dfe6df] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#1d6a54] hover:shadow-md"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-5" /></span><ArrowRight className="size-5 text-[#9aa9a4] transition group-hover:translate-x-1 group-hover:text-[#1d6a54]" /></div><h3 className="mt-5 text-lg font-bold text-[#182a28]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#74837e]">{description}</p><p className="mt-4 text-xs font-bold text-[#1d6a54]">{count} items · Open shelf</p></button>;
}

function Category({ name, count, description, icon: Icon, onClick }: { name: string; count: number; description: string; icon: typeof Package; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-[#dfe6df] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#1d6a54] hover:shadow-sm"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-4" /></span><ChevronRight className="size-4 text-[#9aa9a4] group-hover:text-[#1d6a54]" /></div><p className="mt-3 text-sm font-bold text-[#182a28]">{name}</p><p className="mt-1 text-xs text-[#74837e]">{description}</p><p className="mt-2 text-[11px] font-semibold text-[#1d6a54]">{count} {count === 1 ? "item" : "items"}</p></button>;
}
