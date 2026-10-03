"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";
import { customerService } from "@/services/customerService";
import { engineerService } from "@/services/engineerService";
import { toast } from "sonner";

type Customer = { customer_id: string; customer_name: string; phone: string | null; debit: number; credit: number; balance: number };
type EngineerBalance = { engineer_id: string; total_debit: number; total_credit: number; balance: number };
type Engineer = { id: string; name: string; phone: string | null };
type Supplier = { id: string; person_name: string; phone: string | null; description: string | null; agreed_amount: number; amount_paid: number; balance: number; due_date: string | null; computed_status: string };
type Tab = "owed" | "weowe";
const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export default function OwedOwingPage() {
  const [tab, setTab] = useState<Tab>("owed");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [engineerBalances, setEngineerBalances] = useState<EngineerBalance[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<{ kind: "customer" | "engineer" | "supplier"; id: string; name: string; balance: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "pos" | "other">("cash");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<{ title: string; lines: string[] } | null>(null);

  async function load() {
    setLoading(true);
    const [c, e, eb, s] = await Promise.all([
      businessOperationsService.getCustomerBalances(),
      engineerService.getEngineers(),
      engineerService.getBalances(),
      businessOperationsService.getSupplierPayables(),
    ]);
    if (c.error) toast.error(c.error.message); else setCustomers((c.data ?? []) as Customer[]);
    if (e.error) toast.error(e.error.message); else setEngineers((e.data ?? []) as Engineer[]);
    if (eb.error) toast.error(eb.error.message); else setEngineerBalances((eb.data ?? []) as EngineerBalance[]);
    if (s.error) toast.error(s.error.message); else setSuppliers((s.data ?? []) as Supplier[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const engineerRows = useMemo(() => {
    const names = new Map(engineers.map(e => [e.id, e]));
    return engineerBalances.map(b => ({ ...b, name: names.get(b.engineer_id)?.name ?? "Unknown engineer", phone: names.get(b.engineer_id)?.phone ?? null })).filter(b => Number(b.balance) > 0);
  }, [engineers, engineerBalances]);

  const filteredCustomers = customers.filter(c => Number(c.balance) > 0 && `${c.customer_name} ${c.phone ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const filteredEngineers = engineerRows.filter(e => `${e.name} ${e.phone ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const filteredSuppliers = suppliers.filter(s => Number(s.balance) > 0 && `${s.person_name} ${s.phone ?? ""} ${s.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  const customerTotal = customers.reduce((n, r) => n + Math.max(Number(r.balance), 0), 0);
  const engineerTotal = engineerRows.reduce((n, r) => n + Math.max(Number(r.balance), 0), 0);
  const supplierTotal = suppliers.reduce((n, r) => n + Math.max(Number(r.balance), 0), 0);

  async function openHistory(kind: "customer" | "engineer" | "supplier", id: string, name: string) {
    if (kind === "engineer") {
      const result = await engineerService.getTransactions(id);
      if (result.error) return toast.error(result.error.message);
      setHistory({ title: name, lines: (result.data ?? []).map((t: any) => {
        const amount = Number(t.debit || 0) > 0 ? `Owed ${money(Number(t.debit))}` : `Paid ${money(Number(t.credit || 0))}`;
        return `${new Date(t.transaction_date).toLocaleDateString("en-NG")} · ${t.description || t.transaction_type} · ${amount}`;
      }) });
      return;
    }
    if (kind === "supplier") {
      const result = await businessOperationsService.getSupplierPayablePayments(id);
      if (result.error) return toast.error(result.error.message);
      setHistory({ title: name, lines: (result.data ?? []).map((p: any) => `${new Date(p.paid_at).toLocaleDateString("en-NG")} · Paid ${money(Number(p.amount))} · ${p.payment_method}`) });
      return;
    }
    const result = await businessOperationsService.getInvoices();
    if (result.error) return toast.error(result.error.message);
    const rows = (result.data ?? []).filter((i: any) => i.customer_id === id);
    setHistory({ title: name, lines: rows.map((i: any) => `${new Date(i.issued_at).toLocaleDateString("en-NG")} · ${i.invoice_number} · ${i.payment_status} · Owed ${money(Number(i.total))} · Paid ${money(Number(i.paid_amount))} · Balance ${money(Number(i.outstanding))}`) });
  }

  async function recordPayment() {
    if (!paymentTarget) return;
    const amount = Number(paymentAmount);
    if (amount <= 0 || amount > paymentTarget.balance + 0.01) {
      toast.error("Payment cannot be greater than the balance.");
      return;
    }
    setSaving(true);
    let result: { error: Error | null };
    if (paymentTarget.kind === "customer") {
      result = await businessOperationsService.recordCustomerBalancePayment(paymentTarget.id, amount, paymentMethod);
    } else if (paymentTarget.kind === "engineer") {
      result = await engineerService.recordPaymentIn(paymentTarget.id, amount, paymentMethod);
    } else {
      result = await businessOperationsService.recordSupplierPayablePayment({ payableId: paymentTarget.id, amount, paymentMethod });
    }
    if (result.error) toast.error(result.error.message);
    else { toast.success("Payment recorded."); setPaymentTarget(null); setPaymentAmount(""); await load(); }
    setSaving(false);
  }

  return <AppLayout><main className="space-y-6">
    <header>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a641d]">Daily book</p>
      <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Owed & Owing</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">One place to see who owes Amezing and who Amezing still needs to pay. Balances come from the real transaction records.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      <Card label="Customers owe us" value={money(customerTotal)} />
      <Card label="Engineers owe us" value={money(engineerTotal)} />
      <Card label="We owe suppliers / people" value={money(supplierTotal)} />
    </section>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex rounded-xl border border-[#dfe6df] bg-white p-1">
        <button onClick={() => setTab("owed")} className={tab === "owed" ? "rounded-lg bg-[#123b34] px-4 py-2 text-sm font-bold text-white" : "rounded-lg px-4 py-2 text-sm font-bold text-[#53635d]"}>Owed to us</button>
        <button onClick={() => setTab("weowe")} className={tab === "weowe" ? "rounded-lg bg-[#123b34] px-4 py-2 text-sm font-bold text-white" : "rounded-lg px-4 py-2 text-sm font-bold text-[#53635d]"}>We owe</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search person, phone or item" className="h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-4 text-sm sm:w-80" />
    </div>

    {tab === "owed" ? <section className="space-y-4">
      <AccountGroup title="Customers" description="Customers with unpaid sales or repair invoices." rows={filteredCustomers.map(c => ({ id: c.customer_id, name: c.customer_name, phone: c.phone, detail: "Customer account", owed: Number(c.debit), paid: Number(c.credit), balance: Number(c.balance), kind: "customer" as const }))} onPay={setPaymentTarget} onHistory={openHistory} />
      <AccountGroup title="Engineers" description="Parts/work issued to engineers that have not yet been paid for." rows={filteredEngineers.map(e => ({ id: e.engineer_id, name: e.name, phone: e.phone, detail: "Engineer account", owed: Number(e.total_debit), paid: Number(e.total_credit), balance: Number(e.balance), kind: "engineer" as const }))} onPay={setPaymentTarget} onHistory={openHistory} />
    </section> : <AccountGroup title="Suppliers & people" description="Sani, Ben and any other person the shop owes." rows={filteredSuppliers.map(s => ({ id: s.id, name: s.person_name, phone: s.phone, detail: s.description || "Supplier / person", owed: Number(s.agreed_amount), paid: Number(s.amount_paid), balance: Number(s.balance), kind: "supplier" as const }))} onPay={setPaymentTarget} onHistory={openHistory} />}

    {loading && <div className="rounded-xl border border-[#dfe6df] bg-white p-5 text-sm text-[#74837e]">Loading accounts…</div>}

    {history && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a641d]">History</p>
        <h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">{history.title}</h2>
        <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-[#edf0ed]">
          {history.lines.length ? history.lines.map((line, i) => <div key={i} className="border-b border-[#edf0ed] px-4 py-3 text-sm text-[#53635d] last:border-0">{line}</div>) : <div className="p-5 text-sm text-[#74837e]">No transaction history.</div>}
        </div>
        <button onClick={() => setHistory(null)} className="mt-4 h-11 w-full rounded-xl bg-[#123b34] text-sm font-bold text-white">Close</button>
      </div>
    </div>}

    {paymentTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a641d]">Record payment</p>
        <h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">{paymentTarget.name}</h2>
        <p className="mt-1 text-sm text-[#74837e]">Current balance: <strong>{money(paymentTarget.balance)}</strong></p>
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-bold text-[#53635d]">Amount<input autoFocus type="number" min="1" max={paymentTarget.balance} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] px-3 text-sm" placeholder="₦0" /></label>
          <label className="block text-xs font-bold text-[#53635d]">Payment method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></label>
          <div className="flex gap-2"><button onClick={() => setPaymentTarget(null)} className="h-11 flex-1 rounded-xl border border-[#dfe6df] text-sm font-bold text-[#53635d]">Cancel</button><button onClick={() => void recordPayment()} disabled={saving} className="h-11 flex-1 rounded-xl bg-[#123b34] text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Record payment"}</button></div>
        </div>
      </div>
    </div>}
  </main></AppLayout>;
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#dfe6df] bg-white p-5"><p className="text-xs font-semibold text-[#74837e]">{label}</p><p className="mt-2 font-heading text-2xl font-bold text-[#182a28]">{value}</p></div>; }

type Row = { id: string; name: string; phone: string | null; detail: string; owed: number; paid: number; balance: number; kind: "customer" | "engineer" | "supplier" };
function AccountGroup({ title, description, rows, onPay, onHistory }: { title: string; description: string; rows: Row[]; onPay: (v: { kind: Row["kind"]; id: string; name: string; balance: number }) => void; onHistory: (kind: Row["kind"], id: string, name: string) => Promise<void> }) {
  return <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white">
    <div className="border-b border-[#edf0ed] p-5"><h2 className="font-heading text-lg font-bold text-[#182a28]">{title}</h2><p className="mt-1 text-xs text-[#74837e]">{description}</p></div>
    {rows.length === 0 ? <div className="p-8 text-center text-sm text-[#74837e]">No outstanding balance.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[#f7f8f5]"><tr><th className="px-5 py-3">Person</th><th className="px-5 py-3">What it is</th><th className="px-5 py-3">Amount owed</th><th className="px-5 py-3">Amount paid</th><th className="px-5 py-3">Balance</th><th className="px-5 py-3">History</th><th /></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t border-[#edf0ed]"><td className="px-5 py-4"><p className="font-bold text-[#183b34]">{r.name}</p><p className="text-[11px] text-[#8b918e]">{r.phone || "No phone"}</p></td><td className="px-5 py-4 text-[#53635d]">{r.detail}</td><td className="px-5 py-4">{money(r.owed)}</td><td className="px-5 py-4 text-emerald-700">{money(r.paid)}</td><td className="px-5 py-4 font-bold text-amber-700">{money(r.balance)}</td><td className="px-5 py-4"><button onClick={() => void onHistory(r.kind, r.id, r.name)} className="text-xs font-bold text-[#1d6a54] hover:underline">View history</button></td><td className="px-5 py-4"><button onClick={() => onPay({ kind: r.kind, id: r.id, name: r.name, balance: r.balance })} className="rounded-lg bg-[#123b34] px-3 py-2 text-xs font-bold text-white">Record payment</button></td></tr>)}</tbody></table></div>}
  </section>;
}
