"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

import { inventoryService } from "@/services/inventoryService";
import { saleService } from "@/services/saleService";
import type { InventoryItem } from "@/types/inventory";
import { CASH_ACCOUNT, PAYMENT_METHODS, TRANSFER_ACCOUNTS } from "@/types/sale";
import InventoryImage from "@/components/inventory/InventoryImage";

export default function QuickSale() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [paymentAccount, setPaymentAccount] = useState<string>(CASH_ACCOUNT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    inventoryService.getInventory().then(({ data, error }) => {
      if (!active) return;
      if (error) toast.error("Could not load stock for Quick Sale.");
      setInventory(data ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return inventory
      .filter((item) => {
        const searchable = [
          item.item_name,
          item.sku,
          item.brand,
          item.compatible_models,
          item.category,
          item.shelf_location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(value);
      })
      .slice(0, 8);
  }, [inventory, query]);

  const qty = Number(quantity);
  const total = selected ? selected.selling_price * (Number.isInteger(qty) && qty > 0 ? qty : 0) : 0;

  async function completeSale() {
    if (!selected) {
      toast.error("Choose the item you sold first.");
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    if (qty > selected.quantity) {
      toast.error(`Only ${selected.quantity} available in stock.`);
      return;
    }

    setSaving(true);
    const { error } = await saleService.createSale({
      customerId: null,
      paymentMethod,
      paymentAccount,
      discount: 0,
      staffName: null,
      notes: "Quick sale",
      items: [{ inventory_id: selected.id, quantity: qty, unit_price: selected.selling_price }],
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Sale recorded");
    setSelected(null);
    setQuery("");
    setQuantity("1");
    const { data } = await inventoryService.getInventory();
    setInventory(data ?? []);
  }

  return (
    <section className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
            <ShoppingBag className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-slate-950">Quick Sale</h2>
            <p className="text-xs text-slate-500">Record a walk-in sale without opening the Sales page.</p>
          </div>
        </div>
        {selected && (
          <button type="button" onClick={() => { setSelected(null); setQuery(""); }} className="inline-flex items-center gap-1 self-start text-xs font-semibold text-slate-500 hover:text-slate-900 sm:self-auto">
            Clear <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px_120px_auto]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={selected?.item_name ?? query}
            onChange={(event) => { setSelected(null); setQuery(event.target.value); }}
            placeholder={loading ? "Loading stock…" : "Search item, SKU, brand, model…"}
            disabled={loading || saving}
            autoComplete="off"
            enterKeyHint="search"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
          />
          {!selected && matches.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              {matches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setSelected(item); setQuery(""); }}
                  disabled={item.quantity <= 0}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <InventoryImage src={item.image_url} alt={item.item_name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{item.item_name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {item.brand ? `${item.brand} · ` : ""}{item.category || "Part"}{item.sku ? ` · SKU ${item.sku}` : ""}
                    </span>
                    <span className="block text-xs font-medium text-slate-500">
                      {item.quantity} in stock{item.shelf_location ? ` · Shelf ${item.shelf_location}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-700">₦{item.selling_price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={!selected || saving}
          aria-label="Quantity"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
        />

        <div className="grid grid-cols-2 gap-2"><select
          value={paymentMethod}
          onChange={(event) => { const value = event.target.value; setPaymentMethod(value); setPaymentAccount(value === "Cash" ? CASH_ACCOUNT : TRANSFER_ACCOUNTS[0]); }}
          disabled={saving}
          aria-label="Payment method"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
        >{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select><select value={paymentAccount} onChange={(event) => setPaymentAccount(event.target.value)} disabled={saving} aria-label="Payment account" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10">{paymentMethod === "Cash" ? <option>Cash</option> : TRANSFER_ACCOUNTS.map((account) => <option key={account}>{account}</option>)}</select></div>

        <button
          type="button"
          onClick={completeSale}
          disabled={!selected || saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Sell
        </button>
      </div>

      {selected && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5 text-sm ring-1 ring-teal-100">
          <div className="flex min-w-0 items-center gap-3">
            <InventoryImage src={selected.image_url} alt={selected.item_name} />
            <span className="min-w-0 truncate font-medium text-slate-700">{selected.item_name} × {qty > 0 ? qty : 0}</span>
          </div>
          <span className="font-data font-bold text-slate-950">₦{total.toLocaleString()}</span>
        </div>
      )}
    </section>
  );
}
