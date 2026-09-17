"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { customerService } from "@/services/customerService";
import { inventoryService } from "@/services/inventoryService";
import { saleService } from "@/services/saleService";
import { PAYMENT_METHODS } from "@/types/sale";
import type { InventoryItem } from "@/types/inventory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type CartLine = { inventory_id: string; item_name: string; quantity: number; unit_price: number; available: number; cost: number };
type SaleFormProps = { onSaleCompleted: () => void };
const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const selectClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10";

export default function SaleForm({ onSaleCompleted }: SaleFormProps) {
  const [customers, setCustomers] = useState<{ id: string; full_name: string; phone?: string | null }[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { void loadOptions(); }, []);
  async function loadOptions() {
    const [c, i] = await Promise.all([customerService.getCustomers(), inventoryService.getInventory()]);
    if (c.data) setCustomers(c.data);
    if (i.data) setInventory(i.data);
  }

  function addToCart() {
    const item = inventory.find((i) => i.id === selectedItemId);
    const qty = Number(selectedQty);
    if (!item) return toast.error("Choose an item first.");
    if (!Number.isInteger(qty) || qty <= 0) return toast.error("Enter a valid quantity.");
    const existing = cart.find((c) => c.inventory_id === item.id);
    if (qty + (existing?.quantity || 0) > item.quantity) return toast.error(`Only ${item.quantity} in stock.`);
    setCart(existing ? cart.map((c) => c.inventory_id === item.id ? { ...c, quantity: c.quantity + qty } : c) : [...cart, { inventory_id: item.id, item_name: item.item_name, quantity: qty, unit_price: Number(item.selling_price), available: item.quantity, cost: Number(item.cost_price ?? 0) }]);
    setSelectedItemId(""); setSelectedQty("1");
  }

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.quantity * c.unit_price, 0), [cart]);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = subtotal - Math.min(discountAmount, subtotal);
  const estimatedGrossProfit = useMemo(() => cart.reduce((s, c) => s + c.quantity * (c.unit_price - c.cost), 0) - Math.min(discountAmount, subtotal), [cart, discountAmount, subtotal]);

  async function complete() {
    if (!cart.length) return toast.error("Add an item to the sale.");
    if (discountAmount > subtotal) return toast.error("Discount cannot be greater than the sale.");
    setLoading(true);
    const { error } = await saleService.createSale({ customerId: customerId || null, paymentMethod, discount: discountAmount, staffName: null, notes: null, items: cart.map((c) => ({ inventory_id: c.inventory_id, quantity: c.quantity, unit_price: c.unit_price })) });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sale recorded. Stock reduced automatically.");
    setCart([]); setCustomerId(""); setDiscount("0"); setShowCustomer(false); void loadOptions(); onSaleCompleted();
  }

  return <section className="rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
    <header className="border-b border-[#edf0ed] px-5 py-5 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Walk-in first</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">New sale</h2><p className="mt-1 text-xs leading-5 text-[#74837e]">For normal sales, choose the goods, quantity and payment. No customer name is required.</p></div><div className="rounded-xl bg-[#f7f8f5] px-4 py-2.5 text-right"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#74837e]">Estimated profit</p><p className="font-heading text-lg font-bold text-[#182a28]">{money(estimatedGrossProfit)}</p></div></div></header>
    <div className="space-y-5 p-5 sm:p-6">
      <div className="rounded-2xl border border-[#e6ebe7] bg-[#fbfcfa] p-4"><div className="flex flex-col gap-3 sm:flex-row"><select aria-label="Select item" className={`${selectClass} flex-1`} value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}><option value="">Search / choose product…</option>{inventory.filter((i) => Number(i.quantity) > 0).map((i) => <option key={i.id} value={i.id}>{i.item_name} · {money(Number(i.selling_price))} · {i.quantity} left</option>)}</select><div className="flex gap-2"><Input aria-label="Quantity" type="number" min="1" step="1" value={selectedQty} onChange={(e) => setSelectedQty(e.target.value)} className="h-11 w-24 rounded-xl"/><Button type="button" onClick={addToCart} className="h-11 rounded-xl bg-[#123b34] px-5 hover:bg-[#1d6a54]">Add</Button></div></div></div>

      {cart.length > 0 ? <div className="overflow-x-auto rounded-2xl border border-[#e6ebe7]"><Table><TableHeader><TableRow className="bg-[#f7f8f5]"><TableHead>Goods</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead>Total</TableHead><TableHead /></TableRow></TableHeader><TableBody>{cart.map((c) => <TableRow key={c.inventory_id}><TableCell className="min-w-[190px] font-medium">{c.item_name}</TableCell><TableCell>{c.quantity}</TableCell><TableCell>{money(c.unit_price)}</TableCell><TableCell className="font-semibold">{money(c.quantity * c.unit_price)}</TableCell><TableCell><Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCart(cart.filter((x) => x.inventory_id !== c.inventory_id))}>Remove</Button></TableCell></TableRow>)}</TableBody></Table></div> : <div className="rounded-2xl border border-dashed border-[#d6dfda] px-5 py-10 text-center"><ShoppingCartIcon /><p className="mt-2 text-sm font-semibold text-[#394b45]">Nothing added yet</p><p className="mt-1 text-xs text-[#87958f]">Choose the item above. The sale is kept this simple for walk-in customers.</p></div>}

      <div className="grid gap-3 md:grid-cols-[1fr_180px]"><label className="text-xs font-semibold text-[#687974]">Payment<select className={`${selectClass} mt-1`} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></label><label className="text-xs font-semibold text-[#687974]">Discount<select className={`${selectClass} mt-1`} value={discount} onChange={(e) => setDiscount(e.target.value)}><option value="0">No discount</option><option value="500">₦500</option><option value="1000">₦1,000</option><option value="2000">₦2,000</option></select></label></div>

      <div className="border-t border-[#edf0ed] pt-4"><button type="button" onClick={() => setShowCustomer((v) => !v)} className="text-xs font-bold text-[#1d6a54]">{showCustomer ? "− Hide customer details" : "+ Add customer details (optional)"}</button>{showCustomer && <div className="mt-3"><select className={selectClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Select saved customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}{c.phone ? ` · ${c.phone}` : ""}</option>)}</select><p className="mt-1 text-[11px] text-[#87958f]">Only use this when the customer needs a record. Walk-in sales can stay anonymous.</p></div>}</div>

      <div className="flex flex-col gap-4 rounded-2xl bg-[#123b34] p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-xs text-[#c7d8d2]">{cart.length} item{cart.length === 1 ? "" : "s"} · Subtotal {money(subtotal)}</p><p className="mt-1 font-heading text-2xl font-bold">{money(total)}</p></div><Button onClick={complete} disabled={loading || !cart.length} className="h-12 rounded-xl bg-[#d7a95a] px-7 font-bold text-[#123b34] hover:bg-[#e5bc75]">{loading ? "Recording…" : "Complete sale"}</Button></div>
    </div>
  </section>;
}

function ShoppingCartIcon() { return <div className="mx-auto grid size-10 place-items-center rounded-full bg-[#eef4f1] text-[#1d6a54]"><span className="text-lg">+</span></div>; }
