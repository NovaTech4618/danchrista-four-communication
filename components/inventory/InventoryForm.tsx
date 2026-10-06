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
type InventorySection = "Phone Parts";

const ANDROID_BRANDS = ["itel", "Infinix", "Tecno", "Redmi", "Huawei", "Oppo", "Vivo", "Gionee", "Nokia"];
const PHONE_PARTS: Record<string, string[]> = {
  iPhone: ["Charging Flex", "Earpiece Flex", "Back Glass", "Home Button"],
  Samsung: ["Down Board", "Power Flex"],
  ...Object.fromEntries(ANDROID_BRANDS.map((brand) => [brand, ["Down Board", "Power Flex"]])),
};

export default function InventoryForm({ editingItem, onSaved, onCancelEdit }: Props) {
  const [section, setSection] = useState<InventorySection>("Phone Parts");
  const [itemName, setItemName] = useState("");
  const [partType, setPartType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [subcategory, setSubcategory] = useState("");
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
  const [removing, setRemoving] = useState(false);

  const partTypes = useMemo(() => PHONE_PARTS[brand] || [], [brand]);

  useEffect(() => {
    if (!editingItem) { resetForm(); return; }
    const isPart = editingItem.category === "Phone Parts" || editingItem.item_type === "part";
    const floor = Number(editingItem.minimum_selling_price ?? editingItem.selling_price);
    setSection("Phone Parts");
    setItemName(editingItem.item_name);
    setBrand(editingItem.brand || "");
    setPartType(editingItem.subcategory || "");
    setSubcategory(editingItem.subcategory || "");
    setModel(editingItem.compatible_models || "");
    setVariant(editingItem.item_name.match(/ - (.+)$/)?.[1] || "");
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
    setSection("Phone Parts"); setItemName(""); setPartType(""); setBrand(""); setModel(""); setVariant(""); setSubcategory("");
    setSku(""); setSellingPrice(""); setMinimumSellingPrice(""); setCostPrice(""); setQuantity("0"); setMinimumStock("5");
    setSupplier(""); setShelfLocation(""); setNotes(""); setImageUrl(null); setImageFile(null); setRemoveImage(false);
  }

  function chooseBrand(value: string) {
    setBrand(value);
    setPartType(PHONE_PARTS[value]?.[0] || "");
    setModel("");
    setVariant("");
    setItemName("");
  }

  function choosePartType(value: string) {
    setPartType(value);
    setVariant("");
    setItemName(model ? `${model}${value === "Back Glass" && variant ? ` - ${variant}` : ` ${value}`}` : "");
  }

  function updateModel(value: string) {
    setModel(value);
    const generated = value
      ? `${value}${partType === "Back Glass" && variant ? ` - ${variant}` : partType ? ` ${partType}` : ""}`
      : "";
    if (!editingItem || !itemName.trim() || itemName === generated) setItemName(generated);
  }

  function updateVariant(value: string) {
    setVariant(value);
    if (model && partType === "Back Glass") setItemName(`${model} - ${value}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = Number(sellingPrice), floor = Number(minimumSellingPrice);
    const cp = costPrice ? Number(costPrice) : null, q = Number(quantity), m = Number(minimumStock);

    if (!itemName.trim()) return toast.error("Item name is required.");
    if (section === "Phone Parts") {
      if (!PHONE_PARTS[brand]) return toast.error("Choose a phone brand.");
      if (!partType || !PHONE_PARTS[brand].includes(partType)) return toast.error("Choose the correct part type.");
      if (!model.trim()) return toast.error("Phone model is required.");
      if (partType === "Back Glass" && brand !== "iPhone") return toast.error("Back Glass is for iPhone only.");
    }
    if (!Number.isFinite(sp) || sp <= 0) return toast.error("Selling price must be greater than 0.");
    if (!Number.isFinite(floor) || floor < 0 || floor > sp) return toast.error("Enter a valid minimum selling price.");
    if (!Number.isFinite(q) || q < 0 || !Number.isInteger(q)) return toast.error("Quantity must be a whole number.");
    if (!Number.isFinite(m) || m < 0 || !Number.isInteger(m)) return toast.error("Minimum stock must be a whole number.");
    if (cp !== null && (!Number.isFinite(cp) || cp < 0)) return toast.error("Cost price cannot be negative.");

    setLoading(true);
    const payload = {
      item_name: itemName.trim(),
      category: "Phone Parts",
      subcategory: partType,
      item_type: "part" as const,
      brand,
      compatible_models: model.trim() || null,
      sku: sku.trim() || null,
      selling_price: sp,
      minimum_selling_price: floor,
      cost_price: cp,
      quantity: q,
      minimum_stock: m,
      supplier: supplier.trim() || null,
      shelf_location: shelfLocation.trim() || null,
      notes: notes.trim() || null,
      image_url: null,
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
    resetForm();
    onSaved();
    onCancelEdit();
  }

  return (
    <Card className="h-fit border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{editingItem ? "Edit inventory item" : "Add inventory"}</CardTitle>
        <p className="text-sm text-slate-500">Pick the section first. Phone parts use the shop hierarchy; accessories keep their existing names.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
     {section === "Phone Parts" ? (
            <>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Phone brand</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(PHONE_PARTS).map((value) => <button key={value} type="button" onClick={() => chooseBrand(value)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${brand === value ? "border-[#123b34] bg-[#123b34] text-white" : "border-slate-200 bg-white text-slate-700"}`}>{value}</button>)}
                </div>
              </div>
              {brand && <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Part type</p><div className="flex flex-wrap gap-2">{partTypes.map((value) => <button key={value} type="button" onClick={() => choosePartType(value)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${partType === value ? "border-[#123b34] bg-[#123b34] text-white" : "border-slate-200 bg-white text-slate-700"}`}>{value}</button>)}</div></div>}
              <Input placeholder="Exact phone model — e.g. iPhone 13 / Galaxy A15" value={model} onChange={(e) => updateModel(e.target.value)} />
              {partType === "Back Glass" && <Input placeholder="Colour — e.g. Black, Gold, Blue" value={variant} onChange={(e) => updateVariant(e.target.value)} />}
              <Input placeholder="Item name (auto-filled, editable)" value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </>
          ) : (
            <>
              <Input placeholder="Accessory name — use the shop's existing name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Accessory group (optional)" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
                <Input placeholder="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <Input placeholder="Model / details (optional)" value={model} onChange={(e) => setModel(e.target.value)} />
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="SKU / code (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
            <Input placeholder="Supplier (optional)" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            <Input placeholder="Shelf / location (optional)" value={shelfLocation} onChange={(e) => setShelfLocation(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Selling price</span><Input type="number" min="0.01" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Minimum selling price</span><Input type="number" min="0" step="0.01" value={minimumSellingPrice} onChange={(e) => setMinimumSellingPrice(e.target.value)} required /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Cost price</span><Input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" min="0" step="1" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            <Input type="number" min="0" step="1" placeholder="Low-stock threshold" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} required />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <InventoryImage src={imageUrl} alt={itemName || "Inventory item"} size="md" />
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">Identification photo</p><p className="mt-1 text-xs text-slate-500">Use a clear photo when it helps. JPG, PNG or WebP, up to 5MB.</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { setImageFile(e.target.files?.[0] || null); setRemoveImage(false); }} className="mt-3 block w-full text-xs" />
                {editingItem?.image_path && <button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); setImageUrl(null); }} className="mt-2 text-xs font-semibold text-slate-600 hover:text-red-700">Remove current image</button>}
              </div>
            </div>
          </div>
          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading || removing} className="min-h-11 flex-1">{loading ? "Saving..." : editingItem ? "Save changes" : "Add item"}</Button>
            {editingItem && <Button type="button" variant="outline" className="min-h-11" onClick={onCancelEdit}>Cancel</Button>}
            {editingItem && <Button type="button" variant="outline" disabled={loading || removing} className="min-h-11 border-red-200 text-red-700 hover:bg-red-50" onClick={async () => {
              if (!window.confirm("Remove this item from active inventory? Its past sales/records will be kept.")) return;
              setRemoving(true);
              const result = await inventoryService.deactivateInventoryItem(editingItem.id);
              setRemoving(false);
              if (result.error) return toast.error(result.error.message);
              toast.success("Item removed from active inventory.");
              resetForm();
              onSaved();
              onCancelEdit();
            }}>{removing ? "Removing..." : "Remove from inventory"}</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
