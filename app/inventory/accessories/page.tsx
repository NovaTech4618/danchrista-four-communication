"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Cable, CircleAlert, Home, Package, Pencil, Plus, Search, ShoppingCart, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventoryService } from "@/services/inventoryService";
import { staffService } from "@/services/staffService";
import type { InventoryItem, InventoryItemInput } from "@/types/inventory";
import type { StaffRole } from "@/types/staff";

type AccessoryForm = {
  itemName: string;
  group: string;
  brand: string;
  model: string;
  sku: string;
  sellingPrice: string;
  minimumSellingPrice: string;
  costPrice: string;
  quantity: string;
  minimumStock: string;
  supplier: string;
  shelf: string;
  notes: string;
};

const emptyForm = (): AccessoryForm => ({
  itemName: "", group: "", brand: "", model: "", sku: "", sellingPrice: "",
  minimumSellingPrice: "", costPrice: "", quantity: "0", minimumStock: "5",
  supplier: "", shelf: "", notes: "",
});

const money = (value: number) => `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

function isAccessory(item: InventoryItem) {
  const category = (item.category || "").trim().toLowerCase();
  return item.item_type === "accessory" || item.item_type === "gadget" || category === "accessories" || category === "gadgets & accessories";
}

export default function AccessoriesInventoryPage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<AccessoryForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [inventoryResult, roleResult] = await Promise.all([
      inventoryService.getInventory(),
      staffService.getMyRole(),
    ]);
    if (inventoryResult.error) setLoadError("Accessory stock could not be loaded. Refresh and try again.");
    setItems(((inventoryResult.data || []) as InventoryItem[]).filter(isAccessory));
    setRole(roleResult.data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => !needle || [
      item.item_name, item.subcategory, item.brand, item.compatible_models, item.sku, item.supplier,
    ].some((value) => (value || "").toLowerCase().includes(needle)));
  }, [items, search]);

  const lowStock = items.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.minimum_stock));
  const outOfStock = items.filter((item) => Number(item.quantity) <= 0);
  const isOwner = role === "owner";

  function startAdd() {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setFormOpen(true);
  }

  function startEdit(item: InventoryItem) {
    setEditing(item);
    setForm({
      itemName: item.item_name,
      group: item.subcategory || "",
      brand: item.brand || "",
      model: item.compatible_models || "",
      sku: item.sku || "",
      sellingPrice: String(item.selling_price),
      minimumSellingPrice: String(item.minimum_selling_price ?? item.selling_price),
      costPrice: item.cost_price == null ? "" : String(item.cost_price),
      quantity: String(item.quantity),
      minimumStock: String(item.minimum_stock),
      supplier: item.supplier || "",
      shelf: item.shelf_location || "",
      notes: item.notes || "",
    });
    setFormError("");
    setFormOpen(true);
  }

  function updateForm<K extends keyof AccessoryForm>(key: K, value: AccessoryForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveAccessory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sellingPrice = Number(form.sellingPrice);
    const minimumSellingPrice = Number(form.minimumSellingPrice);
    const costPrice = form.costPrice.trim() ? Number(form.costPrice) : null;
    const quantity = Number(form.quantity);
    const minimumStock = Number(form.minimumStock);

    if (!form.itemName.trim()) return setFormError("Enter the name used by the shop.");
    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) return setFormError("Selling price must be greater than zero.");
    if (!Number.isFinite(minimumSellingPrice) || minimumSellingPrice < 0 || minimumSellingPrice > sellingPrice) return setFormError("Minimum selling price must be zero or more and no higher than the selling price.");
    if (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0)) return setFormError("Cost price cannot be negative.");
    if (!Number.isInteger(quantity) || quantity < 0) return setFormError("Quantity must be a whole number of zero or more.");
    if (!Number.isInteger(minimumStock) || minimumStock < 0) return setFormError("Low-stock threshold must be a whole number of zero or more.");

    const payload: InventoryItemInput = {
      item_name: form.itemName.trim(),
      category: "Gadgets & Accessories",
      subcategory: form.group.trim() || "Other Gadgets & Accessories",
      item_type: "accessory",
      brand: form.brand.trim() || null,
      compatible_models: form.model.trim() || null,
      sku: form.sku.trim() || null,
      selling_price: sellingPrice,
      minimum_selling_price: minimumSellingPrice,
      cost_price: costPrice,
      quantity,
      minimum_stock: minimumStock,
      supplier: form.supplier.trim() || null,
      shelf_location: form.shelf.trim() || null,
      notes: form.notes.trim() || null,
      image_url: null,
    };

    setSaving(true);
    setFormError("");
    const result = editing
      ? await inventoryService.updateInventoryItem(editing.id, payload)
      : await inventoryService.addInventoryItem(payload);
    if (result.error) {
      setFormError(result.error.message || "The accessory could not be saved.");
      setSaving(false);
      return;
    }
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
    await load();
    setSaving(false);
  }

  async function deactivate(item: InventoryItem) {
    if (!window.confirm(`Remove ${item.item_name} from active stock? Past sales and records will be kept.`)) return;
    const result = await inventoryService.deactivateInventoryItem(item.id);
    if (result.error) {
      setLoadError(result.error.message || "The item could not be removed.");
      return;
    }
    await load();
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl space-y-5 pb-8">
        <header className="rounded-3xl border border-[#dfe6df] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]"><Cable className="size-4" /> Stock management</p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Accessories & Gadgets</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74837e]">Keep chargers, cables, earphones, screen protectors, power banks and other small goods in the same stock ledger used by Sales. Only items recorded here will appear as available stock.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/workspace" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-semibold text-[#285c4d] hover:bg-[#f5f8f5]"><Home className="size-4" />Home</Link>
              <Link href="/sales" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#123b34] px-3 text-sm font-semibold text-white hover:bg-[#1d6a54]"><ShoppingCart className="size-4" />Record a sale</Link>
              {isOwner && <Button onClick={startAdd} className="min-h-10 rounded-xl bg-[#1d6a54]"><Plus className="size-4" />Add accessory</Button>}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Items in stock list" value={items.length.toLocaleString("en-NG")} />
            <Stat label="Low stock" value={lowStock.length.toLocaleString("en-NG")} warning={lowStock.length > 0} />
            <Stat label="Out of stock" value={outOfStock.length.toLocaleString("en-NG")} warning={outOfStock.length > 0} />
          </div>
        </header>

        {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><p className="font-semibold">Stock update needed</p><p className="mt-1">{loadError}</p><Button variant="outline" className="mt-3" onClick={() => void load()}>Retry</Button></div>}

        {formOpen && isOwner && (
          <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h2 className="font-heading text-xl font-bold text-[#182a28]">{editing ? "Edit accessory" : "Add an accessory"}</h2><p className="mt-1 text-sm text-[#74837e]">Enter real prices and the quantity physically available. Do not estimate missing stock.</p></div>
              <button type="button" aria-label="Close accessory form" onClick={() => { setFormOpen(false); setEditing(null); setFormError(""); }} className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><X className="size-4" /></button>
            </div>
            <form onSubmit={(event) => void saveAccessory(event)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Accessory name"><Input value={form.itemName} onChange={(event) => updateForm("itemName", event.target.value)} placeholder="e.g. Type-C cable" required /></Field>
              <Field label="Group"><Input value={form.group} onChange={(event) => updateForm("group", event.target.value)} placeholder="e.g. Cables, Chargers, Audio" /></Field>
              <Field label="Brand"><Input value={form.brand} onChange={(event) => updateForm("brand", event.target.value)} placeholder="Optional" /></Field>
              <Field label="Model / details"><Input value={form.model} onChange={(event) => updateForm("model", event.target.value)} placeholder="Optional" /></Field>
              <Field label="SKU / code"><Input value={form.sku} onChange={(event) => updateForm("sku", event.target.value)} placeholder="Optional" /></Field>
              <Field label="Supplier"><Input value={form.supplier} onChange={(event) => updateForm("supplier", event.target.value)} placeholder="Optional" /></Field>
              <Field label="Selling price (₦)"><Input type="number" min="0.01" step="0.01" value={form.sellingPrice} onChange={(event) => updateForm("sellingPrice", event.target.value)} required /></Field>
              <Field label="Minimum selling price (₦)"><Input type="number" min="0" step="0.01" value={form.minimumSellingPrice} onChange={(event) => updateForm("minimumSellingPrice", event.target.value)} required /></Field>
              <Field label="Cost price (₦)"><Input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => updateForm("costPrice", event.target.value)} placeholder="Unknown? Leave blank" /></Field>
              <Field label="Quantity physically in stock"><Input type="number" min="0" step="1" value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} required /></Field>
              <Field label="Low-stock alert at"><Input type="number" min="0" step="1" value={form.minimumStock} onChange={(event) => updateForm("minimumStock", event.target.value)} required /></Field>
              <Field label="Shelf / location"><Input value={form.shelf} onChange={(event) => updateForm("shelf", event.target.value)} placeholder="Optional" /></Field>
              <div className="sm:col-span-2 lg:col-span-3"><Field label="Notes"><Input value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Optional" /></Field></div>
              {formError && <p role="alert" className="sm:col-span-2 lg:col-span-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{formError}</p>}
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={saving} className="min-h-11 bg-[#1d6a54]">{saving ? "Saving…" : editing ? "Save changes" : "Add to stock"}</Button>
                <Button type="button" variant="outline" disabled={saving} onClick={() => { setFormOpen(false); setEditing(null); setFormError(""); }}>Cancel</Button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-heading text-xl font-bold text-[#182a28]">Current stock</h2><p className="mt-1 text-xs text-[#74837e]">Stock figures come from inventory; no sample items or sales are added.</p></div>
            <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Search accessories" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, brand, group or supplier" className="pl-9" /></div>
          </div>
          {loading ? <div className="py-10 text-center text-sm text-slate-500">Loading accessory stock…</div> : visibleItems.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400"><th className="pb-3 pr-4">Item</th><th className="pb-3 pr-4">Group / brand</th><th className="pb-3 pr-4">In stock</th><th className="pb-3 pr-4">Selling price</th><th className="pb-3 pr-4">Stock status</th>{isOwner && <th className="pb-3 text-right">Actions</th>}</tr></thead>
                <tbody>{visibleItems.map((item) => {
                  const quantity = Number(item.quantity || 0);
                  const low = quantity > 0 && quantity <= Number(item.minimum_stock || 0);
                  return <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4"><p className="font-semibold text-slate-900">{item.item_name}</p><p className="mt-1 text-xs text-slate-500">{item.sku || item.compatible_models || "No code recorded"}</p></td>
                    <td className="py-4 pr-4 text-slate-600">{[item.subcategory, item.brand].filter(Boolean).join(" · ") || "Accessories"}</td>
                    <td className="py-4 pr-4 font-semibold tabular-nums">{quantity.toLocaleString("en-NG")}</td>
                    <td className="py-4 pr-4 font-semibold tabular-nums">{money(Number(item.selling_price))}</td>
                    <td className="py-4 pr-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${quantity <= 0 ? "bg-rose-50 text-rose-700" : low ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{quantity <= 0 ? "Out of stock" : low ? "Low stock" : "Available"}</span></td>
                    {isOwner && <td className="py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => startEdit(item)}><Pencil className="size-3.5" />Edit</Button><Button size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => void deactivate(item)}>Remove</Button></div></td>}
                  </tr>;
                })}</tbody>
              </table>
            </div>
          ) : <div className="py-12 text-center"><Package className="mx-auto size-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">{search.trim() ? "No matching accessories" : "No accessories recorded yet"}</p><p className="mt-1 text-sm text-slate-500">{search.trim() ? "Try a different search term." : isOwner ? "Start by adding the real accessories currently in the shop." : "Ask the owner to enter the current accessory stock."}</p>{isOwner && !search.trim() && <Button onClick={startAdd} className="mt-4 bg-[#1d6a54]"><Plus className="size-4" />Add first accessory</Button>}</div>}
        </section>

        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" />Selling an accessory from Sales reduces its recorded stock and puts the sale into the existing financial records. Verify physical quantities before relying on stock totals.</p>
      </main>
    </AppLayout>
  );
}

function Stat({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className="rounded-xl border border-[#e3e9e4] bg-[#f8faf8] p-3 sm:p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#74837e]">{label}</p><p className={`mt-1.5 text-xl font-bold ${warning ? "text-amber-700" : "text-[#123b34]"}`}>{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-xs font-semibold text-[#5f7069]"><span>{label}</span>{children}</label>;
}
