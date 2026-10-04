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
import InventoryImage from "@/components/inventory/InventoryImage";
import { ChevronRight, Package, Smartphone } from "lucide-react";

type CartLine = { inventory_id: string; item_name: string; quantity: number; unit_price: number; available: number; cost: number; selling_price: number; minimum_selling_price: number; price_override: boolean };
type SaleFormProps = { onSaleCompleted: () => void };
type SaleSection = "Phone Parts" | "Accessories";
type PriceControlledInventory = InventoryItem & { minimum_selling_price?: number };

const ANDROID_BRANDS = ["itel", "Infinix", "Tecno", "Redmi", "Huawei", "Oppo", "Vivo", "Gionee", "Nokia"];
const PHONE_PARTS: Record<string, string[]> = {
  iPhone: ["Charging Flex", "Earpiece Flex", "Back Glass", "Home Button"],
  Samsung: ["Down Board", "Power Flex"],
  ...Object.fromEntries(ANDROID_BRANDS.map((brand) => [brand, ["Down Board", "Power Flex"]])),
};
const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const selectClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10";

function accessoryGroup(item: InventoryItem) {
  return item.subcategory?.trim() || "Other accessories";
}

export default function SaleForm({ onSaleCompleted }: SaleFormProps) {
  const [customers, setCustomers] = useState<{ id: string; full_name: string; phone?: string | null }[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [section, setSection] = useState<SaleSection>("Phone Parts");
  const [selectedBrand, setSelectedBrand] = useState("iPhone");
  const [selectedPartType, setSelectedPartType] = useState("Charging Flex");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [accessoryGroupName, setAccessoryGroupName] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");
  const [customerId, setCustomerId] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [saleAttemptKey, setSaleAttemptKey] = useState<string | null>(null);
  const [saleAttemptSignature, setSaleAttemptSignature] = useState<string | null>(null);

  useEffect(() => { void loadOptions(); }, []);

  async function loadOptions() {
    const [c, i] = await Promise.all([customerService.getCustomers(), inventoryService.getInventory()]);
    if (c.data) setCustomers(c.data);
    if (i.data) setInventory(i.data);
  }

  const phoneParts = useMemo(() => inventory.filter((item) => {
    const types = item.brand ? PHONE_PARTS[item.brand] : undefined;
    return item.category === "Phone Parts" && Boolean(item.brand && types?.includes(item.subcategory || ""));
  }), [inventory]);

  const accessories = useMemo(() => inventory.filter((item) => item.category === "Accessories" || item.item_type === "accessory"), [inventory]);
  const partTypes = PHONE_PARTS[selectedBrand] || [];

  const models = useMemo(() => Array.from(new Set(phoneParts
    .filter((item) => item.brand === selectedBrand && item.subcategory === selectedPartType)
    .map((item) => item.compatible_models)
    .filter((model): model is string => Boolean(model)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [phoneParts, selectedBrand, selectedPartType]);

  const modelItems = useMemo(() => phoneParts.filter((item) => item.brand === selectedBrand && item.subcategory === selectedPartType && item.compatible_models === selectedModel), [phoneParts, selectedBrand, selectedPartType, selectedModel]);

  const variants = useMemo(() => Array.from(new Set(modelItems.map((item) => item.item_name.match(/ - (.+)$/)?.[1]).filter((variant): variant is string => Boolean(variant)))), [modelItems]);
  const accessoryGroups = useMemo(() => Array.from(new Set(accessories.map(accessoryGroup))).sort((a, b) => a.localeCompare(b)), [accessories]);
  const accessoryItems = useMemo(() => accessories.filter((item) => accessoryGroup(item) === accessoryGroupName), [accessories, accessoryGroupName]);

  function resetSelection() {
    setSelectedModel(""); setSelectedVariant(""); setSelectedItemId(""); setAccessoryGroupName("");
  }
  function chooseSection(next: SaleSection) {
    setSection(next);
    resetSelection();
    if (next === "Phone Parts") { setSelectedBrand("iPhone"); setSelectedPartType("Charging Flex"); }
  }
  function chooseBrand(brand: string) {
    setSelectedBrand(brand); setSelectedPartType(PHONE_PARTS[brand]?.[0] || ""); setSelectedModel(""); setSelectedVariant(""); setSelectedItemId("");
  }
  function choosePartType(type: string) {
    setSelectedPartType(type); setSelectedModel(""); setSelectedVariant(""); setSelectedItemId("");
  }
  function chooseModel(model: string) {
    setSelectedModel(model); setSelectedVariant("");
    const items = phoneParts.filter((item) => item.brand === selectedBrand && item.subcategory === selectedPartType && item.compatible_models === model);
    setSelectedItemId(selectedPartType === "Back Glass" ? "" : items.find((item) => item.quantity > 0)?.id || items[0]?.id || "");
  }
  function chooseVariant(variant: string) {
    setSelectedVariant(variant);
    setSelectedItemId(modelItems.find((item) => item.item_name.endsWith(" - " + variant))?.id || "");
  }

  function addToCart() {
    const item = inventory.find((entry) => entry.id === selectedItemId) as PriceControlledInventory | undefined;
    const qty = Number(selectedQty);
    if (!item) return toast.error("Choose an item first.");
    if (!Number.isInteger(qty) || qty <= 0) return toast.error("Enter a valid quantity.");
    if (item.quantity <= 0) return toast.error("This item is out of stock.");
    const existing = cart.find((line) => line.inventory_id === item.id);
    if (qty + (existing?.quantity || 0) > item.quantity) return toast.error(`Only ${item.quantity} in stock.`);
    const floor = Number(item.minimum_selling_price ?? item.selling_price);
    setCart(existing
      ? cart.map((line) => line.inventory_id === item.id ? { ...line, quantity: line.quantity + qty } : line)
      : [...cart, { inventory_id: item.id, item_name: item.item_name, quantity: qty, unit_price: Number(item.selling_price), available: item.quantity, cost: Number(item.cost_price ?? 0), selling_price: Number(item.selling_price), minimum_selling_price: floor, price_override: false }]);
    setSelectedItemId(""); setSelectedQty("1");
  }

  function updateLine(id: string, patch: Partial<CartLine>) {
    setCart((lines) => lines.map((line) => line.inventory_id === id ? { ...line, ...patch } : line));
  }

  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.quantity * line.unit_price, 0), [cart]);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = subtotal - Math.min(discountAmount, subtotal);
  const estimatedGrossProfit = useMemo(() => cart.reduce((sum, line) => sum + line.quantity * (line.unit_price - line.cost), 0) - Math.min(discountAmount, subtotal), [cart, discountAmount, subtotal]);

  async function complete() {
    if (!cart.length) return toast.error("Add an item to the sale.");
    if (discountAmount > subtotal) return toast.error("Discount cannot be greater than the sale.");
    const belowLineFloor = cart.some((line) => line.unit_price < line.minimum_selling_price);
    const minimumSubtotal = cart.reduce((sum, line) => sum + line.quantity * line.minimum_selling_price, 0);
    const needsApproval = belowLineFloor || total < minimumSubtotal;

    if (needsApproval) {
      setLoading(true);
      const { error } = await saleService.requestPriceOverride({
        customerId: customerId || null, paymentMethod, discount: discountAmount, staffName: null, notes: null,
        items: cart.map((line) => ({ inventory_id: line.inventory_id, quantity: line.quantity, unit_price: line.unit_price, price_override: true })),
        reason: "Sale price is below the stored minimum selling price.",
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Boss approval requested. The sale has not been recorded yet.");
      setCart([]); setCustomerId(""); setDiscount("0"); setShowCustomer(false); setSaleAttemptKey(null); setSaleAttemptSignature(null); void loadOptions(); onSaleCompleted(); return;
    }

    const attemptSignature = JSON.stringify({ customerId: customerId || null, paymentMethod, discount: discountAmount, items: cart.map((line) => ({ inventory_id: line.inventory_id, quantity: line.quantity, unit_price: line.unit_price, price_override: line.price_override })) });
    const idempotencyKey = saleAttemptKey && saleAttemptSignature === attemptSignature ? saleAttemptKey : crypto.randomUUID();
    setSaleAttemptKey(idempotencyKey); setSaleAttemptSignature(attemptSignature); setLoading(true);

    const { error } = await saleService.createSale({
      customerId: customerId || null, paymentMethod, discount: discountAmount, staffName: null, notes: null,
      items: cart.map((line) => ({ inventory_id: line.inventory_id, quantity: line.quantity, unit_price: line.unit_price, price_override: line.price_override })),
      idempotencyKey,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sale recorded. Stock reduced automatically.");
    setCart([]); setCustomerId(""); setDiscount("0"); setShowCustomer(false); setSaleAttemptKey(null); setSaleAttemptSignature(null); void loadOptions(); onSaleCompleted();
  }

  const selectedItem = inventory.find((item) => item.id === selectedItemId);

  return (
    <section className="rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
      <header className="border-b border-[#edf0ed] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Walk-in first</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">New sale</h2><p className="mt-1 text-xs leading-5 text-[#74837e]">Tap the goods you want. The selected item comes directly from Inventory.</p></div>
          <div className="rounded-xl bg-[#f7f8f5] px-4 py-2.5 text-right"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#74837e]">Estimated profit</p><p className="font-heading text-lg font-bold text-[#182a28]">{money(estimatedGrossProfit)}</p></div>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <TopCard active={section === "Phone Parts"} icon={Smartphone} title="Phone Parts" description="Repair parts" onClick={() => chooseSection("Phone Parts")} />
          <TopCard active={section === "Accessories"} icon={Package} title="Accessories" description="Existing accessory stock" onClick={() => chooseSection("Accessories")} />
        </div>

        {section === "Phone Parts" ? (
          <div className="rounded-2xl border border-[#e6ebe7] bg-[#fbfcfa] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Phone brand</p>
            <div className="flex flex-wrap gap-2">{Object.keys(PHONE_PARTS).map((value) => <button key={value} type="button" onClick={() => chooseBrand(value)} className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${selectedBrand === value ? "border-[#123b34] bg-[#123b34] text-white" : "border-slate-200 bg-white text-slate-700"}`}>{value}</button>)}</div>

            <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Part type</p>
            <div className="flex flex-wrap gap-2">{partTypes.map((type) => <button key={type} type="button" onClick={() => choosePartType(type)} className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${selectedPartType === type ? "border-[#123b34] bg-[#123b34] text-white" : "border-slate-200 bg-white text-slate-700"}`}>{type}</button>)}</div>

            <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Model</p>
            {models.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {models.map((model) => {
                  const items = phoneParts.filter((item) => item.brand === selectedBrand && item.subcategory === selectedPartType && item.compatible_models === model);
                  const inStock = items.some((item) => item.quantity > 0);
                  return <button key={model} type="button" disabled={!inStock} onClick={() => chooseModel(model)} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${selectedModel === model ? "border-[#1d6a54] bg-[#eef4f1]" : "border-slate-200 bg-white"} disabled:opacity-40`}><InventoryImage src={items.find((item) => item.image_url)?.image_url || null} alt={model} size="sm" /><p className="mt-2 truncate text-sm font-bold text-slate-800">{model}</p><p className="mt-1 text-[10px] text-slate-500">{inStock ? "In stock" : "Out of stock"}</p></button>;
                })}
              </div>
            ) : <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">No {selectedBrand} {selectedPartType} models have been added to Inventory yet.</div>}

            {selectedPartType === "Back Glass" && selectedModel && variants.length > 0 && (
              <>
                <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Colour</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {variants.map((variant) => {
                    const item = modelItems.find((entry) => entry.item_name.endsWith(" - " + variant));
                    return <button key={variant} type="button" disabled={!item || item.quantity <= 0} onClick={() => chooseVariant(variant)} className={`rounded-xl border p-3 text-left ${selectedVariant === variant ? "border-[#1d6a54] bg-[#eef4f1]" : "border-slate-200 bg-white"} disabled:opacity-40`}><p className="text-sm font-bold text-slate-800">{variant}</p><p className="mt-1 text-[10px] text-slate-500">{item?.quantity || 0} in stock</p></button>;
                  })}
                </div>
              </>
            )}

            {selectedItem && <SelectedItem item={selectedItem} quantity={selectedQty} onQuantityChange={setSelectedQty} onAdd={addToCart} />}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e6ebe7] bg-[#fbfcfa] p-4">
            {!accessoryGroupName ? (
              <>
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Accessory group</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {accessoryGroups.map((group) => <button key={group} type="button" onClick={() => setAccessoryGroupName(group)} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-[#1d6a54] hover:shadow-sm"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Package className="size-5" /></span><ChevronRight className="size-4 text-slate-400" /></div><p className="mt-4 text-sm font-bold text-slate-800">{group}</p><p className="mt-1 text-[11px] text-slate-500">{accessories.filter((item) => accessoryGroup(item) === group).length} items</p></button>)}
                  {!accessoryGroups.length && <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No accessories have been added to Inventory yet.</div>}
                </div>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setAccessoryGroupName(""); setSelectedItemId(""); }} className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]"><ChevronRight className="size-3 rotate-180" /> Accessories</button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {accessoryItems.map((item) => <button key={item.id} type="button" disabled={item.quantity <= 0} onClick={() => setSelectedItemId(item.id)} className={`rounded-2xl border bg-white p-3 text-left ${selectedItemId === item.id ? "border-[#1d6a54] bg-[#eef4f1]" : "border-slate-200"} disabled:opacity-40`}><div className="flex h-32 items-center justify-center rounded-xl bg-[#f7f8f5]"><InventoryImage src={item.image_url} alt={item.item_name} size="md" /></div><p className="mt-3 text-sm font-bold text-slate-800">{item.item_name}</p><p className="mt-1 text-xs text-slate-500">{money(item.selling_price)} · {item.quantity} in stock</p></button>)}
                </div>
                {selectedItem && <SelectedItem item={selectedItem} quantity={selectedQty} onQuantityChange={setSelectedQty} onAdd={addToCart} />}
              </>
            )}
          </div>
        )}

        {cart.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-[#e6ebe7]">
            <Table><TableHeader><TableRow className="bg-[#f7f8f5]"><TableHead>Goods</TableHead><TableHead>Qty</TableHead><TableHead>Unit price</TableHead><TableHead>Minimum</TableHead><TableHead>Total</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{cart.map((line) => { const belowFloor = line.unit_price < line.minimum_selling_price; return <TableRow key={line.inventory_id}><TableCell className="min-w-[190px] font-medium">{line.item_name}{belowFloor && <p className="mt-1 text-[11px] font-semibold text-amber-700">Below minimum — authorisation required</p>}</TableCell><TableCell>{line.quantity}</TableCell><TableCell><Input aria-label={`Price for ${line.item_name}`} type="number" min="0" step="0.01" value={line.unit_price} onChange={(e) => updateLine(line.inventory_id, { unit_price: Number(e.target.value) || 0, price_override: false })} className="h-9 w-28 rounded-lg" /></TableCell><TableCell className="text-xs text-slate-500">{money(line.minimum_selling_price)}</TableCell><TableCell className="font-semibold">{money(line.quantity * line.unit_price)}</TableCell><TableCell><Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCart(cart.filter((item) => item.inventory_id !== line.inventory_id))}>Remove</Button></TableCell></TableRow>; })}</TableBody>
            </Table>
          </div>
        ) : <div className="rounded-2xl border border-dashed border-[#d6dfda] px-5 py-10 text-center"><p className="text-sm font-semibold text-[#394b45]">Nothing added yet</p><p className="mt-1 text-xs text-[#87958f]">Tap a product above, choose quantity, then add it.</p></div>}

        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="text-xs font-semibold text-[#687974]">Payment<select className={`${selectClass} mt-1`} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
          <label className="text-xs font-semibold text-[#687974]">Discount<select className={`${selectClass} mt-1`} value={discount} onChange={(e) => setDiscount(e.target.value)}><option value="0">No discount</option><option value="500">₦500</option><option value="1000">₦1,000</option><option value="2000">₦2,000</option></select></label>
        </div>

        <div className="border-t border-[#edf0ed] pt-4">
          <button type="button" onClick={() => setShowCustomer((value) => !value)} className="text-xs font-bold text-[#1d6a54]">{showCustomer ? "− Hide customer details" : "+ Add customer details (optional)"}</button>
          {showCustomer && <div className="mt-3"><select className={selectClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Select saved customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}{customer.phone ? ` · ${customer.phone}` : ""}</option>)}</select></div>}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl bg-[#123b34] p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><p className="text-xs text-[#c7d8d2]">{cart.length} item{cart.length === 1 ? "" : "s"} · Subtotal {money(subtotal)}</p><p className="mt-1 font-heading text-2xl font-bold">{money(total)}</p></div>
          <Button onClick={complete} disabled={loading || !cart.length} className="h-12 rounded-xl bg-[#d7a95a] px-7 font-bold text-[#123b34] hover:bg-[#e5bc75]">{loading ? "Processing…" : cart.some((line) => line.unit_price < line.minimum_selling_price) || total < cart.reduce((sum, line) => sum + line.quantity * line.minimum_selling_price, 0) ? "Request Boss approval" : "Complete sale"}</Button>
        </div>
      </div>
    </section>
  );
}

function TopCard({ active, icon: Icon, title, description, onClick }: { active:boolean; icon:typeof Package; title:string; description:string; onClick:()=>void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-[#1d6a54] bg-[#eef4f1] ring-2 ring-[#1d6a54]/10" : "border-[#dfe6df] bg-white"}`}><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#1d6a54] ring-1 ring-[#dfe6df]"><Icon className="size-5" /></span><ChevronRight className="size-4 text-slate-400" /></div><p className="mt-3 text-sm font-bold text-slate-800">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></button>;
}

function SelectedItem({ item, quantity, onQuantityChange, onAdd }: { item:InventoryItem; quantity:string; onQuantityChange:(value:string)=>void; onAdd:()=>void }) {
  return <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#dfe6df] bg-white p-3 shadow-sm"><InventoryImage src={item.image_url} alt={item.item_name} /><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{item.item_name}</p><p className="text-xs text-slate-500">{money(item.selling_price)} · {item.quantity} in stock</p></div><Input aria-label="Quantity" type="number" min="1" step="1" value={quantity} onChange={(e) => onQuantityChange(e.target.value)} className="h-11 w-24 rounded-xl" /><Button type="button" onClick={onAdd} className="h-11 rounded-xl bg-[#123b34] px-5 hover:bg-[#1d6a54]">Add</Button></div>;
}
