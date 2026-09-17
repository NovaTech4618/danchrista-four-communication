"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";
import { openWhatsApp } from "@/lib/whatsapp";

type Payable = {
  id: string;
  person_name: string;
  phone: string | null;
  description: string | null;
  agreed_amount: number;
  amount_paid: number;
  balance: number;
  due_date: string | null;
  computed_status: "open" | "part_paid" | "paid" | "cancelled" | string;
  payment_count: number;
  notes?: string | null;
  created_at: string;
};

type PayableItem = { id: string; item_name: string; quantity: number; unit_value: number; created_at: string };
type PayablePayment = { id: string; amount: number; payment_method: string; paid_at: string; note: string | null };

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

function statusOf(p: Payable) {
  if (p.computed_status === "paid" || Number(p.balance) <= 0.01) return { label: "Paid", className: "bg-emerald-50 text-emerald-700" };
  if (p.due_date && new Date(`${p.due_date}T23:59:59`) < new Date()) return { label: "Overdue", className: "bg-red-50 text-red-700" };
  if (p.due_date && new Date(`${p.due_date}T23:59:59`) <= new Date(Date.now() + 7 * 86400000)) return { label: "Due soon", className: "bg-amber-50 text-amber-700" };
  return { label: p.computed_status === "part_paid" ? "Part paid" : "Open", className: "bg-slate-50 text-slate-700" };
}

export default function CreditPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [selected, setSelected] = useState<Payable | null>(null);
  const [items, setItems] = useState<PayableItem[]>([]);
  const [payments, setPayments] = useState<PayablePayment[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [person, setPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [goods, setGoods] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitValue, setUnitValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [addItemName, setAddItemName] = useState("");
  const [addItemQty, setAddItemQty] = useState("1");
  const [addItemValue, setAddItemValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const result = await businessOperationsService.getSupplierPayables();
    if (!result.error) setPayables((result.data ?? []) as Payable[]);
    else setMessage(result.error.message);
  }

  async function loadAccount(payable: Payable) {
    setSelected(payable);
    const [itemResult, paymentResult] = await Promise.all([
      businessOperationsService.getSupplierPayableItems(payable.id),
      businessOperationsService.getSupplierPayablePayments(payable.id),
    ]);
    setItems((itemResult.data ?? []) as PayableItem[]);
    setPayments((paymentResult.data ?? []) as PayablePayment[]);
    setPaymentAmount("");
    setAddItemName("");
    setAddItemQty("1");
    setAddItemValue("");
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payables.filter((p) => {
      const matchesSearch = !q || [p.person_name, p.phone, p.description].some((v) => String(v ?? "").toLowerCase().includes(q));
      const status = statusOf(p).label;
      const matchesFilter = filter === "all" || (filter === "open" && status !== "Paid") || (filter === "overdue" && status === "Overdue") || (filter === "due" && status === "Due soon") || (filter === "paid" && status === "Paid");
      return matchesSearch && matchesFilter;
    });
  }, [payables, search, filter]);

  const outstanding = payables.filter((p) => Number(p.balance) > 0.01).reduce((s, p) => s + Number(p.balance), 0);
  const overdue = payables.filter((p) => statusOf(p).label === "Overdue").reduce((s, p) => s + Number(p.balance), 0);
  const dueSoon = payables.filter((p) => statusOf(p).label === "Due soon").reduce((s, p) => s + Number(p.balance), 0);

  async function createPayable(e: FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const unit = Number(unitValue);
    const total = qty * unit;
    if (!person.trim() || !goods.trim() || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unit) || unit <= 0) {
      setMessage("Enter the person's name, item, quantity and value.");
      return;
    }
    setSaving(true);
    const result = await businessOperationsService.createSupplierPayable({ personName: person, phone, description: goods, agreedAmount: total, dueDate: dueDate || null, notes });
    if (result.error || !result.data) {
      setMessage(result.error?.message ?? "Could not create credit record.");
      setSaving(false);
      return;
    }
    const itemResult = await businessOperationsService.addSupplierPayableItem({ payableId: result.data.id, itemName: goods, quantity: qty, unitValue: unit });
    setMessage(itemResult.error ? itemResult.error.message : "Credit account recorded.");
    setPerson(""); setPhone(""); setGoods(""); setQuantity("1"); setUnitValue(""); setDueDate(""); setNotes("");
    await load();
    setSaving(false);
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const value = Number(paymentAmount);
    if (value <= 0 || value > Number(selected.balance) + 0.01) {
      setMessage("Payment cannot be greater than the outstanding balance.");
      return;
    }
    setSaving(true);
    const result = await businessOperationsService.recordSupplierPayablePayment({ payableId: selected.id, amount: value, paymentMethod: paymentMethod as "cash" | "transfer" | "pos" | "other" });
    setMessage(result.error ? result.error.message : "Payment recorded.");
    if (!result.error) {
      await load();
      const fresh = await businessOperationsService.getSupplierPayable(selected.id);
      if (!fresh.error && fresh.data) await loadAccount(fresh.data as Payable);
    }
    setSaving(false);
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!selected || !addItemName.trim() || Number(addItemQty) <= 0 || Number(addItemValue) <= 0) return;
    setSaving(true);
    const result = await businessOperationsService.addSupplierPayableItem({ payableId: selected.id, itemName: addItemName, quantity: Number(addItemQty), unitValue: Number(addItemValue) });
    setMessage(result.error ? result.error.message : "Item added to the account.");
    if (!result.error) {
      await load();
      const fresh = await businessOperationsService.getSupplierPayable(selected.id);
      if (!fresh.error && fresh.data) await loadAccount(fresh.data as Payable);
    }
    setSaving(false);
  }

  function remind(p: Payable) {
    if (!p.phone) { setMessage("This person has no phone/WhatsApp number saved."); return; }
    const due = p.due_date ? ` It was due on ${new Date(`${p.due_date}T00:00:00`).toLocaleDateString("en-NG")}.` : "";
    const message = `Hello ${p.person_name}, this is Danchrista Four Communication. This is a reminder that we currently owe you ${money(Number(p.balance))}.${due} Thank you.`;
    if (openWhatsApp(p.phone, message)) setMessage("WhatsApp opened with the reminder ready to send.");
  }

  return (
    <AppLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a641d]">Credit book</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">People Danchrista Owes</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">Goods or value we collected from someone and still need to pay. This is separate from customers who owe Danchrista.</p>
          </div>
          <Link href="/outstanding" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dfe6df] bg-white px-5 text-sm font-bold text-[#183b34]">People who owe us</Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Outstanding" value={money(outstanding)} />
          <Metric label="Overdue" value={money(overdue)} tone="red" />
          <Metric label="Due within 7 days" value={money(dueSoon)} tone="amber" />
        </section>

        <section className="rounded-2xl border border-[#d7a95a]/35 bg-[#fffaf0] p-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a641d]">New credit account</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">Record goods collected</h2></div>
          <form onSubmit={createPayable} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            <Field label="Person" value={person} onChange={setPerson} placeholder="Name" />
            <Field label="Phone / WhatsApp" value={phone} onChange={setPhone} placeholder="080..." />
            <Field label="Goods collected" value={goods} onChange={setGoods} placeholder="e.g. iPhone 11 screen" />
            <Field label="Qty" value={quantity} onChange={setQuantity} placeholder="1" type="number" />
            <Field label="Value each" value={unitValue} onChange={setUnitValue} placeholder="₦0" type="number" />
            <label className="text-xs font-bold text-[#53635d]">Due date<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-normal" /></label>
            <Field label="Note" value={notes} onChange={setNotes} placeholder="Optional" />
            <button disabled={saving} className="mt-5 h-11 rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Add credit"}</button>
          </form>
        </section>

        {message && <div className="rounded-xl border border-[#dfe6df] bg-white px-4 py-3 text-sm font-medium text-[#53635d]">{message}</div>}

        <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#edf0ed] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Accounts</p><h2 className="mt-1 font-heading text-lg font-bold">People we owe</h2></div>
            <div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone or goods" className="h-10 rounded-xl border border-[#dfe6df] px-3 text-sm" /><select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm"><option value="open">All active</option><option value="overdue">Overdue</option><option value="due">Due soon</option><option value="paid">Paid</option><option value="all">All records</option></select></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#f7f8f5]"><tr><th className="px-5 py-3">Person</th><th className="px-5 py-3">Goods</th><th className="px-5 py-3">Agreed</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Balance</th><th className="px-5 py-3">Due</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr></thead><tbody>{visible.map(p => { const status = statusOf(p); return <tr key={p.id} className="border-t border-[#edf0ed]"><td className="px-5 py-4"><button onClick={() => void loadAccount(p)} className="text-left font-bold text-[#183b34] hover:underline">{p.person_name}</button><div className="text-[11px] text-[#8b918e]">{p.phone || "No number"}</div></td><td className="px-5 py-4 text-[#53635d]">{p.description || "—"}</td><td className="px-5 py-4">{money(Number(p.agreed_amount))}</td><td className="px-5 py-4 text-emerald-700">{money(Number(p.amount_paid))}</td><td className="px-5 py-4 font-bold text-red-700">{money(Number(p.balance))}</td><td className="px-5 py-4 text-xs">{p.due_date ? new Date(`${p.due_date}T00:00:00`).toLocaleDateString("en-NG") : "No date"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => void loadAccount(p)} className="rounded-lg border border-[#dfe6df] px-3 py-2 text-xs font-bold">Open</button>{Number(p.balance) > 0.01 && p.phone && <button onClick={() => remind(p)} className="rounded-lg bg-[#e9f5ef] px-3 py-2 text-xs font-bold text-[#176447]">WhatsApp</button>}</div></td></tr>; })}</tbody></table>{visible.length === 0 && <div className="py-12 text-center text-sm text-[#74837e]">No credit accounts match this view.</div>}</div>
        </section>

        {selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 p-4"><div className="mx-auto my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl"><div className="flex flex-col gap-4 border-b border-[#edf0ed] p-6 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a641d]">Credit account</p><h2 className="mt-1 font-heading text-2xl font-bold text-[#182a28]">{selected.person_name}</h2><p className="mt-1 text-sm text-[#74837e]">{selected.phone || "No phone saved"}</p></div><div className="flex gap-2"><button onClick={() => remind(selected)} disabled={!selected.phone || Number(selected.balance) <= 0.01} className="rounded-xl bg-[#e9f5ef] px-4 py-2 text-sm font-bold text-[#176447] disabled:opacity-40">WhatsApp</button><button onClick={() => setSelected(null)} className="rounded-xl border border-[#dfe6df] px-4 py-2 text-sm font-bold">Close</button></div></div>
          <div className="grid gap-3 p-6 sm:grid-cols-4"><Metric label="Agreed" value={money(Number(selected.agreed_amount))} /><Metric label="Paid" value={money(Number(selected.amount_paid))} /><Metric label="Outstanding" value={money(Number(selected.balance))} tone="red" /><Metric label="Due" value={selected.due_date ? new Date(`${selected.due_date}T00:00:00`).toLocaleDateString("en-NG") : "No date"} tone="amber" /></div>
          <div className="grid gap-5 border-t border-[#edf0ed] p-6 lg:grid-cols-2">
            <section className="rounded-xl border border-[#dfe6df] p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Items</p><h3 className="mt-1 font-bold">Goods collected</h3></div></div><div className="mt-4 space-y-2">{items.map(i => <div key={i.id} className="flex items-center justify-between rounded-lg bg-[#f7f8f5] px-3 py-2 text-sm"><span>{i.item_name} × {Number(i.quantity)}</span><strong>{money(Number(i.quantity) * Number(i.unit_value))}</strong></div>)}{items.length === 0 && <p className="text-sm text-[#74837e]">No item breakdown recorded.</p>}</div><form onSubmit={addItem} className="mt-4 grid gap-2 sm:grid-cols-4"><input value={addItemName} onChange={e => setAddItemName(e.target.value)} placeholder="Add item" className="h-10 rounded-lg border px-3 text-sm sm:col-span-2"/><input value={addItemQty} onChange={e => setAddItemQty(e.target.value)} type="number" min="1" placeholder="Qty" className="h-10 rounded-lg border px-3 text-sm"/><input value={addItemValue} onChange={e => setAddItemValue(e.target.value)} type="number" min="1" placeholder="Value each" className="h-10 rounded-lg border px-3 text-sm"/><button disabled={saving} className="h-10 rounded-lg bg-[#123b34] text-xs font-bold text-white sm:col-span-4">Add item to account</button></form></section>
            <section className="rounded-xl border border-[#dfe6df] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Payments</p><h3 className="mt-1 font-bold">Payment history</h3><div className="mt-4 space-y-2">{payments.map(p => <div key={p.id} className="flex items-center justify-between rounded-lg bg-[#f7f8f5] px-3 py-2 text-sm"><div><strong>{money(Number(p.amount))}</strong><div className="text-[11px] text-[#74837e]">{new Date(p.paid_at).toLocaleString("en-NG")} · {p.payment_method}</div></div><span className="text-xs text-emerald-700">Paid</span></div>)}{payments.length === 0 && <p className="text-sm text-[#74837e]">No payments yet.</p>}</div><form onSubmit={recordPayment} className="mt-4 grid gap-2 sm:grid-cols-2"><input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" min="1" max={selected.balance} placeholder={`Pay up to ${money(Number(selected.balance))}`} className="h-10 rounded-lg border px-3 text-sm"/><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select><button disabled={saving || Number(selected.balance) <= 0.01} className="h-10 rounded-lg bg-[#123b34] text-xs font-bold text-white sm:col-span-2">Record payment</button></form></section>
          </div>
        </div></div>}
      </main>
    </AppLayout>
  );
}

function Metric({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "red" | "amber" }) { const cls = tone === "red" ? "text-red-700" : tone === "amber" ? "text-[#8a641d]" : "text-[#183b34]"; return <div className="rounded-xl border border-[#dfe6df] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a8883]">{label}</p><p className={`mt-1 text-xl font-bold ${cls}`}>{value}</p></div>; }
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) { return <label className="text-xs font-bold text-[#53635d]">{label}<input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-normal" /></label>; }
