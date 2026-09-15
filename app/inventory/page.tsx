"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryTable from "@/components/inventory/InventoryTable";
import ReceiveStockPanel from "@/components/inventory/ReceiveStockPanel";
import TransferStockPanel from "@/components/inventory/TransferStockPanel";
import PurchaseStockPanel from "@/components/inventory/PurchaseStockPanel";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

const PART_SUBCATEGORIES = ["Displays", "Charging", "Power", "Audio", "Back Glass / Housing", "Camera", "Other Phone Parts"];
const GOODS_SUBCATEGORIES = ["Chargers", "Cables", "Earphones", "Headsets", "Power Banks", "Speakers", "Phone Accessories", "Other Gadgets & Accessories"];

function groupFor(item: InventoryItem) {
  return item.item_type === "part" || item.category === "Phone Parts" ? "parts" : "goods";
}

function stockState(item: InventoryItem) {
  if (item.quantity === 0) return "out";
  if (item.quantity <= item.minimum_stock) return "low";
  return "in";
}

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | "parts" | "goods">("all");
  const [subcategory, setSubcategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");

  useEffect(() => {
    inventoryService.getInventory().then(({ data, error }) => {
      if (error) return;
      setItems((data || []) as InventoryItem[]);
    });
  }, [refreshKey]);

  const subcategories = useMemo(() => {
    if (group === "parts") return PART_SUBCATEGORIES;
    if (group === "goods") return GOODS_SUBCATEGORIES;
    return [...new Set(items.map(i => i.subcategory).filter(Boolean) as string[])].sort();
  }, [group, items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(item => {
      const itemGroup = groupFor(item);
      const text = `${item.item_name} ${item.brand || ""} ${item.compatible_models || ""} ${item.sku || ""} ${item.subcategory || ""} ${item.shelf_location || ""}`.toLowerCase();
      return (!needle || text.includes(needle)) &&
        (group === "all" || itemGroup === group) &&
        (subcategory === "all" || item.subcategory === subcategory) &&
        (stockFilter === "all" || stockState(item) === stockFilter);
    });
  }, [items, query, group, subcategory, stockFilter]);

  const parts = items.filter(i => groupFor(i) === "parts");
  const goods = items.filter(i => groupFor(i) === "goods");
  const low = items.filter(i => stockState(i) === "low");
  const out = items.filter(i => stockState(i) === "out");
  const saveRefresh = () => setRefreshKey(v => v + 1);

  function changeGroup(value: "all" | "parts" | "goods") {
    setGroup(value);
    setSubcategory("all");
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--novatech-primary)]">Workshop stockroom</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Inventory</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Find a part quickly, know where it is, and see what needs restocking.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory/import" className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Import catalog</Link>
            <Link href="/inventory/movements" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Stock movements</Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-4">
          <button onClick={() => changeGroup("parts")} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone parts</p><p className="mt-1 text-2xl font-bold text-slate-950">{parts.length}</p><p className="text-xs text-slate-500">Displays, charging, power, audio and more</p></button>
          <button onClick={() => changeGroup("goods")} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gadgets & accessories</p><p className="mt-1 text-2xl font-bold text-slate-950">{goods.length}</p><p className="text-xs text-slate-500">Retail goods and devices</p></button>
          <button onClick={() => setStockFilter("low")} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Low stock</p><p className="mt-1 text-2xl font-bold text-amber-700">{low.length}</p><p className="text-xs text-slate-500">At or below threshold</p></button>
          <button onClick={() => setStockFilter("out")} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Out of stock</p><p className="mt-1 text-2xl font-bold text-red-700">{out.length}</p><p className="text-xs text-slate-500">Nothing available now</p></button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="min-w-0 flex-1"><input aria-label="Search inventory" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, model, brand, part type, SKU or shelf..." className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--novatech-primary)] focus:ring-2 focus:ring-[var(--novatech-primary)]/15" /></div>
            <select aria-label="Inventory group" value={group} onChange={e => changeGroup(e.target.value as typeof group)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All inventory</option><option value="parts">Phone parts</option><option value="goods">Gadgets & accessories</option></select>
            <select aria-label="Inventory subcategory" value={subcategory} onChange={e => setSubcategory(e.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All subcategories</option>{subcategories.map(value => <option key={value} value={value}>{value}</option>)}</select>
            <select aria-label="Inventory stock status" value={stockFilter} onChange={e => setStockFilter(e.target.value as typeof stockFilter)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All stock</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500"><span><strong className="text-slate-900">{filtered.length}</strong> shown</span><span><strong className="text-slate-900">{items.length}</strong> total items</span>{(query || group !== "all" || subcategory !== "all" || stockFilter !== "all") && <button type="button" onClick={() => { setQuery(""); setGroup("all"); setSubcategory("all"); setStockFilter("all"); }} className="font-semibold text-teal-700">Clear filters</button>}</div>
        </section>

        <section className="grid gap-6 xl:grid-cols-4">
          <InventoryForm editingItem={editingItem} onSaved={() => { setEditingItem(null); saveRefresh(); }} onCancelEdit={() => setEditingItem(null)} />
          <ReceiveStockPanel refreshKey={refreshKey} onReceived={saveRefresh} />
          <PurchaseStockPanel items={items} onSaved={saveRefresh} />
          <TransferStockPanel items={items} onTransferred={saveRefresh} />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h2 className="font-semibold text-slate-950">Stock on hand</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} item{filtered.length === 1 ? "" : "s"} match the current view.</p></div>
          <InventoryTable refreshKey={refreshKey} onEdit={setEditingItem} itemsOverride={filtered} embedded />
        </section>
      </main>
    </AppLayout>
  );
}
