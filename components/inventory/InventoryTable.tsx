"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";
import InventoryImage from "@/components/inventory/InventoryImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type InventoryTableProps = { refreshKey: number; onEdit: (item: InventoryItem) => void; itemsOverride?: InventoryItem[]; embedded?: boolean };

function groupLabel(item: InventoryItem) {
  return item.item_type === "part" || item.category === "Phone Parts" ? "Phone Parts" : "Gadgets & Accessories";
}

function stockLabel(item: InventoryItem) {
  if (item.quantity === 0) return "Out of stock";
  if (item.quantity <= item.minimum_stock) return "Low stock";
  return "In stock";
}

export default function InventoryTable({ refreshKey, onEdit, itemsOverride, embedded = false }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!itemsOverride) {
      inventoryService.getInventory().then(({ data, error }) => {
        if (error) toast.error("Failed to load inventory.");
        else setItems((data || []) as InventoryItem[]);
      });
    }
  }, [refreshKey, itemsOverride]);

  const source = itemsOverride ?? items;

  async function handleDelete(id: string) {
    if (!confirm("Delete this inventory item? This cannot be undone.")) return;
    const { error } = await inventoryService.deleteInventoryItem(id);
    if (error) return toast.error(error.message);
    toast.success("Item deleted.");
    const result = await inventoryService.getInventory();
    setItems((result.data || []) as InventoryItem[]);
  }

  return (
    <div className={embedded ? "" : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"}>
      {!embedded && <h2 className="mb-4 text-xl font-bold">Inventory</h2>}
      {source.length === 0 ? (
        <div className="px-5 py-14 text-center"><p className="font-semibold text-slate-900">No stock matches this view</p><p className="mt-1 text-sm text-slate-500">Try another category, search term, or stock filter.</p></div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Brand / model</TableHead><TableHead>Location</TableHead><TableHead>Stock</TableHead><TableHead>Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {source.map(item => <TableRow key={item.id}>
                  <TableCell><div className="flex items-center gap-3"><InventoryImage src={item.image_url} alt={item.item_name} /><div className="min-w-0"><div className="font-semibold text-slate-900">{item.item_name}</div><div className="mt-0.5 text-xs text-slate-500">{item.subcategory || "Uncategorized"}{item.sku ? ` · ${item.sku}` : ""}</div></div></div></TableCell>
                  <TableCell><div className="space-y-1"><Badge variant="secondary">{groupLabel(item)}</Badge><div className="text-xs text-slate-500">{item.subcategory || "—"}</div></div></TableCell>
                  <TableCell><div className="font-medium text-slate-800">{item.brand || "—"}</div><div className="text-xs text-slate-500">{item.compatible_models || "No model specified"}</div></TableCell>
                  <TableCell>{item.shelf_location || "—"}</TableCell>
                  <TableCell><div className="font-semibold text-slate-900">{item.quantity} units</div><div className={`text-xs ${item.quantity === 0 ? "text-red-700" : item.quantity <= item.minimum_stock ? "text-amber-700" : "text-slate-500"}`}>{stockLabel(item)}</div></TableCell>
                  <TableCell className="font-semibold">₦{Number(item.selling_price).toLocaleString()}</TableCell>
                  <TableCell><div className="flex gap-2"><Button size="sm" onClick={() => onEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button></div></TableCell>
                </TableRow>)}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {source.map(item => <article key={item.id} className="p-4">
              <div className="flex gap-3"><InventoryImage src={item.image_url} alt={item.item_name} size="md" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{item.item_name}</h3><p className="mt-0.5 text-xs text-slate-500">{item.brand || "Unknown brand"}{item.compatible_models ? ` · ${item.compatible_models}` : ""}</p></div><span className="shrink-0 text-sm font-bold text-slate-900">₦{Number(item.selling_price).toLocaleString()}</span></div><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{groupLabel(item)}</Badge><Badge variant="secondary">{item.subcategory || "Uncategorized"}</Badge><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.quantity === 0 ? "bg-red-50 text-red-700" : item.quantity <= item.minimum_stock ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{item.quantity} units · {stockLabel(item)}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Location <strong className="block text-slate-800">{item.shelf_location || "Not set"}</strong></span><span>SKU <strong className="block text-slate-800">{item.sku || "Not set"}</strong></span></div><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => onEdit(item)} className="flex-1">Edit</Button><Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button></div></div></div>
            </article>)}
          </div>
        </>
      )}
    </div>
  );
}
