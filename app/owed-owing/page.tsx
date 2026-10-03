"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Bell, History, MessageCircle, RefreshCw, Settings2, Wallet } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { openWhatsApp } from "@/lib/whatsapp";
import { businessOperationsService } from "@/services/businessOperationsService";
import { customerService } from "@/services/customerService";
import { engineerService } from "@/services/engineerService";
import { toast } from "sonner";

type Kind = "customer" | "engineer" | "supplier";
type Tab = "owed" | "weowe";
type Row = { id: string; kind: Kind; name: string; phone: string | null; detail: string; owed: number; paid: number; balance: number; threshold: number; enabled: boolean };
type MoneyRow = { id: string; direction: "in" | "out"; amount: number; category: string; payment_method: string | null; description: string | null; occurred_at: string };
type SupplierPayment = { id: string; payable_id: string; amount: number; payment_method: string | null; paid_at: string; person_name?: string | null };
type Followup = { person_kind: Kind; person_id: string; threshold_amount: number; enabled: boolean };

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function OwedOwingPage() {
  const [tab, setTab] = useState<Tab>("owed");
  const [customers, setCustomers] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [engineerBalances, setEngineerBalances] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [moneyRows, setMoneyRows] = useState<MoneyRow[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [thresholdTarget, setThresholdTarget] = useState<Row | null>(null);
  const [thresholdInput, setThresholdInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<{ title: string; lines: string[] } | null>(null);

  const load = async () => {
    setLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [c, e, eb, s, f, ft, sp] = await Promise.all([
      businessOperationsService.getCustomerBalances(),
      engineerService.getEngineers(),
      engineerService.getBalances(),
      businessOperationsService.getSupplierPayables(),
      supabase.from("owed_owing_followups").select("person_kind,person_id,threshold_amount,enabled").order("created_at", { ascending: false }),
      supabase.from("financial_transactions").select("id,direction,amount,category,payment_method,description,occurred_at").gte("occurred_at", start.toISOString()).lt("occurred_at", end.toISOString()).order("occurred_at", { ascending: false }),
      supabase.from("supplier_payable_payments").select("id,payable_id,amount,payment_method,paid_at,supplier_payables(person_name)").gte("paid_at", start.toISOString()).lt("paid_at", end.toISOString()).order("paid_at", { ascending: false }),
    ]);

    if (c.error) toast.error(c.error.message); else setCustomers(c.data ?? []);
    if (e.error) toast.error(e.error.message); else setEngineers(e.data ?? []);
    if (eb.error) toast.error(eb.error.message); else setEngineerBalances(Array.isArray(eb.data) ? eb.data : []);
    if (s.error) toast.error(s.error.message); else setSuppliers(s.data ?? []);
    if (f.error) toast.error(f.error.message); else setFollowups((f.data ?? []) as Followup[]);
    if (ft.error) toast.error(ft.error.message); else setMoneyRows((ft.data ?? []) as MoneyRow[]);
    if (sp.error) toast.error(sp.error.message); else setSupplierPayments(((sp.data ?? []) as any[]).map(x => ({ ...x, person_name: Array.isArray(x.supplier_payables) ? x.supplier_payables[0]?.person_name : x.supplier_payables?.person_name })));

    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const followupMap = useMemo(() => new Map(followups.map(x => [`${x.person_kind}:${x.person_id}`, x])), [followups]);

  const rows: Row[] = useMemo(() => {
    const engineerMap = new Map(engineers.map(e => [e.id, e]));
    const customerRows: Row[] = customers.filter(c => Number(c.balance) > 0).map(c => {
      const f = followupMap.get(`customer:${c.customer_id}`);
      return { id: c.customer_id, kind: "customer", name: c.customer_name || "Customer", phone: c.phone ?? null, detail: "Customer account", owed: Number(c.debit), paid: Number(c.credit), balance: Number(c.balance), threshold: Number(f?.threshold_amount ?? 0), enabled: f?.enabled ?? false };
    });
    const engineerRows: Row[] = engineerBalances.filter(e => Number(e.balance) > 0).map(e => {
      const person = engineerMap.get(e.engineer_id);
      const f = followupMap.get(`engineer:${e.engineer_id}`);
      return { id: e.engineer_id, kind: "engineer", name: person?.name || "Engineer", phone: person?.phone ?? null, detail: "Engineer parts / services", owed: Number(e.total_debit), paid: Number(e.total_credit), balance: Number(e.balance), threshold: Number(f?.threshold_amount ?? 0), enabled: f?.enabled ?? false };
    });
    const supplierRows: Row[] = suppliers.filter(s => Number(s.balance) > 0).map(s => {
      const f = followupMap.get(`supplier:${s.id}`);
      return { id: s.id, kind: "supplier", name: s.person_name || "Supplier / person", phone: s.phone ?? null, detail: s.description || "Supplier / person", owed: Number(s.agreed_amount), paid: Number(s.amount_paid), balance: Number(s.balance), threshold: Number(f?.threshold_amount ?? 0), enabled: f?.enabled ?? false };
    });
    return tab === "owed" ? [...customerRows, ...engineerRows] : supplierRows;
  }, [customers, engineers, engineerBalances, suppliers, followupMap, tab]);

  const filtered = rows.filter(r => `${r.name} ${r.phone ?? ""} ${r.detail}`.toLowerCase().includes(search.trim().toLowerCase()));
  const collected = moneyRows.filter(x => x.direction === "in").reduce((n, x) => n + Number(x.amount), 0);
  const financialOut = moneyRows.filter(x => x.direction === "out").reduce((n, x) => n + Number(x.amount), 0);
  const supplierOut = supplierPayments.reduce((n, x) => n + Number(x.amount), 0);
  const paidOut = financialOut + supplierOut;
  const followupRows = [...rows].filter(r => r.enabled && r.threshold > 0 && r.balance >= r.threshold).sort((a, b) => b.balance - a.balance);
  const customerOutstanding = customers.reduce((n, r) => n + Math.max(0, Number(r.balance)), 0);
  const engineerOutstanding = engineerBalances.reduce((n, r) => n + Math.max(0, Number(r.balance)), 0);
  const supplierOutstanding = suppliers.reduce((n, r) => n + Math.max(0, Number(r.balance)), 0);

  async function saveThreshold() {
    if (!thresholdTarget) return;
    const value = Number(thresholdInput);
    if (!Number.isFinite(value) || value <= 0) { toast.error("Enter a limit greater than ₦0."); return; }
    setSaving(true);
    const result = await supabase.from("owed_owing_followups").upsert({
      person_kind: thresholdTarget.kind,
      person_id: thresholdTarget.id,
      threshold_amount: value,
      enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "company_id,person_kind,person_id" });
    if (result.error) toast.error(result.error.message);
    else { toast.success("Follow-up limit saved."); setThresholdTarget(null); await load(); }
    setSaving(false);
  }

  async function openHistory(row: Row) {
    if (row.kind === "engineer") {
      const result = await engineerService.getTransactions(row.id);
      if (result.error) { toast.error(result.error.message); return; }
      setHistory({ title: row.name, lines: (result.data ?? []).map((t: any) => `${new Date(t.transaction_date).toLocaleDateString("en-NG")} · ${t.description || t.transaction_type} · ${Number(t.debit || 0) > 0 ? "Owed " + money(t.debit) : "Paid " + money(t.credit || 0)}`) });
      return;
    }
    if (row.kind === "supplier") {
      const result = await businessOperationsService.getSupplierPayablePayments(row.id);
      if (result.error) { toast.error(result.error.message); return; }
      setHistory({ title: row.name, lines: (result.data ?? []).map((p: any) => `${new Date(p.paid_at).toLocaleDateString("en-NG")} · Paid ${money(p.amount)} · ${p.payment_method || "payment"}`) });
      return;
    }
    const result = await businessOperationsService.getInvoices();
    if (result.error) { toast.error(result.error.message); return; }
    const invoices = (result.data ?? []).filter((i: any) => i.customer_id === row.id);
    setHistory({ title: row.name, lines: invoices.map((i: any) => `${new Date(i.issued_at).toLocaleDateString("en-NG")} · ${i.invoice_number} · ${i.payment_status} · Balance ${money(i.outstanding)}`) });
  }

  function messagePerson(row: Row) {
    if (!row.phone) { toast.error("No phone number saved for this person."); return; }
    const message = row.kind === "customer"
      ? `Hello ${row.name}, this is a friendly reminder from Amezing Limited. Your current outstanding balance is ${money(row.balance)}. Please let us know when you plan to settle it. Thank you.`
      : row.kind === "engineer"
        ? `Hello ${row.name}, this is a reminder from Amezing Limited. Your current balance for parts/services is ${money(row.balance)}. Please let us know when you can settle it. Thank you.`
        : `Hello ${row.name}, this is a reminder from Amezing Limited. Our current balance payable to you is ${money(row.balance)}. Please let us know when you would like us to settle it. Thank you.`;
    if (openWhatsApp(row.phone, message)) toast.success(`WhatsApp opened for ${row.name}.`);
  }

  return <AppLayout><main className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a641d]">Money book</p><h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Owed & Owing</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">See today’s money movement, each person’s running balance, and who needs a follow-up.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-bold text-[#53635d]">{loading ? "Refreshing…" : <><RefreshCw className="size-4" />Refresh</>}</button>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      <MoneyCard icon={<ArrowDownLeft className="size-5" />} label="Collected today" value={money(collected)} note="Money received" />
      <MoneyCard icon={<ArrowUpRight className="size-5" />} label="Given out today" value={money(paidOut)} note="Payments and supplier money out" />
      <MoneyCard icon={<Wallet className="size-5" />} label="Net movement" value={money(collected - paidOut)} note="Collected minus given out" />
    </section>

    <section className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
      <div className="rounded-2xl border border-[#dfe6df] bg-white p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-heading text-lg font-bold text-[#182a28]">Today’s money report</h2><p className="mt-1 text-xs text-[#74837e]">Every recorded money movement for today.</p></div><span className="rounded-full bg-[#eef5f1] px-3 py-1 text-xs font-bold text-[#1d6a54]">{moneyRows.length + supplierPayments.length} movements</span></div>
        <div className="mt-4 divide-y divide-[#edf0ed]">
          {[...moneyRows.map(x => ({ id: x.id, time: x.occurred_at, direction: x.direction, amount: Number(x.amount), description: x.description || label(x.category), method: x.payment_method })), ...supplierPayments.map(x => ({ id: `supplier-${x.id}`, time: x.paid_at, direction: "out" as const, amount: Number(x.amount), description: `Paid ${x.person_name || "supplier / person"}`, method: x.payment_method }))].sort((a,b) => +new Date(b.time) - +new Date(a.time)).slice(0, 20).map(x => <div key={x.id} className="flex items-center gap-3 py-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${x.direction === "in" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{x.direction === "in" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#263b36]">{x.description}</p><p className="text-[11px] text-[#8a9691]">{new Date(x.time).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})} · {x.method || "payment"}</p></div><p className={`text-sm font-bold ${x.direction === "in" ? "text-emerald-700" : "text-rose-700"}`}>{x.direction === "in" ? "+" : "-"}{money(x.amount)}</p></div>)}
          {moneyRows.length + supplierPayments.length === 0 && <p className="py-8 text-center text-sm text-[#74837e]">No money movement recorded today.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-white text-amber-700"><Bell className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-[#182a28]">Follow-up alerts</h2><p className="text-xs text-[#7c6a3c]">People whose balance reached their message limit.</p></div></div>
        <div className="mt-4 space-y-2">{followupRows.slice(0, 6).map(r => <div key={`${r.kind}:${r.id}`} className="rounded-xl bg-white p-3"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-600" /><p className="min-w-0 flex-1 truncate text-sm font-bold text-[#263b36]">{r.name}</p><p className="text-sm font-bold text-amber-700">{money(r.balance)}</p></div><div className="mt-2 flex gap-2"><button onClick={() => messagePerson(r)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#123b34] px-3 text-xs font-bold text-white"><MessageCircle className="size-3.5" />Message</button><button onClick={() => { setThresholdTarget(r); setThresholdInput(String(r.threshold)); }} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#dfe6df] px-3 text-xs font-bold text-[#53635d]"><Settings2 className="size-3.5" />Limit</button></div></div>)}{followupRows.length === 0 && <p className="py-6 text-center text-sm text-[#7c6a3c]">No follow-up limit has been reached.</p>}</div>
      </div>
    </section>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex rounded-xl border border-[#dfe6df] bg-white p-1"><button onClick={() => setTab("owed")} className={tab === "owed" ? "rounded-lg bg-[#123b34] px-4 py-2 text-sm font-bold text-white" : "rounded-lg px-4 py-2 text-sm font-bold text-[#53635d]"}>Owed to us</button><button onClick={() => setTab("weowe")} className={tab === "weowe" ? "rounded-lg bg-[#123b34] px-4 py-2 text-sm font-bold text-white" : "rounded-lg px-4 py-2 text-sm font-bold text-[#53635d]"}>We owe</button></div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search person or phone" className="h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-4 text-sm sm:w-80" />
    </div>

    <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white">
      <div className="border-b border-[#edf0ed] p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#eef5f1] text-[#1d6a54]"><Wallet className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-[#182a28]">{tab === "owed" ? "Individual balances" : "People we owe"}</h2><p className="mt-1 text-xs text-[#74837e]">{tab === "owed" ? "The balance for each customer and engineer is calculated from real transactions." : "Supplier and other payable balances are calculated from their payable records and payments."}</p></div></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f7f8f5] text-xs text-[#74837e]"><tr><th className="px-5 py-3">Person</th><th className="px-5 py-3">What it is</th><th className="px-5 py-3">Owed</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Balance</th><th className="px-5 py-3">Message limit</th><th className="px-5 py-3">History</th><th /></tr></thead><tbody>{filtered.map(r => { const alert = r.enabled && r.threshold > 0 && r.balance >= r.threshold; return <tr key={`${r.kind}:${r.id}`} className="border-t border-[#edf0ed]"><td className="px-5 py-4"><p className="font-bold text-[#183b34]">{r.name}</p><p className="text-[11px] text-[#8b918e]">{r.phone || "No phone"}</p></td><td className="px-5 py-4 text-[#53635d]">{r.detail}</td><td className="px-5 py-4">{money(r.owed)}</td><td className="px-5 py-4 text-emerald-700">{money(r.paid)}</td><td className="px-5 py-4 font-bold text-amber-700">{money(r.balance)}</td><td className="px-5 py-4">{r.threshold > 0 ? <span className={`font-semibold ${alert ? "text-amber-700" : "text-[#53635d]"}`}>{money(r.threshold)}{alert ? " · Alert" : ""}</span> : <button onClick={() => { setThresholdTarget(r); setThresholdInput(""); }} className="text-xs font-bold text-[#1d6a54] hover:underline">Set limit</button>}</td><td className="px-5 py-4"><button onClick={() => void openHistory(r)} className="inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54] hover:underline"><History className="size-3.5" />History</button></td><td className="px-5 py-4"><div className="flex gap-2">{r.phone && <button onClick={() => messagePerson(r)} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe6df] px-3 py-2 text-xs font-bold text-[#53635d]"><MessageCircle className="size-3.5" />Message</button>}<button onClick={() => { setThresholdTarget(r); setThresholdInput(String(r.threshold || "")); }} className="rounded-lg bg-[#123b34] px-3 py-2 text-xs font-bold text-white">{r.threshold > 0 ? "Edit limit" : "Set limit"}</button></div></td></tr>; })}</tbody></table></div>
      {filtered.length === 0 && <div className="p-10 text-center text-sm text-[#74837e]">{loading ? "Loading accounts…" : "No outstanding balances here."}</div>}
    </section>

    {thresholdTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a641d]">Follow-up limit</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">{thresholdTarget.name}</h2><p className="mt-1 text-sm text-[#74837e]">When this person’s balance reaches this amount, the alert will appear here so you can message them.</p><label className="mt-5 block text-xs font-bold text-[#53635d]">Alert me at<input autoFocus type="number" min="1" value={thresholdInput} onChange={e => setThresholdInput(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] px-3 text-sm" placeholder="e.g. 50000" /></label><div className="mt-5 flex gap-2"><button onClick={() => setThresholdTarget(null)} className="h-11 flex-1 rounded-xl border border-[#dfe6df] text-sm font-bold text-[#53635d]">Cancel</button><button onClick={() => void saveThreshold()} disabled={saving} className="h-11 flex-1 rounded-xl bg-[#123b34] text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save limit"}</button></div></div></div>}

    {history && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a641d]">Account history</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">{history.title}</h2><div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-[#edf0ed]">{history.lines.length ? history.lines.map((line,i) => <div key={i} className="border-b border-[#edf0ed] px-4 py-3 text-sm text-[#53635d] last:border-0">{line}</div>) : <div className="p-5 text-sm text-[#74837e]">No history.</div>}</div><button onClick={() => setHistory(null)} className="mt-4 h-11 w-full rounded-xl bg-[#123b34] text-sm font-bold text-white">Close</button></div></div>}
  </main></AppLayout>;
}

function MoneyCard({ icon, label: title, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-[#dfe6df] bg-white p-5"><div className="flex items-center justify-between"><div className="flex size-10 items-center justify-center rounded-xl bg-[#eef5f1] text-[#1d6a54]">{icon}</div><p className="text-xs font-semibold text-[#74837e]">{title}</p></div><p className="mt-4 font-heading text-2xl font-bold text-[#182a28]">{value}</p><p className="mt-1 text-xs text-[#8a9691]">{note}</p></div>;
}
