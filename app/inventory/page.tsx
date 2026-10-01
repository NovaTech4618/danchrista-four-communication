"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package, Smartphone, Search, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryTable from "@/components/inventory/InventoryTable";
import PurchaseStockPanel from "@/components/inventory/PurchaseStockPanel";
import EngineerPartIssuePanel from "@/components/inventory/EngineerPartIssuePanel";
import OpeningStockPanel from "@/components/inventory/OpeningStockPanel";
import { inventoryService } from "@/services/inventoryService";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";
import type { InventoryItem } from "@/types/inventory";

const ANDROID_BRANDS = ["itel", "Infinix", "Tecno", "Redmi", "Huawei", "Oppo", "Vivo", "Gionee", "Nokia"];
const PHONE_PARTS: Record<string, string[]> = {
  iPhone: ["Charging Flex", "Earpiece Flex", "Back Glass"],
  Samsung: ["Down Board", "Power Flex"],
  ...Object.fromEntries(ANDROID_BRANDS.map(brand => [brand, ["Down Board", "Power Flex"]])),
};

type StockFilter = "all" | "ok" | "low" | "out";

function isPhonePart(item: InventoryItem) {
  const brand = item.brand;
  const partTypes = brand ? PHONE_PARTS[brand] : undefined;
  return item.category === "Phone Parts" && Boolean(partTypes) && partTypes.includes(item.subcategory || "");
}
function stockState(item: InventoryItem): "ok" | "low" | "out" {
  if (Number(item.quantity) === 0) return "out";
  if (Number(item.quantity) <= Number(item.minimum_stock)) return "low";
  return "ok";
}
function money(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}
function familyFor(brand: string | null) {
  if (!brand) return null;
  if (brand === "iPhone") return "iPhone";
  if (brand === "Samsung") return "Samsung";
  if (ANDROID_BRANDS.includes(brand)) return "Android";
  return null;
}

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const isOwner = myRole === "owner";
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [family, setFamily] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [partType, setPartType] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  useEffect(() => {
    void staffService.getMyRole().then(({ data }) => setMyRole(data));
    inventoryService.getInventory().then(({ data, error }) => {
      if (!error) setItems((data || []) as InventoryItem[]);
    });
  }, [refreshKey]);

  const parts = items.filter(isPhonePart);
  const low = parts.filter(i => stockState(i) === "low");
  const out = parts.filter(i => stockState(i) === "out");
  const stockValue = parts.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.cost_price || 0), 0);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return parts.filter(item => {
      const text = `${item.item_name} ${item.brand || ""} ${item.compatible_models || ""} ${item.sku || ""} ${item.subcategory || ""}`.toLowerCase();
      const itemFamily = familyFor(item.brand);
      return (!needle || text.includes(needle))
        && (!family || itemFamily === family)
        && (!brand || item.brand === brand)
        && (!partType || item.subcategory === partType)
        && (stockFilter === "all" || stockState(item) === stockFilter);
    });
  }, [parts, family, brand, partType, query, stockFilter]);

  function resetNavigation() {
    setFamily(null); setBrand(null); setPartType(null); setStockFilter("all"); setQuery("");
  }
  function refresh() { setRefreshKey(v => v + 1); }
  const selectedBrandParts = brand ? (PHONE_PARTS[brand] || []) : [];

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Shop stock</p><h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Phone Parts</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">Browse parts by phone brand, then part type and exact model.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/inventory/stockroom" className="inline-flex min-h-10 items-center rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-bold text-[#285c4d]">Stockroom</Link>{isOwner && <Link href="/inventory/import" className="inline-flex min-h-10 items-center rounded-xl bg-[#1d6a54] px-4 text-sm font-bold text-white">Import items</Link>}{isOwner && <Link href="/inventory/movements" className="inline-flex min-h-10 items-center rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-semibold text-[#285c4d]">Stock history</Link>}</div>
        </header>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="All parts" value={parts.length} detail="Phone repair parts" active={!family} onClick={resetNavigation} />
          <SummaryCard title="iPhone" value={parts.filter(i => i.brand === "iPhone").length} detail="Charging · earpiece · back glass" onClick={() => { setFamily("iPhone"); setBrand(null); setPartType(null); }} />
          <SummaryCard title="Samsung" value={parts.filter(i => i.brand === "Samsung").length} detail="Down board · power flex" onClick={() => { setFamily("Samsung"); setBrand("Samsung"); setPartType(null); }} />
          <SummaryCard title="Android" value={parts.filter(i => ANDROID_BRANDS.includes(i.brand || "")).length} detail="itel · Infinix · Tecno · Redmi and more" onClick={() => { setFamily("Android"); setBrand(null); setPartType(null); }} />
          {isOwner && <div className="rounded-2xl border border-[#dfe6df] bg-[#1d6a54] p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d7a95a]">Stock at cost</p><p className="mt-2 font-heading text-xl font-bold">{money(stockValue)}</p><p className="mt-1 text-[11px] text-[#c7d8d2]">Current phone-parts value</p></div>}
        </section>
        <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_10px_28px_rgba(18,59,52,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Browse</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">{family || "Phone Parts"}{brand && family === "Android" ? ` · ${brand}` : ""}{partType ? ` · ${partType}` : ""}</h2></div>{(family || brand || partType || stockFilter !== "all") && <button type="button" onClick={resetNavigation} className="inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]"><ArrowLeft className="size-3.5" /> Start over</button>}</div>
          {!family ? <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <CategoryCard label="iPhone" count={parts.filter(i => i.brand === "iPhone").length} description="Charging flex, earpiece flex and back glass" icon={Smartphone} onClick={() => setFamily("iPhone")} />
            <CategoryCard label="Samsung" count={parts.filter(i => i.brand === "Samsung").length} description="Down board and power flex" icon={Smartphone} onClick={() => { setFamily("Samsung"); setBrand("Samsung"); }} />
            <CategoryCard label="Android" count={parts.filter(i => ANDROID_BRANDS.includes(i.brand || "")).length} description="itel, Infinix, Tecno, Redmi, Huawei, Oppo, Vivo, Gionee, Nokia" icon={Package} onClick={() => setFamily("Android")} />
          </div> : family === "Android" && !brand ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{ANDROID_BRANDS.map(b => <CategoryCard key={b} label={b} count={parts.filter(i => i.brand === b).length} description="Down board · Power flex" icon={Smartphone} onClick={() => setBrand(b)} />)}</div> : <div className="mt-5">
            {family === "iPhone" && !partType && <div className="grid gap-3 sm:grid-cols-3">{PHONE_PARTS.iPhone.map(type => <CategoryCard key={type} label={type} count={parts.filter(i => i.brand === "iPhone" && i.subcategory === type).length} description="View exact models" icon={Package} onClick={() => { setBrand("iPhone"); setPartType(type); }} />)}</div>}
            {family === "Samsung" && !partType && <div className="grid gap-3 sm:grid-cols-2">{PHONE_PARTS.Samsung.map(type => <CategoryCard key={type} label={type} count={parts.filter(i => i.brand === "Samsung" && i.subcategory === type).length} description="View exact models" icon={Package} onClick={() => setPartType(type)} />)}</div>}
            {family === "Android" && brand && !partType && <div className="grid gap-3 sm:grid-cols-2">{selectedBrandParts.map(type => <CategoryCard key={type} label={type} count={parts.filter(i => i.brand === brand && i.subcategory === type).length} description="View exact models" icon={Package} onClick={() => setPartType(type)} />)}</div>}
            {partType && <div className="mb-2 flex items-center gap-2 text-xs text-[#74837e]"><span>{brand || family}</span><ChevronRight className="size-3" /><span>{partType}</span></div>}
          </div>}
        </section>
        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5b6d68]" /><input aria-label="Search phone parts" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search model, part, brand or SKU..." className="h-11 w-full rounded-xl border border-[#dfe6df] pl-10 pr-3 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" /></div><select aria-label="Stock status" value={stockFilter} onChange={e => setStockFilter(e.target.value as StockFilter)} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm"><option value="all">All stock</option><option value="ok">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option></select><button type="button" onClick={() => setStockFilter("out")} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-semibold text-[#285c4d]">Show empty stock ({out.length})</button></div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#74837e]"><span><strong className="text-[#182a28]">{visibleItems.length}</strong> items shown</span>{family && <span>Family: <strong className="text-[#285c4d]">{family}</strong></span>}{brand && <span>Brand: <strong className="text-[#285c4d]">{brand}</strong></span>}{partType && <span>Part: <strong className="text-[#285c4d]">{partType}</strong></span>}{low.length > 0 && <span>Low stock: <strong className="text-[#285c4d]">{low.length}</strong></span>}</div>
        </section>
        {isOwner && <OpeningStockPanel items={items} onSaved={refresh} />}
        {isOwner && <section className="grid gap-6 xl:grid-cols-2"><InventoryForm editingItem={editingItem} onSaved={() => { setEditingItem(null); refresh(); }} onCancelEdit={() => setEditingItem(null)} /><PurchaseStockPanel items={items} onSaved={refresh} /></section>}
        <EngineerPartIssuePanel items={items} onSaved={refresh} />
        <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe6df] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Stock records</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Phone parts</h2></div>{(brand || partType) && <span className="rounded-full bg-[#eef4f1] px-3 py-1 text-xs font-semibold text-[#1d6a54]">{brand || family}{partType ? ` · ${partType}` : ""}</span>}</div>
          <InventoryTable refreshKey={refreshKey} onEdit={setEditingItem} itemsOverride={visibleItems} embedded showActions={isOwner} />
        </section>
      </main>
    </AppLayout>
  );
}
function SummaryCard({ title, value, detail, active, onClick }: { title:string; value:number; detail:string; active?:boolean; onClick:()=>void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-[#1d6a54] bg-[#eef4f1]" : "border-[#dfe6df] bg-white"}`}><span className="inline-flex rounded-lg bg-[#eef4f1] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1d6a54]">{title}</span><p className="mt-3 font-heading text-2xl font-bold text-[#182a28]">{value}</p><p className="mt-1 text-[11px] text-[#74837e]">{detail}</p></button>;
}
function CategoryCard({ label, count, description, icon: Icon, onClick }: { label:string; count:number; description:string; icon:typeof Package; onClick:()=>void }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-[#dfe6df] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#1d6a54] hover:shadow-sm"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-4" /></span><ChevronRight className="size-4 text-[#9aa9a4] group-hover:text-[#1d6a54]" /></div><p className="mt-3 text-sm font-bold text-[#182a28]">{label}</p><p className="mt-1 text-xs leading-5 text-[#74837e]">{description}</p><p className="mt-2 text-[11px] font-semibold text-[#1d6a54]">{count} {count === 1 ? "item" : "items"}</p></button>;
}
