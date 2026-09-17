"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownToLine, Package } from "lucide-react";
import { inventoryService } from "@/services/inventoryService";

type LowStockItem = { id: string; item_name: string; quantity: number; minimum_stock: number };

export default function LowStock() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void fetchLowStock(); }, []);

  async function fetchLowStock() {
    setLoading(true);
    const { data } = await inventoryService.getLowStock();
    setItems((data || []).slice(0, 5));
    setLoading(false);
  }

  return <div className="rounded-xl border border-slate-200 bg-white p-1">
    {loading ? <div className="space-y-2 p-3">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div> : items.length === 0 ? (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Package className="size-5" /></div>
        <p className="text-sm font-semibold text-slate-800">Stock levels look good</p>
        <p className="mt-1 text-xs text-slate-500">No items are currently below their minimum level.</p>
      </div>
    ) : (
      <div className="space-y-2 p-2">
        {items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <div className="flex min-w-0 items-center gap-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><AlertTriangle className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.item_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><ArrowDownToLine className="size-3" /> Minimum {item.minimum_stock}</p></div></div>
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{item.quantity} left</span>
        </div>)}
      </div>
    )}
  </div>;
}
