"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";
import { customerService } from "@/services/customerService";
import { openWhatsApp } from "@/lib/whatsapp";

type Person = { id: string; full_name: string; phone: string | null };
type Payable = { id: string; person_name: string; phone: string | null; description: string | null; agreed_amount: number; amount_paid: number; balance: number; due_date: string | null; computed_status: string; payment_count: number; created_at: string; customer_id?: string | null };
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
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Payable | null>(null);
  const [items, setItems] = useState<PayableItem[]>([]);
  const [payments, setPayments] = useState<PayablePayment[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [personMode, setPersonMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState("");
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
    const [payableResult, peopleResult] = await Promise.all([businessOperationsService.getSupplierPayables(), customerService.getCustomers()]);
    if (!payableResult.error) setPayables((payableResult.data ?? []) as Payable[]); else setMessage(payableResult.error.message);
    if (!peopleResult.error) setPeople((peopleResult.data ?? []) as Person[]);
  }

  async function loadAccount(payable: Payable) {
    setSelected(payable);
    const [itemResult, paymentResult] = await Promise.all([
      businessOperationsService.getSupplierPayableItems(payable.id),
      businessOperationsService.getSupplierPayablePayments(payable.id),
    ]);
    setItems((itemResult.data ?? []) as PayableItem[]);
    setPayments((paymentResult.data ?? []) as PayablePayment[]);
    setPaymentAmount(""); setAddItemName(""); setAddItemQty("1"); setAddItemValue("");
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payables.filter((p) => {
      const matchesSearch = !q || [p.person_name, p.phone, p.description].some(v => String(v ?? "").toLowerCase().includes(q));
      const status = statusOf(p).label;
      const matchesFilter = filter === "all" || (filter === "open" && status !== "Paid") || (filter === "overdue" && status === "Overdue") || (filter === "due" && status === "Due soon") || (filter === "paid" && status === "Paid");
      return matchesSearch && matchesFilter;
    });
  }, [payables, search, filter]);

  const outstanding = payables.reduce((s, p) => s + Math.max(Number(p.balance), 0), 0);
  const overdue = payables.filter(p => statusOf(p).label === "Overdue").reduce((s, p) => s + Number(p.balance), 0);
  const dueSoon = payables.filter(p => statusOf(p).label === "Due soon").reduce((s, p) => s + Number(p.balance), 0);

  function choosePerson(id: string) {
    setCustomerId(id);
    const found = people.find(p => p.id === id);
    if (found) { setPerson(found.full_name); setPhone(found.phone ?? ""); }
  }

  async function createPayable(e: FormEvent) {
    e.preventDefault();
    const qty = Number(quantity), unit = Number(unitValue), total = qty * unit;
    if (!person.trim() || !goods.trim() || qty <= 0 || unit <= 0) { setMessage("Enter the person's name, item, quantity and value."); return; }
    setSaving(true);
    let linkedId = personMode === "existing" ? customerId || null : null;
    if (personMode === "new") {
      if (!phone.trim()) { setMessage("A phone number is required when creating a new person."); setSaving(false); return; }
      const created = await customerService.addCustomer({ full_name: person.trim(), phone: phone.trim(), email: null, address: null });
      if (created.error || !created.data) { setMessage(created.error?.message ?? "Could not create person."); setSaving(false); return; }
      linkedId = created.data.id;
    }
    const result = await businessOperationsService.createSupplierPayable({ personName: person.trim(), phone, customerId: linkedId, description: goods.trim(), agreedAmount: total, dueDate: dueDate || null, notes });
    if (result.error || !result.data) { setMessage(result.error?.message ?? "Could not create credit record."); setSaving(false); return; }
    const itemResult = await businessOperationsService.addSupplierPayableItem({ payableId: result.data.id, itemName: goods.trim(), quantity: qty, unitValue: unit });
    setMessage(itemResult.error ? itemResult.error.message : "Credit account recorded.");
    setCustomerId(""); setPerson(""); setPhone(""); setGoods(""); setQuantity("1"); setUnitValue(""); setDueDate(""); setNotes(""); setPersonMode("existing");
    await load(); setSaving(false);
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault(); if (!selected) return;
    const value = Number(paymentAmount);
    if (value <= 0 || value > Number(selected.balance) + 0.01) { setMessage("Payment cannot be greater than the outstanding balance."); return; }
    setSaving(true);
    const result = await businessOperationsService.recordSupplierPayablePayment({ payableId: selected.id, amount: value, paymentMethod: paymentMethod as "cash" | "transfer" | "pos" | "other" });
    setMessage(result.error ? result.error.message : "Payment recorded.");
    if (!result.error) { await load(); const fresh = await businessOperationsService.getSupplierPayable(selected.id); if (!fresh.error && fresh.data) await loadAccount(fresh.data as Payable); }
    setSaving(false);
  }

  async function addItem(e: FormEvent) {
    e.preventDefault(); if (!selected || !addItemName.trim() || Number(addItemQty) <= 0 || Number(addItemValue) <= 0) return;
    setSaving(true);
    const result = await businessOperationsService.addSupplierPayableItemAndIncreaseBalance({ payableId: selected.id, itemName: addItemName.trim(), quantity: Number(addItemQty), unitValue: Number(addItemValue) });
    setMessage(result.error ? result.error.message : "Item added to the account.");
    if (!result.error) { await load(); const fresh = await businessOperationsService.getSupplierPayable(selected.id); if (!fresh.error && fresh.data) await loadAccount(fresh.data as Payable); }
    setSaving(false);
  }

  function remind(p: Payable) {
    if (!p.phone) { setMessage("This person has no phone/WhatsApp number saved."); return; }
    const due = p.due_date ? ` It was due on ${new Date(`${p.due_date}T00:00:00`).toLocaleDateString("en-NG")}.` : "";
    if (openWhatsApp(p.phone, `Hello ${p.person_name}, this is Amezing Limited. This is a reminder that we currently owe you ${money(Number(p.balance))}.${due} Thank you.`)) setMessage("WhatsApp opened with the reminder ready to send.");
  }

  return <AppLayout><main className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a641d]">Credit book</p><h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">People Amezing Owes</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">Goods or value we collected from someone and still need to pay. Credit stays separate from people who owe Amezing.</p></div><Link href="/outstanding" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dfe6df] bg-white px-5 text-sm font-bold text-[#183b34]">People who owe us</Link></header>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Outstanding" value={money(outstanding)} /><Metric label="Overdue" value={money(overdue)} tone="red" /><Metric label="Due within 7 days" value={money(dueSoon)} tone="amber" /></section>
    <section className="rounded-2xl border border-[#d7a95a]/35 bg-[#fffaf0] p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a641d]">New credit account</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">Record goods collected</h2></div><form onSubmit={createPayable} className="mt-5 space-y-4">
      <div className="flex gap-2"><button type="button" onClick={() => setPersonMode("existing")} className={`rounded-lg px-3 py-2 text-xs font-bold ${personMode === "existing" ? "bg-[#123b34] text-white" : "border bg-white text-slate-600"}`}>Existing person</button><button type="button" onClick={() => { setPersonMode("new"); setCustomerId(""); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${personMode === "new" ? "bg-[#123b34] text-white" : "border bg-white text-slate-600"}`}>New person</button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {personMode === "existing" ? <label className="text-xs font-bold text-[#53635d]">Person<select value={customerId} onChange={e => choosePerson(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-normal"><option value="">Select person</option>{people.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.phone ? ` · ${p.phone}` : ""}</option>)}</select></label> : <Field label="Person" value={person} onChange={setPerson} placeholder="Name" />}
        <Field label="Phone / WhatsApp" value={phone} onChange={setPhone} placeholder="080..." />
        <Field label="Goods collected" value={goods} onChange={setGoods} placeholder="e.g. iPhone 11 screen" />
        <Field label="Qty" value={quantity} onChange={setQuantity} placeholder="1" type="number" />
        <Field label="Value each" value={unitValue} onChange={setUnitValue} placeholder="₦0" type="number" />
        <label className="text-xs font-bold text-[#53635d]">Due date<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-normal" /></label>
        <Field label="Note" value={notes} onChange={setNotes} placeholder="Optional" />
        <button disabled={saving || (personMode === "existing" && !customerId)} className="mt-5 h-11 rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Add credit"}</button>
      </div>
    </form></section>
    {message && <div className="rounded-xl border border-[#dfe6df] bg-white px-4 py-3 text-sm font-medium text-[#53635d]">{message}</div>}
    <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white"><div className="flex flex-col gap-3 border-b border-[#edf0ed] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Accounts</p><h2 className="mt-1 font-heading text-lg font-bold">People we owe</h2></div><div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone or goods" className="h-10 rounded-xl border border-[#dfe6df] px-3 text-sm" /><select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm"><option value="open">All active</option><option value="overdue">Overdue</option><option value="due">Due soon</option><option value="paid">Paid</option><option value="all">All records</option></select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#f7f8f5]"><tr><th className="px-5 py-3">Person</th><th className="px-5 py-3">Goods</th><th className="px-5 py-3">Agreed</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Balance</th><th className="px-5 py-3">Due</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr></thead><tbody>{visible.map(p => { const status = statusOf(p); return <tr key={p.id} className="border-t border-[#edf0ed]"><td className="px-5 py-4"><button onClick={() => void loadAccount(p)} className="text-left font-bold text-[#183b34] hover:underline">{p.person_name}</button><div className="text-[11px] text-[#8b918e]">{p.phone || "No number"}</div></td><td className="px-5 py-4 text-[#53635d]">{p.description || "—"}</td><td className="px-5 py-4">{money(Number(p.agreed_amount))}</td><td className="px-5 py-4 text-emerald-700">{money(Number(p.amount_paid))}</td><td className="px-5 py-4 font-bold text-red-700">{money(Number(p.balance))}</td><td className="px-5 py-4 text-xs">{p.due_date ? new Date(`${p.due_date}T00:00:00`).toLocaleDateString("en-NG") : "No date"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => void loadAccount(p)} className="rounded-lg border border-[#dfe6df] px-3 py-2 text-xs font-bold">Open</button>{Number(p.balance) > 0.01 && p.phone && <button onClick={() => remind(p)} className="rounded-lg bg-[#e9f5ef] px-3 py-2 text-xs font-bold text-[#176447]">WhatsApp</button>}</div></td></tr>; })}</tbody></table>{visible.length === 0 && <div className="py-12 text-center text-sm text-[#74837e]">No credit accounts match this view.</div>}</div></section>
    {selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 p-4"><div className="mx-auto my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-[#edf0ed] p-6"><div><h2 className="font-heading text-2xl font-bold text-[#182a28]">{selected.person_name}</h2><p className="text-sm text-[#74837e]">{selected.phone || "No phone"} · Amezing owes {money(Number(selected.balance))}</p></div><button onClick={() => setSelected(null)} className="rounded-lg border px-3 py-2 text-sm font-bold">Close</button></div><div className="grid gap-5 p-6 lg:grid-cols-2"><section><h3 className="font-bold">Goods collected</h3><div className="mt-3 space-y-2">{items.map(i => <div key={i.id} className="flex justify-between rounded-xl bg-[#f7f8f5] p-3 text-sm"><span>{i.item_name} × {i.quantity}</span><b>{money(i.quantity * i.unit_value)}</b></div>)}</div><form onSubmit={addItem} className="mt-4 grid gap-2 sm:grid-cols-3"><input value={addItemName} onChange={e => setAddItemName(e.target.value)} placeholder="Another item" className="h-10 rounded-lg border px-3 text-sm" /><input value={addItemQty} onChange={e => setAddItemQty(e.target.value)} type="number" min="1" placeholder="Qty" className="h-10 rounded-lg border px-3 text-sm" /><input value={addItemValue} onChange={e => setAddItemValue(e.target.value)} type="number" min="1" placeholder="Value" className="h-10 rounded-lg border px-3 text-sm sm:col-span-2" /><button disabled={saving} className="h-10 rounded-lg bg-[#123b34] text-xs font-bold text-white">Add item</button></form></section><section><h3 className="font-bold">Payments</h3><form onSubmit={recordPayment} className="mt-3 flex gap-2"><input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" min="1" max={selected.balance} placeholder="Amount" className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm" /><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="h-10 rounded-lg border bg-white px-2 text-sm"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select><button disabled={saving || Number(selected.balance) <= 0} className="h-10 rounded-lg bg-[#123b34] px-3 text-xs font-bold text-white">Pay</button></form><div className="mt-4 space-y-2">{payments.map(p => <div key={p.id} className="flex justify-between rounded-xl border p-3 text-sm"><span>{new Date(p.paid_at).toLocaleDateString("en-NG")} · {p.payment_method}</span><b>{money(Number(p.amount))}</b></div>)}</div></section></div></div></div>}
  </main></AppLayout>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) { return <label className="text-xs font-bold text-[#53635d]">{label}<input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-normal" /></label>; }
function Metric({ label, value, tone }: { label: string; value: string; tone?: "red" | "amber" }) { return <div className={`rounded-2xl border bg-white p-5 ${tone === "red" ? "border-red-100" : tone === "amber" ? "border-amber-100" : "border-[#dfe6df]"}`}><p className="text-xs font-bold uppercase tracking-wider text-[#74837e]">{label}</p><p className="mt-2 text-2xl font-bold text-[#182a28]">{value}</p></div>; }
