"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package, Smartphone, Cable, Headphones, BatteryCharging, Search, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryTable from "@/components/inventory/InventoryTable";
import PurchaseStockPanel from "@/components/inventory/PurchaseStockPanel";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

type Shelf = "all" | "parts" | "accessories";
type PartCategory = "Downboards" | "Charging Flex" | "Power Flex" | "Earpiece Flex" | "Back Glass" | "Other Phone Parts";

const PARTS: { name: PartCategory; icon: typeof Package; description: string; brands?: string[] }[] = [
  { name: "Downboards", icon: Smartphone, description: "Charging boards and lower boards", brands: ["Tecno","Infinix","itel","Samsung","Redmi","Nokia","Huawei","iPhone","Other"] },
  { name: "Charging Flex", icon: Cable, description: "Charging and USB flex cables", brands: ["Tecno","Infinix","itel","Samsung","Redmi","Nokia","iPhone","Other"] },
  { name: "Power Flex", icon: BatteryCharging, description: "Power and side-button flexes", brands: ["Tecno","Infinix","itel","Samsung","Redmi","Nokia","iPhone","Other"] },
  { name: "Earpiece Flex", icon: Headphones, description: "Earpiece and speaker flexes", brands: ["Tecno","Infinix","itel","Samsung","Redmi","Nokia","iPhone","Other"] },
  { name: "Back Glass", icon: Smartphone, description: "Phone back glass and covers", brands: ["iPhone","Samsung","Tecno","Infinix","Redmi","Other"] },
  { name: "Other Phone Parts", icon: Package, description: "Other repair parts" },
];

const ACCESSORIES = ["Chargers","Cables","Earphones","Headsets","Power Banks","Speakers","Screen Protectors","Other Accessories"];

function groupFor(item: InventoryItem): Shelf {
  return item.item_type === "part" || item.category === "Phone Parts" ? "parts" : "accessories";
}
function stockState(item: InventoryItem) {
  if (Number(item.quantity) === 0) return "out";
  if (Number(item.quantity) <= Number(item.minimum_stock)) return "low";
  return "ok";
}
function money(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [shelf, setShelf] = useState<Shelf>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all"|"ok"|"low"|"out">("all");

  useEffect(() => {
    inventoryService.getInventory().then(({ data, error }) => {
      if (!error) setItems((data || []) as InventoryItem[]);
    });
  }, [refreshKey]);

  const parts = items.filter(i => groupFor(i) === "parts");
  const accessories = items.filter(i => groupFor(i) === "accessories");
  const low = items.filter(i => stockState(i) === "low");
  const out = items.filter(i => stockState(i) === "out");
  const stockValue = items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.cost_price || 0), 0);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(item => {
      const text = `${item.item_name} ${item.brand || ""} ${item.compatible_models || ""} ${item.sku || ""} ${item.subcategory || ""} ${item.category || ""}`.toLowerCase();
      return (!needle || text.includes(needle))
        && (shelf === "all" || groupFor(item) === shelf)
        && (!category || item.subcategory === category || item.category === category)
        && (!brand || (item.brand || "").toLowerCase() === brand.toLowerCase())
        && (stockFilter === "all" || stockState(item) === stockFilter);
    });
  }, [items, shelf, category, brand, query, stockFilter]);

  function resetNavigation() {
    setShelf("all"); setCategory(null); setBrand(null); setStockFilter("all"); setQuery("");
  }
  function refresh() { setRefreshKey(v => v + 1); }

  const currentPart = PARTS.find(p => p.name === category);
  const accessoryCategory = ACCESSORIES.includes(category || "") ? category : null;

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B3D91]">Stock Center</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#102A43]">Inventory</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#62788F]">One place for every product, phone part, quantity and stock movement.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory/import" className="inline-flex min-h-10 items-center rounded-xl bg-[#0B3D91] px-4 text-sm font-bold text-white">Import items</Link>
            <Link href="/inventory/movements" className="inline-flex min-h-10 items-center rounded-xl border border-[#CFE3F2] bg-white px-4 text-sm font-semibold text-[#29445F]">Stock history</Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard title="All stock" value={items.length} detail="Products in catalogue" active={shelf === "all" && !category} onClick={resetNavigation} />
          <SummaryCard title="Phone parts" value={parts.length} detail="Repair parts" active={shelf === "parts"} onClick={() => { setShelf("parts"); setCategory(null); setBrand(null); }} />
          <SummaryCard title="Accessories" value={accessories.length} detail="Shop accessories" active={shelf === "accessories"} onClick={() => { setShelf("accessories"); setCategory(null); setBrand(null); }} />
          <SummaryCard title="Low stock" value={low.length} detail="At reorder level" tone="amber" onClick={() => { setStockFilter("low"); setCategory(null); setBrand(null); }} />
          <div className="rounded-2xl border border-[#CFE3F2] bg-[#0B3D91] p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7FE7D6]">Stock at cost</p>
            <p className="mt-2 font-heading text-xl font-bold">{money(stockValue)}</p>
            <p className="mt-1 text-[11px] text-[#c7d8d2]">Current stock value</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#CFE3F2] bg-white p-5 shadow-[0_10px_28px_rgba(11,61,145,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B3D91]">Browse stock</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-[#102A43]">
                {category ? category : shelf === "parts" ? "Phone Parts" : shelf === "accessories" ? "Accessories" : "All Stock"}
              </h2>
            </div>
            {(shelf !== "all" || category || brand || stockFilter !== "all") && (
              <button type="button" onClick={resetNavigation} className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3D91]"><ArrowLeft className="size-3.5" /> Start over</button>
            )}
          </div>

          {shelf === "all" && !category ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ShelfCard title="Phone Parts" count={parts.length} description="Downboards, flexes, back glass and repair parts" icon={Smartphone} onClick={() => { setShelf("parts"); setCategory(null); }} />
              <ShelfCard title="Accessories" count={accessories.length} description="Chargers, cables, earphones and other shop goods" icon={Package} onClick={() => { setShelf("accessories"); setCategory(null); }} />
            </div>
          ) : shelf === "parts" && !category ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PARTS.map(({ name, icon: Icon, description }) => (
                <CategoryCard key={name} label={name} count={parts.filter(i => i.subcategory === name).length} description={description} icon={Icon} onClick={() => { setCategory(name); setBrand(null); }} />
              ))}
            </div>
          ) : shelf === "accessories" && !category ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ACCESSORIES.map(name => (
                <CategoryCard key={name} label={name} count={accessories.filter(i => i.subcategory === name || i.category === name).length} description="Browse this stock shelf" icon={Package} onClick={() => setCategory(name)} />
              ))}
            </div>
          ) : category && (currentPart || accessoryCategory) ? (
            <div className="mt-5">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#62788F]">
                <button type="button" onClick={() => { setCategory(null); setBrand(null); }} className="font-bold text-[#0B3D91]">{currentPart ? "Phone Parts" : "Accessories"}</button>
                <ChevronRight className="size-3" /> <span>{category}</span>
              </div>
              {currentPart?.brands && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {currentPart.brands.map(b => (
                    <CategoryCard key={b} label={b} count={parts.filter(i => i.subcategory === category && (i.brand || "").toLowerCase() === b.toLowerCase()).length} description="View brand stock" icon={Smartphone} onClick={() => setBrand(b === "Other" ? null : b)} active={brand === b} />
                  ))}
                </div>
              )}
              {accessoryCategory && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-[#CFE3F2] bg-[#E8F6FF] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B3D91]">Shelf</p>
                    <p className="mt-2 text-lg font-bold text-[#102A43]">{accessoryCategory}</p>
                    <p className="mt-1 text-sm text-[#62788F]">Products currently grouped in this accessory category.</p>
                    <p className="mt-4 text-2xl font-bold text-[#0B3D91]">{accessories.filter(i => i.subcategory === accessoryCategory || i.category === accessoryCategory).length}</p>
                    <p className="text-xs text-[#62788F]">items</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[#CFE3F2] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b9892]" />
              <input aria-label="Search inventory" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search product, model, brand or SKU..." className="h-11 w-full rounded-xl border border-[#CFE3F2] pl-10 pr-3 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/10" />
            </div>
            <select aria-label="Stock status" value={stockFilter} onChange={e => setStockFilter(e.target.value as typeof stockFilter)} className="h-11 rounded-xl border border-[#CFE3F2] bg-white px-3 text-sm">
              <option value="all">All stock</option><option value="ok">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option>
            </select>
            <button type="button" onClick={() => setStockFilter("out")} className="h-11 rounded-xl border border-[#CFE3F2] bg-white px-3 text-sm font-semibold text-[#29445F]">Show empty stock ({out.length})</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#62788F]">
            <span><strong className="text-[#102A43]">{visibleItems.length}</strong> items shown</span>
            {category && <span>Category: <strong className="text-[#29445F]">{category}</strong></span>}
            {brand && <span>Brand: <strong className="text-[#29445F]">{brand}</strong></span>}
            {(query || category || brand || stockFilter !== "all") && <button type="button" onClick={() => { setQuery(""); setCategory(null); setBrand(null); setStockFilter("all"); }} className="font-bold text-[#0B3D91]">Clear filters</button>}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <InventoryForm editingItem={editingItem} onSaved={() => { setEditingItem(null); refresh(); }} onCancelEdit={() => setEditingItem(null)} />
          <PurchaseStockPanel items={items} onSaved={refresh} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#CFE3F2] bg-white shadow-[0_10px_28px_rgba(11,61,145,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0ed] px-5 py-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B3D91]">Stock records</p><h2 className="mt-1 font-heading text-lg font-bold text-[#102A43]">Products</h2></div>
            {category && <span className="rounded-full bg-[#EAF7FF] px-3 py-1 text-xs font-semibold text-[#0B3D91]">{category}{brand ? ` · ${brand}` : ""}</span>}
          </div>
          <InventoryTable refreshKey={refreshKey} onEdit={setEditingItem} itemsOverride={visibleItems} embedded />
        </section>
      </main>
    </AppLayout>
  );
}

function SummaryCard({ title, value, detail, active, tone, onClick }: { title:string; value:number; detail:string; active?:boolean; tone?: "amber"; onClick:()=>void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-[#0B3D91] bg-[#EAF7FF]" : "border-[#CFE3F2] bg-white"}`}>
    <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone === "amber" ? "bg-[#E8F6FF] text-[#0B3D91]" : "bg-[#EAF7FF] text-[#0B3D91]"}`}>{title}</span>
    <p className="mt-3 font-heading text-2xl font-bold text-[#102A43]">{value}</p><p className="mt-1 text-[11px] text-[#62788F]">{detail}</p>
  </button>;
}
function ShelfCard({ title, count, description, icon: Icon, onClick }: { title:string; count:number; description:string; icon:typeof Package; onClick:()=>void }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-[#e1e8e3] bg-[#FAFDFF] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#0B3D91] hover:shadow-md">
    <div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-[#EAF7FF] text-[#0B3D91]"><Icon className="size-5" /></span><ChevronRight className="size-5 text-[#9aa8a2] transition group-hover:translate-x-1 group-hover:text-[#0B3D91]" /></div>
    <h3 className="mt-5 text-lg font-bold text-[#102A43]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#62788F]">{description}</p><p className="mt-4 text-xs font-bold text-[#0B3D91]">{count} items · Open shelf</p>
  </button>;
}
function CategoryCard({ label, count, description, icon: Icon, onClick, active }: { label:string; count:number; description:string; icon:typeof Package; onClick:()=>void; active?:boolean }) {
  return <button type="button" onClick={onClick} className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#0B3D91] hover:shadow-sm ${active ? "border-[#0B3D91] bg-[#EAF7FF] ring-2 ring-[#0B3D91]/10" : "border-[#e4e9e5] bg-[#FAFDFF]"}`}>
    <div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-white text-[#0B3D91] ring-1 ring-[#e4e9e5]"><Icon className="size-4" /></span><ChevronRight className="size-4 text-[#9aa8a2] group-hover:text-[#0B3D91]" /></div>
    <p className="mt-3 text-sm font-bold text-[#102A43]">{label}</p><p className="mt-1 text-xs text-[#62788F]">{description}</p><p className="mt-2 text-[11px] font-semibold text-[#0B3D91]">{count} {count === 1 ? "item" : "items"}</p>
  </button>;
}
