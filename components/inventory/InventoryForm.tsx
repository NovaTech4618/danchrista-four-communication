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

const PART_SUBCATEGORIES = ["Screen", "Charging Port", "Battery", "Speaker / Earpiece", "Camera", "Back Glass", "Other Parts"];
const GOODS_SUBCATEGORIES = ["Charger", "Earphone / AirPods", "Power Bank", "Screen Protector", "Cable", "Phone Stand", "Mouse / Keyboard", "Smartwatch", "Router", "TV Box", "Other Accessories"];

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

  function friendlySubcategory(value: string | null | undefined, type: "parts" | "goods") {
    const map: Record<string, string> = {
      Downboards: "Charging Port",
      "Charging Boards": "Charging Port",
      "Charging Flex": "Charging Port",
      "Power Flex": "Battery",
      "Power Button Flex": "Battery",
      "Earpiece Flex": "Speaker / Earpiece",
      "Earpiece / Speaker Flex": "Speaker / Earpiece",
      "Back Glass": "Back Glass",
      "Other Phone Parts": "Other Parts",
      Chargers: "Charger",
      Cables: "Cable",
      Earphones: "Earphone / AirPods",
      Headsets: "Earphone / AirPods",
      "Power Banks": "Power Bank",
      Speakers: "Speaker / Earpiece",
      "Screen Protectors": "Screen Protector",
      "Other Accessories": "Other Accessories",
    };
    const friendly = value ? map[value] || value : undefined;
    const list = type === "parts" ? PART_SUBCATEGORIES : GOODS_SUBCATEGORIES;
    return friendly && list.includes(friendly) ? friendly : list[list.length - 1];
  }


  useEffect(() => {
    if (!editingItem) { resetForm(); return; }
    const normalizedType = editingItem.item_type === "gadget" || editingItem.item_type === "accessory" ? editingItem.item_type : "part";
    const normalizedCategory = editingItem.category === "Phone Parts" || editingItem.category === "Gadgets & Accessories" ? editingItem.category : normalizedType === "part" ? "Phone Parts" : "Gadgets & Accessories";
    const floor = Number((editingItem as InventoryItem & { minimum_selling_price?: number }).minimum_selling_price ?? editingItem.selling_price);
    setItemName(editingItem.item_name); setCategory(normalizedCategory);
    setSubcategory(friendlySubcategory(editingItem.subcategory, normalizedCategory === "Phone Parts" ? "parts" : "goods"));
    setItemType(normalizedType); setBrand(editingItem.brand || ""); setCompatibleModels(editingItem.compatible_models || ""); setSku(editingItem.sku || "");
    setSellingPrice(String(editingItem.selling_price)); setMinimumSellingPrice(String(floor)); setCostPrice(editingItem.cost_price != null ? String(editingItem.cost_price) : ""); setQuantity(String(editingItem.quantity)); setMinimumStock(String(editingItem.minimum_stock));
    setSupplier(editingItem.supplier || ""); setShelfLocation(editingItem.shelf_location || ""); setNotes(editingItem.notes || ""); setImageUrl(editingItem.image_url || null); setImageFile(null); setRemoveImage(false);
  }, [editingItem]);

  function resetForm() {
    setItemName(""); setCategory("Phone Parts"); setSubcategory("Other Parts"); setItemType("part"); setBrand(""); setCompatibleModels(""); setSku(""); setSellingPrice(""); setMinimumSellingPrice(""); setCostPrice(""); setQuantity("0"); setMinimumStock("5"); setSupplier(""); setShelfLocation(""); setNotes(""); setImageUrl(null); setImageFile(null); setRemoveImage(false);
  }

  function handleCategoryChange(value: string) {
    const nextIsParts = value === "Phone Parts";
    setCategory(value); setSubcategory(nextIsParts ? "Other Parts" : "Other Accessories");
    if (nextIsParts) setItemType("part"); else if (itemType === "part") setItemType("accessory");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = Number(sellingPrice), floor = Number(minimumSellingPrice), cp = costPrice ? Number(costPrice) : null, q = quantity ? Number(quantity) : 0, m = minimumStock ? Number(minimumStock) : 5;
    if (!itemName.trim()) return toast.error("Tell us the item name.");
    if (!sellingPrice || !Number.isFinite(sp) || sp <= 0) return toast.error("Enter the normal selling price.");
    if (!minimumSellingPrice || !Number.isFinite(floor) || floor < 0) return toast.error("Enter the lowest price staff can sell it for.");
    if (floor > sp) return toast.error("The lowest price cannot be above the normal selling price.");
    if (!Number.isFinite(q) || q < 0 || !Number.isInteger(q)) return toast.error("Quantity must be a whole number.");
    if (!Number.isFinite(m) || m < 0 || !Number.isInteger(m)) return toast.error("Minimum stock must be a whole number.");
    if (cp !== null && (!Number.isFinite(cp) || cp < 0)) return toast.error("Shop paid cannot be negative.");

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
      <CardHeader className="pb-3"><CardTitle className="text-lg">{editingItem ? "Edit item" : "Add a new item"}</CardTitle><p className="text-sm text-slate-500">Use names that are easy for everyone in the shop to understand.</p></CardHeader>
      <CardContent><form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="What is the item? — e.g. iPhone 11 Screen" value={itemName} onChange={e => setItemName(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">What kind of item?</span><select value={category} onChange={e => handleCategoryChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>Phone Parts</option><option>Gadgets & Accessories</option></select></label><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">What is it?</span><select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{subcategories.map(value => <option key={value}>{value}</option>)}</select></label></div>
        {category === "Gadgets & Accessories" && <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Is it an accessory or gadget?</span><select value={itemType} onChange={e => setItemType(e.target.value as "accessory" | "gadget")} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="accessory">Accessory</option><option value="gadget">Gadget / Device</option></select></label>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} /><Input placeholder="Code (optional)" value={sku} onChange={e => setSku(e.target.value)} /></div>
        <Input placeholder={category === "Phone Parts" ? "Which phone does it fit? — e.g. iPhone 11, Spark 10" : "Extra details (optional)"} value={compatibleModels} onChange={e => setCompatibleModels(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Normal price</span><Input type="number" min="0.01" step="0.01" placeholder="Selling price" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} required /></label><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Lowest price</span><Input type="number" min="0" step="0.01" placeholder="₦" value={minimumSellingPrice} onChange={e => setMinimumSellingPrice(e.target.value)} required /><span className="text-[11px] text-slate-500">Selling below this needs Boss approval.</span></label><label className="space-y-1"><span className="text-xs font-semibold text-slate-600">What the shop paid</span><Input type="number" min="0" step="0.01" placeholder="Cost price" value={costPrice} onChange={e => setCostPrice(e.target.value)} /></label></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input type="number" min="0" step="1" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required /><Input type="number" min="0" step="1" placeholder="Warn me when stock reaches" value={minimumStock} onChange={e => setMinimumStock(e.target.value)} required /></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input placeholder="Supplier" value={supplier} onChange={e => setSupplier(e.target.value)} /><Input placeholder="Where is it kept? — e.g. Shelf 3" value={shelfLocation} onChange={e => setShelfLocation(e.target.value)} /></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-start gap-3"><InventoryImage src={imageUrl} alt={itemName || "Inventory item"} size="md" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">Photo (optional)</p><p className="mt-1 text-xs text-slate-500">Useful for similar-looking phone parts. JPG, PNG or WebP, up to 5MB.</p><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setImageFile(e.target.files?.[0] || null); setRemoveImage(false); }} className="mt-3 block w-full text-xs" />{editingItem?.image_path && <button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); setImageUrl(null); }} className="mt-2 text-xs font-semibold text-slate-600 hover:text-red-700">Remove current image</button>}</div></div></div>
        <Input placeholder="Note (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
        <div className="flex gap-2"><Button type="submit" disabled={loading} className="min-h-11 flex-1">{loading ? "Saving..." : editingItem ? "Save changes" : "Add item"}</Button>{editingItem && <Button type="button" variant="outline" className="min-h-11" onClick={onCancelEdit}>Cancel</Button>}</div>
      </form></CardContent>
    </Card>
  );
}
