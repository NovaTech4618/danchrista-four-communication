"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InventoryImage from "@/components/inventory/InventoryImage";

type Props = { editingItem: InventoryItem | null; onSaved: () => void; onCancelEdit: () => void };

const PHONE_PARTS: Record<string, string[]> = {
  iPhone: ["Charging Flex", "Earpiece Flex", "Back Glass"],
  Samsung: ["Down Board", "Power Flex"],
  itel: ["Down Board", "Power Flex"],
  Infinix: ["Down Board", "Power Flex"],
  Tecno: ["Down Board", "Power Flex"],
  Redmi: ["Down Board", "Power Flex"],
  Huawei: ["Down Board", "Power Flex"],
  Oppo: ["Down Board", "Power Flex"],
  Vivo: ["Down Board", "Power Flex"],
  Gionee: ["Down Board", "Power Flex"],
  Nokia: ["Down Board", "Power Flex"],
};

export default function InventoryForm({ editingItem, onSaved, onCancelEdit }: Props) {
  const [itemName, setItemName] = useState("");
  const [subcategory, setSubcategory] = useState("Charging Flex");
  const [brand, setBrand] = useState("");
  const [compatibleModels, setCompatibleModels] = useState("");
  const [sku, setSku] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minimumSellingPrice, setMinimumSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [minimumStock, setMinimumStock] = useState("5");
  const [supplier, setSupplier] = useState("");
  const [shelfLocation, setShelfLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const subcategories = PHONE_PARTS[brand] || [];

  useEffect(() => {
    if (!editingItem) { resetForm(); return; }
    const floor = Number((editingItem as InventoryItem & { minimum_selling_price?: number }).minimum_selling_price ?? editingItem.selling_price);
    setItemName(editingItem.item_name);
    setBrand(editingItem.brand || "");
    setSubcategory(editingItem.subcategory || PHONE_PARTS[editingItem.brand || ""]?.[0] || "Charging Flex");
    setCompatibleModels(editingItem.compatible_models || "");
    setSku(editingItem.sku || "");
    setSellingPrice(String(editingItem.selling_price));
    setMinimumSellingPrice(String(floor));
    setCostPrice(editingItem.cost_price != null ? String(editingItem.cost_price) : "");
    setQuantity(String(editingItem.quantity));
    setMinimumStock(String(editingItem.minimum_stock));
    setSupplier(editingItem.supplier || "");
    setShelfLocation(editingItem.shelf_location || "");
    setNotes(editingItem.notes || "");
    setImageUrl(editingItem.image_url || null);
    setImageFile(null);
    setRemoveImage(false);
  }, [editingItem]);

  function resetForm() {
    setItemName(""); setBrand(""); setSubcategory("Charging Flex"); setCompatibleModels(""); setSku("");
    setSellingPrice(""); setMinimumSellingPrice(""); setCostPrice(""); setQuantity("0"); setMinimumStock("5");
    setSupplier(""); setShelfLocation(""); setNotes(""); setImageUrl(null); setImageFile(null); setRemoveImage(false);
  }

  function handleBrandChange(value: string) {
    setBrand(value);
    setSubcategory(PHONE_PARTS[value]?.[0] || "");
    setCompatibleModels("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = Number(sellingPrice), floor = Number(minimumSellingPrice);
    const cp = costPrice ? Number(costPrice) : null, q = Number(quantity), m = Number(minimumStock);
    if (!itemName.trim()) return toast.error("Item name is required.");
    if (!PHONE_PARTS[brand]) return toast.error("Choose a phone brand.");
    if (!subcategory || !PHONE_PARTS[brand].includes(subcategory)) return toast.error("Choose the correct part type for this brand.");
    if (subcategory === "Back Glass" && brand !== "iPhone") return toast.error("Back Glass is for iPhone only.");
    if (!compatibleModels.trim()) return toast.error("Phone model is required.");
    if (!Number.isFinite(sp) || sp <= 0) return toast.error("Selling price must be greater than 0.");
    if (!Number.isFinite(floor) || floor < 0 || floor > sp) return toast.error("Enter a valid minimum selling price.");
    if (!Number.isFinite(q) || q < 0 || !Number.isInteger(q)) return toast.error("Quantity must be a whole number.");
    if (!Number.isFinite(m) || m < 0 || !Number.isInteger(m)) return toast.error("Minimum stock must be a whole number.");
    if (cp !== null && (!Number.isFinite(cp) || cp < 0)) return toast.error("Cost price cannot be negative.");

    setLoading(true);
    const payload = {
      item_name: itemName.trim(), category: "Phone Parts", subcategory, item_type: "part",
      brand, compatible_models: compatibleModels.trim(), sku: sku.trim() || null,
      selling_price: sp, minimum_selling_price: floor, cost_price: cp, quantity: q, minimum_stock: m,
      supplier: supplier.trim() || null, shelf_location: shelfLocation.trim() || null, notes: notes.trim() || null, image_url: null,
    };
    let createdId = editingItem?.id;
    let error: Error | null = null;
    if (editingItem) {
      const r = await inventoryService.updateInventoryItem(editingItem.id, payload);
      error = r.error;
    } else {
      const r = await inventoryService.addInventoryItem(payload);
      error = r.error;
      if (!error) createdId = r.data?.id ?? null;
    }
    if (error) { setLoading(false); return toast.error(error.message); }

    if (createdId && removeImage) {
      const result = await inventoryService.removeItemImage(createdId);
      if (result.error) toast.error(result.error.message);
      setImageUrl(null);
    }
    if (imageFile && createdId) {
      const upload = await inventoryService.uploadItemImage(createdId, imageFile);
      if (upload.error) toast.error(upload.error.message);
      else setImageUrl(upload.data || null);
    }

    setLoading(false);
    toast.success(editingItem ? "Inventory item updated." : "Inventory item added.");
    resetForm(); onSaved(); onCancelEdit();
  }

  return (
    <Card className="h-fit border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{editingItem ? "Edit phone part" : "Add phone part"}</CardTitle>
        <p className="text-sm text-slate-500">Choose brand → part type → exact model. Add real stock and prices only.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Brand</span>
              <select value={brand} onChange={e => handleBrandChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="">Choose brand</option>{Object.keys(PHONE_PARTS).map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Part type</span>
              <select value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!brand} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50">
                {!brand && <option value="">Choose brand first</option>}{subcategories.map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Phone model</span>
              <Input placeholder="e.g. Galaxy A15 / Spark 10" value={compatibleModels} onChange={e => setCompatibleModels(e.target.value)} />
            </label>
          </div>
          <Input placeholder="Item name — e.g. iPhone 13 Charging Flex" value={itemName} onChange={e => setItemName(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="SKU / code (optional)" value={sku} onChange={e => setSku(e.target.value)} />
            <Input placeholder="Supplier (optional)" value={supplier} onChange={e => setSupplier(e.target.value)} />
            <Input placeholder="Shelf / location (optional)" value={shelfLocation} onChange={e => setShelfLocation(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Selling price</span><Input type="number" min="0.01" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} required /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Minimum selling price</span><Input type="number" min="0" step="0.01" value={minimumSellingPrice} onChange={e => setMinimumSellingPrice(e.target.value)} required /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Cost price</span><Input type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" min="0" step="1" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            <Input type="number" min="0" step="1" placeholder="Low-stock threshold" value={minimumStock} onChange={e => setMinimumStock(e.target.value)} required />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <InventoryImage src={imageUrl} alt={itemName || "Phone part"} size="md" />
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">Identification photo</p><p className="mt-1 text-xs text-slate-500">Use a clear part photo. JPG, PNG or WebP, up to 5MB.</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setImageFile(e.target.files?.[0] || null); setRemoveImage(false); }} className="mt-3 block w-full text-xs" />
                {editingItem?.image_path && <button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); setImageUrl(null); }} className="mt-2 text-xs font-semibold text-slate-600 hover:text-red-700">Remove current image</button>}
              </div>
            </div>
          </div>
          <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <div className="flex gap-2"><Button type="submit" disabled={loading} className="min-h-11 flex-1">{loading ? "Saving..." : editingItem ? "Save changes" : "Add phone part"}</Button>{editingItem && <Button type="button" variant="outline" className="min-h-11" onClick={onCancelEdit}>Cancel</Button>}</div>
        </form>
      </CardContent>
    </Card>
  );
}
