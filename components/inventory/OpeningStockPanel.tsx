"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import InventoryImage from "@/components/inventory/InventoryImage";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

export default function OpeningStockPanel({ items, onSaved }: { items: InventoryItem[]; onSaved: () => void }) {
  const candidates = useMemo(() => items.filter((item) => Number(item.quantity) === 0), [items]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minimumSellingPrice, setMinimumSellingPrice] = useState("");
  const [minimumStock, setMinimumStock] = useState("5");
  const [busy, setBusy] = useState(false);
  const selected = candidates.find((item) => item.id === itemId) || null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = Number(quantity), cp = Number(costPrice), sp = Number(sellingPrice), floor = Number(minimumSellingPrice), min = Number(minimumStock);
    if (!selected) return toast.error("Select an inventory item.");
    if (!Number.isInteger(q) || q <= 0) return toast.error("Opening quantity must be a whole number greater than 0.");
    if (!Number.isFinite(cp) || cp < 0) return toast.error("Enter a valid cost price.");
    if (!Number.isFinite(sp) || sp <= 0) return toast.error("Selling price must be greater than 0.");
    if (!Number.isFinite(floor) || floor < 0 || floor > sp) return toast.error("Check the minimum selling price.");
    if (!Number.isInteger(min) || min < 0) return toast.error("Minimum stock must be a whole number.");
    setBusy(true);
    const { error } = await inventoryService.setOpeningStock(selected.id, q, cp, sp, floor, min);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Opening stock established for ${selected.item_name}.`);
    setItemId(""); setQuantity(""); setCostPrice(""); setSellingPrice(""); setMinimumSellingPrice("");
    onSaved();
  }

  return (
    <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Inventory setup</p>
        <h2 className="font-heading text-lg font-bold text-[#182a28]">Opening stock</h2>
        <p className="text-sm leading-6 text-[#74837e]">Establish the physical stock you already have. This creates the first stock movement and does not count as a sale.</p>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="rounded-xl border border-[#e8ece8] bg-[#f8faf8] p-3">
          <label className="text-xs font-bold text-[#5b6d68]">Catalogue item</label>
          <div className="mt-2 flex gap-3">
            <InventoryImage src={selected?.image_url || null} alt={selected?.item_name || "Inventory item"} size="sm" />
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm outline-none focus:border-[#1d6a54]">
              <option value="">Select item with no opening stock</option>
              {candidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name}{item.compatible_models ? " · " + item.compatible_models : ""}
                </option>
              ))}
            </select>
          </div>
          {selected && <p className="mt-2 text-xs text-[#74837e]">{selected.brand || "No brand"} · {selected.subcategory || selected.category}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Quantity" value={quantity} onChange={setQuantity} placeholder="e.g. 12" />
          <Field label="Cost price" value={costPrice} onChange={setCostPrice} placeholder="e.g. 500" />
          <Field label="Selling price" value={sellingPrice} onChange={setSellingPrice} placeholder="e.g. 1000" />
          <Field label="Minimum selling price" value={minimumSellingPrice} onChange={setMinimumSellingPrice} placeholder="e.g. 800" />
          <Field label="Low-stock threshold" value={minimumStock} onChange={setMinimumStock} placeholder="e.g. 5" />
        </div>
        {selected && quantity && costPrice && <div className="rounded-xl border border-[#dfe6df] bg-[#f6f1e9] px-4 py-3 text-sm text-[#285c4d]">Opening stock value: <strong>₦{(Number(quantity) * Number(costPrice) || 0).toLocaleString("en-NG")}</strong></div>}
        <Button type="submit" disabled={busy || candidates.length === 0} className="min-h-11 w-full sm:w-auto">{busy ? "Establishing stock..." : "Establish opening stock"}</Button>
        {candidates.length === 0 && <p className="text-xs text-[#74837e]">All current inventory items already have an opening balance or stock movement.</p>}
      </form>
    </section>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="space-y-1"><span className="text-xs font-semibold text-[#5b6d68]">{label}</span><input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-[#dfe6df] px-3 text-sm outline-none focus:border-[#1d6a54]" /></label>;
}
