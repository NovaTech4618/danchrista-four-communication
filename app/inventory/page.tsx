"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cable, ChevronRight, Headphones, Package, Pencil, Smartphone } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import PurchaseStockPanel from "@/components/inventory/PurchaseStockPanel";
import EngineerPartIssuePanel from "@/components/inventory/EngineerPartIssuePanel";
import OpeningStockPanel from "@/components/inventory/OpeningStockPanel";
import InventoryImage from "@/components/inventory/InventoryImage";
import { inventoryService } from "@/services/inventoryService";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";
import type { InventoryItem } from "@/types/inventory";

const ANDROID_BRANDS = ["itel", "Infinix", "Tecno", "Redmi", "Huawei", "Oppo", "Vivo", "Gionee", "Nokia"];
const PHONE_PARTS: Record<string, string[]> = {
  iPhone: ["Charging Flex", "Earpiece Flex", "Back Glass", "Home Button"],
  Samsung: ["Down Board", "Power Flex"],
  ...Object.fromEntries(ANDROID_BRANDS.map((brand) => [brand, ["Down Board", "Power Flex"]])),
};

type Section = "Phone Parts";
type StockFilter = "all" | "ok" | "low" | "out";

function isPhonePart(item: InventoryItem) {
  const brand = item.brand;
  if (item.category !== "Phone Parts" || !brand) return false;
  const partTypes = PHONE_PARTS[brand];
  return Boolean(partTypes?.includes(item.subcategory || ""));
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
  if (brand === "iPhone") return "iPhone";
  if (brand === "Samsung") return "Samsung";
  if (brand && ANDROID_BRANDS.includes(brand)) return "Android";
  return null;
}

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [section, setSection] = useState<Section>("Phone Parts");
  const [family, setFamily] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [partType, setPartType] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const isOwner = myRole === "owner";

  useEffect(() => {
    void staffService.getMyRole().then(({ data }) => setMyRole(data));
    void inventoryService.getInventory().then(({ data, error }) => {
      if (!error) setItems((data || []) as InventoryItem[]);
    });
  }, [refreshKey]);

  const phoneParts = useMemo(() => items.filter(isPhonePart), [items]);
  const low = items.filter((item) => stockState(item) === "low");
  const stockValue = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.cost_price || 0), 0);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = phoneParts;
    return source.filter((item) => {
      const text = `${item.item_name} ${item.brand || ""} ${item.compatible_models || ""} ${item.sku || ""} ${item.subcategory || ""}`.toLowerCase();
      const family = familyFor(item.brand);
      return (!needle || text.includes(needle))
        && (section === "Phone Parts" ? (!family || family === familyFor(item.brand)) : true)
        && (!brand || item.brand === brand)
        && (!partType || item.subcategory === partType)
        && (stockFilter === "all" || stockState(item) === stockFilter);
    });
  }, [section, phoneParts, query, family, brand, partType, stockFilter]);

  const phoneModels = useMemo(() => {
    if (!partType) return [];
    return Array.from(new Set(phoneParts
      .filter((item) => item.brand === brand && item.subcategory === partType)
      .map((item) => item.compatible_models)
      .filter((model): model is string => Boolean(model)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [phoneParts, brand, partType]);

  function refresh() { setRefreshKey((value) => value + 1); }
  function startOver() {
    setFamily(null); setBrand(null); setPartType(null); setQuery(""); setStockFilter("all");
  }



  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Amezing Limited</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Inventory</h1>
            <p className="mt-1 text-sm text-[#74837e]">Tap the section, then tap your way to the exact item.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory/stockroom" className="inline-flex min-h-10 items-center rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-bold text-[#285c4d]">Stockroom</Link>
            {isOwner && <Link href="/inventory/import" className="inline-flex min-h-10 items-center rounded-xl bg-[#1d6a54] px-4 text-sm font-bold text-white">Import</Link>}
            {isOwner && <Link href="/inventory/movements" className="inline-flex min-h-10 items-center rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-semibold text-[#285c4d]">Stock history</Link>}
          </div>
        </header>



        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Browse</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">
                {section === "Phone Parts" ? (partType ? `${brand || family || ""} · ${partType}` : family || "Phone Parts")}
              </h2>
            </div>
            {(family || brand || partType || query || stockFilter !== "all") && (
              <button type="button" onClick={startOver} className="inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]"><ArrowLeft className="size-3.5" /> Start over</button>
            )}
          </div>

          {section === "Phone Parts" && !family && !partType && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <BrowseCard label="iPhone" description="Charging Flex · Earpiece Flex · Back Glass · Home Button" icon={Smartphone} count={phoneParts.filter((i) => i.brand === "iPhone").length} onClick={() => { setFamily("iPhone"); setBrand("iPhone"); }} />
              <BrowseCard label="Samsung" description="Down Board · Power Flex" icon={Smartphone} count={phoneParts.filter((i) => i.brand === "Samsung").length} onClick={() => { setFamily("Samsung"); setBrand("Samsung"); }} />
              <BrowseCard label="Android" description="itel · Infinix · Tecno · Redmi · Huawei · Oppo · Vivo · Gionee · Nokia" icon={Package} count={phoneParts.filter((i) => ANDROID_BRANDS.includes(i.brand || "")).length} onClick={() => { setFamily("Android"); setBrand(null); }} />
            </div>
          )}

          {section === "Phone Parts" && family === "Android" && !brand && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {ANDROID_BRANDS.map((value) => <BrowseCard key={value} label={value} description="Down Board · Power Flex" icon={Smartphone} count={phoneParts.filter((i) => i.brand === value).length} onClick={() => setBrand(value)} />)}
            </div>
          )}

          {section === "Phone Parts" && family && brand && !partType && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(PHONE_PARTS[brand] || []).map((type) => <BrowseCard key={type} label={type} description="Tap to see exact models" icon={type === "Charging Flex" ? Cable : type === "Earpiece Flex" ? Headphones : Package} count={phoneParts.filter((i) => i.brand === brand && i.subcategory === type).length} onClick={() => setPartType(type)} />)}
            </div>
          )}

          {section === "Phone Parts" && partType && (
            <div className="mt-5">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#74837e]">
                <button type="button" className="font-bold text-[#1d6a54]" onClick={() => { setFamily(null); setBrand(null); setPartType(null); }}>Phone Parts</button>
                <ChevronRight className="size-3" /><span>{brand}</span><ChevronRight className="size-3" /><span>{partType}</span>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {phoneModels.map((model) => {
                  const modelItems = phoneParts.filter((item) => item.brand === brand && item.subcategory === partType && item.compatible_models === model);
                  return <ModelCard key={model} model={model} items={modelItems} isOwner={isOwner} onEdit={setEditingItem} />;
                })}
              </div>
              {!phoneModels.length && <EmptyState text="No exact models have been added for this part yet. Use Add inventory below." />}
            </div>
          )}


        </section>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input aria-label="Search inventory" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search item, model, brand or SKU..." className="h-11 flex-1 rounded-xl border border-[#dfe6df] px-3 text-sm outline-none focus:border-[#1d6a54]" />
            <select aria-label="Stock status" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as StockFilter)} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm"><option value="all">All stock</option><option value="ok">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
          </div>
          <p className="mt-3 text-xs text-[#74837e]">{visibleItems.length} item{visibleItems.length === 1 ? "" : "s"} shown · {low.length} low stock across the shop</p>
        </section>

        {section === "Phone Parts" && partType && visibleItems.length > 0 && (
          <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item) => <InventoryCard key={item.id} item={item} isOwner={isOwner} onEdit={setEditingItem} />)}
          </section>
        )}



        {((section === "Phone Parts" && partType) || (section === "Accessories" && accessoryGroup)) && !visibleItems.length && <EmptyState text="No matching stock. Try another item or add it below." />}

        {isOwner && <OpeningStockPanel items={items} onSaved={refresh} />}
        {isOwner && <section className="grid gap-6 xl:grid-cols-2"><InventoryForm editingItem={editingItem} onSaved={() => { setEditingItem(null); refresh(); }} onCancelEdit={() => setEditingItem(null)} /><PurchaseStockPanel items={items} onSaved={refresh} /></section>}
        <EngineerPartIssuePanel items={items} onSaved={refresh} />
      </main>
    </AppLayout>
  );
}

function SectionCard({ active, icon: Icon, title, count, description, onClick }: { active:boolean; icon:typeof Package; title:string; count:number; description:string; onClick:()=>void }) {
  return <button type="button" onClick={onClick} className={`group rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#1d6a54] bg-[#eef4f1] ring-2 ring-[#1d6a54]/10" : "border-[#dfe6df] bg-white"}`}>
    <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-white text-[#1d6a54] ring-1 ring-[#dfe6df]"><Icon className="size-5" /></span><ChevronRight className="size-5 text-[#87958f] group-hover:text-[#1d6a54]" /></div>
    <p className="mt-5 text-lg font-bold text-[#182a28]">{title}</p><p className="mt-1 text-sm text-[#74837e]">{description}</p><p className="mt-4 text-xs font-bold text-[#1d6a54]">{count} items</p>
  </button>;
}

function BrowseCard({ label, description, icon: Icon, count, onClick }: { label:string; description:string; icon:typeof Package; count:number; onClick:()=>void }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-[#dfe6df] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#1d6a54] hover:shadow-md">
    <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-5" /></span><ChevronRight className="size-4 text-[#87958f] group-hover:text-[#1d6a54]" /></div>
    <p className="mt-4 text-sm font-bold text-[#182a28]">{label}</p><p className="mt-1 text-xs leading-5 text-[#74837e]">{description}</p><p className="mt-3 text-[11px] font-semibold text-[#1d6a54]">{count} items</p>
  </button>;
}

function ModelCard({ model, items, isOwner, onEdit }: { model:string; items:InventoryItem[]; isOwner:boolean; onEdit:(item:InventoryItem)=>void }) {
  const total = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return <div className="rounded-2xl border border-[#dfe6df] bg-white p-3">
    <div className="flex h-24 items-center justify-center rounded-xl bg-[#f7f8f5]">
      <InventoryImage src={items.find((item) => item.image_url)?.image_url || null} alt={model} size="md" />
    </div>
    <p className="mt-3 truncate text-sm font-bold text-[#182a28]">{model}</p>
    <p className="mt-1 text-[11px] text-[#74837e]">{total} in stock · {items.length} variant{items.length === 1 ? "" : "s"}</p>
    {isOwner && items[0] && <button type="button" onClick={() => onEdit(items[0])} className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#1d6a54]"><Pencil className="size-3" /> Edit</button>}
  </div>;
}

function InventoryCard({ item, isOwner, onEdit }: { item:InventoryItem; isOwner:boolean; onEdit:(item:InventoryItem)=>void }) {
  const state = stockState(item);
  return <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_5px_18px_rgba(18,59,52,0.05)]">
    <div className="flex h-40 items-center justify-center bg-[#f7f8f5]"><InventoryImage src={item.image_url} alt={item.item_name} size="md" /></div>
    <div className="p-4">
      <p className="text-sm font-bold text-[#182a28]">{item.item_name}</p>
      <p className="mt-1 text-xs text-[#74837e]">{item.brand || "Phone part"}{item.compatible_models ? ` · ${item.compatible_models}` : ""}</p>
      <div className="mt-3 flex items-end justify-between gap-2"><div><p className="text-[11px] text-[#74837e]">Selling</p><p className="font-heading text-lg font-bold text-[#182a28]">{money(item.selling_price)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${state === "out" ? "bg-red-50 text-red-700" : state === "low" ? "bg-amber-50 text-amber-700" : "bg-[#eef4f1] text-[#1d6a54]"}`}>{item.quantity} in stock</span></div>
      {isOwner && <button type="button" onClick={() => onEdit(item)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-[#dfe6df] py-2 text-xs font-bold text-[#285c4d]"><Pencil className="size-3.5" /> Edit item</button>}
    </div>
  </article>;
}

function EmptyState({ text }: { text:string }) {
  return <div className="rounded-2xl border border-dashed border-[#d6dfda] bg-white px-5 py-10 text-center text-sm text-[#74837e]">{text}</div>;
}
