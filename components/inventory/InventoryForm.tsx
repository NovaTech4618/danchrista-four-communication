"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InventoryImage from "@/components/inventory/InventoryImage";

type Props = { editingItem: InventoryItem | null; onSaved: () => void; onCancelEdit: () => void };

const PART_SUBCATEGORIES = ["Downboards", "Charging Flex", "Power Flex", "Earpiece Flex", "Back Glass", "Other Phone Parts"];
const GOODS_SUBCATEGORIES = ["Chargers", "Cables", "Earphones", "Headsets", "Power Banks", "Speakers", "Phone Accessories", "Other Gadgets & Accessories"];

export default function InventoryForm({ editingItem, onSaved, onCancelEdit }: Props) {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Phone Parts");
  const [subcategory, setSubcategory] = useState("Other Phone Parts");
  const [itemType, setItemType] = useState<"part" | "accessory" | "gadget">("part");
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

  const subcategories = useMemo(() => category === "Phone Parts" ? PART_SUBCATEGORIES : GOODS_SUBCATEGORIES, [category]);

  useEffect(() => {
    if (!editingItem) { resetForm(); return; }
    const normalizedType = editingItem.item_type === "gadget" || editingItem.item_type === "accessory" ? editingItem.item_type : "part";
    const normalizedCategory = editingItem.category === "Phone Parts" || editingItem.category === "Gadgets & Accessories" ? editingItem.category : normalizedType === "part" ? "Phone Parts" : "Gadgets & Accessories";
    const floor = Number((editingItem as InventoryItem & { minimum_selling_price?: number }).minimum_selling_price ?? editingItem.selling_price);
    setItemName(editingItem.item_name); setCategory(normalizedCategory);
    setSubcategory(editingItem.subcategory || (normalizedCategory === "Phone Parts" ? "Other Phone Parts" : "Other Gadgets & Accessories"));
    setItemType(normalizedType); setBrand(editingItem.brand || ""); setCompatibleModels(editingItem.compatible_models || ""); setSku(editingItem.sku || "");
    setSellingPrice(String(editingItem.selling_price)); setMinimumSellingPrice(String(floor)); setCostPrice(editingItem.cost_price != null ? String(editingItem.cost_price) : ""); setQuantity(String(editingItem.quantity)); setMinimumStock(String(editingItem.minimum_stock));
    setSupplier(editingItem.supplier || ""); setShelfLocation(editingItem.shelf_location || ""); setNotes(editingItem.notes || ""); setImageUrl(editingItem.image_url || null); setImageFile(null); setRemoveImage(false);
  }, [editingItem]);

  function resetForm() {
    setItemName(""); setCategory("Phone Parts"); setSubcategory("Other Phone Parts"); setItemType("part"); setBrand(""); setCompatibleModels(""); setSku(""); setSellingPrice(""); setMinimumSellingPrice(""); setCostPrice(""); setQuantity("0"); setMinimumStock("5"); setSupplier(""); setShelfLocation(""); setNotes(""); setImageUrl(null); setImageFile(null); setRemoveImage(false);
  }

  function handleCategoryChange(value: string) {
    const nextIsParts = value === "Phone Parts";
    setCategory(value); setSubcategory(nextIsParts ? "Other Phone Parts" : "Other Gadgets & Accessories");
    if (nextIsParts) setItemType("part"); else if (itemType === "part") setItemType("accessory");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = Number(sellingPrice), floor = Number(minimumSellingPrice), cp = costPrice ? Number(costPrice) : null, q = quantity ? Number(quantity) : 0, m = minimumStock ? Number(minimumStock) : 5;
    if (!itemName.trim()) return toast.error("Item name is required.");
    if (!sellingPrice || !Number.isFinite(sp) || sp <= 0) return toast.error("Selling price must be greater than 0.");
    if (!minimumSellingPrice || !Number.isFinite(floor) || floor < 0) return toast.error("Minimum selling price is required.");
    if (floor > sp) return toast.error("Minimum selling price cannot be above the selling price.");
    if (!Number.isFinite(q) || q < 0 || !Number.isInteger(q)) return toast.error("Quantity must be a whole number.");
    if (!Number.isFinite(m) || m < 0 || !Number.isInteger(m)) return toast.error("Minimum stock must be a whole number.");
    if (cp !== null && (!Number.isFinite(cp) || cp < 0)) return toast.error("Cost price cannot be negative.");

    setLoading(true);
    const payload = { item_name: itemName.trim(), category, subcategory, item_type: itemType, brand: brand.trim() || null, compatible_models: compatibleModels.trim() || null, sku: sku.trim() || null, selling_price: sp, minimum_selling_price: floor, cost_price: cp, quantity: q, minimum_stock: m, supplier: supplier.trim() || null, shelf_location: shelfLocation.trim() || null, notes: notes.trim() || null, image_url: null };
    let createdId = editingItem?.id;
    let error: Error | null = null;
    if (editingItem) { const r = await inventoryService.updateInventoryItem(editingItem.id, payload); error = r.error; }
    else { const r = await inventoryService.addInventoryItem(payload); error = r.error; if (!error) createdId = r.data?.id ?? null; }
    if (error) { setLoading(false); return toast.error(error.message); }

    if (createdId && removeImage) {
      const result = await inventoryService.removeItemImage(createdId);
      if (result.error) toast.error(result.error.message);
      setImageUrl(null);
    }
    if (imageFile && createdId) {
      const upload = await inventoryService.uploadItemImage(createdId, imageFile);
      if (upload.error) toast.error(upload.error.message); else setImageUrl(upload.data || null);
    }

    setLoading(false); toast.success(editingItem ? "Inventory item updated." : "Inventory item added."); resetForm(); onSaved(); onCancelEdit();
  }

  return (
    <Card className="h-fit border-slate-200 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg">{editingItem ? "Edit item" : "Add inventory item"}</CardTitle><p className="text-sm text-slate-500">Keep the name, model and shelf easy to recognize during a busy day.</p></CardHeader>
      <CardContent><form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Item name — e.g. Tecno Spark 10 Charging Board" value={itemName} onChange={e => setItemName(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Main group</span><select value={category} onChange={e => handleCategoryChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>Phone Parts</option><option>Gadgets & Accessories</option></select></label><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Subcategory</span><select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{subcategories.map(value => <option key={value}>{value}</option>)}</select></label></div>
        {category === "Gadgets & Accessories" && <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Item kind</span><select value={itemType} onChange={e => setItemType(e.target.value as "accessory" | "gadget")} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="accessory">Accessory</option><option value="gadget">Gadget / Device</option></select></label>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} /><Input placeholder="SKU / code (optional)" value={sku} onChange={e => setSku(e.target.value)} /></div>
        <Input placeholder={category === "Phone Parts" ? "Compatible model(s) — e.g. Spark 10, KJ5" : "Compatible model / details (optional)"} value={compatibleModels} onChange={e => setCompatibleModels(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Selling price</span><Input type="number" min="0.01" step="0.01" placeholder="Selling price" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} required /></label><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Minimum selling price</span><Input type="number" min="0" step="0.01" placeholder="Lowest allowed" value={minimumSellingPrice} onChange={e => setMinimumSellingPrice(e.target.value)} required /><span className="text-[11px] text-slate-500">Staff cannot sell below this without an authorised override.</span></label><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Cost price</span><Input type="number" min="0" step="0.01" placeholder="Cost price" value={costPrice} onChange={e => setCostPrice(e.target.value)} /></label></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input type="number" min="0" step="1" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required /><Input type="number" min="0" step="1" placeholder="Low-stock threshold" value={minimumStock} onChange={e => setMinimumStock(e.target.value)} required /></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input placeholder="Supplier" value={supplier} onChange={e => setSupplier(e.target.value)} /><Input placeholder="Shelf / location — e.g. Row 3" value={shelfLocation} onChange={e => setShelfLocation(e.target.value)} /></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-start gap-3"><InventoryImage src={imageUrl} alt={itemName || "Inventory item"} size="md" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">Identification photo</p><p className="mt-1 text-xs text-slate-500">Useful for similar-looking phone parts. JPG, PNG or WebP, up to 5MB.</p><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setImageFile(e.target.files?.[0] || null); setRemoveImage(false); }} className="mt-3 block w-full text-xs" />{editingItem?.image_path && <button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); setImageUrl(null); }} className="mt-2 text-xs font-semibold text-slate-600 hover:text-red-700">Remove current image</button>}</div></div></div>
        <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
        <div className="flex gap-2"><Button type="submit" disabled={loading} className="min-h-11 flex-1">{loading ? "Saving..." : editingItem ? "Save changes" : "Add item"}</Button>{editingItem && <Button type="button" variant="outline" className="min-h-11" onClick={onCancelEdit}>Cancel</Button>}</div>
      </form></CardContent>
    </Card>
  );
}
