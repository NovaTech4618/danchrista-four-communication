"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList, MessageCircle, RefreshCw, Search, Send, UserRound, Wallet } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { engineerService } from "@/services/engineerService";
import { customerGeneralMessage, openWhatsApp } from "@/lib/whatsapp";
import type { Engineer, EngineerBalance, EngineerTransaction } from "@/types/engineer";
import { toast } from "sonner";

type WhatsAppEngineer = Engineer & { balance: number | null };
type Template = "general" | "balance" | "statement" | "parts";
type PartRow = { id: string; item_name: string; quantity: number; created_at: string; notes?: string | null };
type PartLedger = { out: PartRow[]; returned: PartRow[]; used: PartRow[]; paid: PartRow[]; error: Error | null };
type PartMovement = PartRow & { movement: string; label: string };

const money = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });
const dateLabel = (date: string) => new Date(date).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

const templates: { id: Template; label: string; description: string }[] = [
  { id: "balance", label: "Account reminder", description: "Ask an engineer to review a verified positive balance." },
  { id: "statement", label: "Account statement", description: "Share the latest recorded account entries and balance." },
  { id: "parts", label: "Parts record update", description: "Share recent recorded parts issued, returned, used or paid." },
  { id: "general", label: "General message", description: "Start a normal conversation with an engineer." },
];

function generalMessage(engineer: WhatsAppEngineer) {
  return "Hello " + engineer.name + ", this is Amezing Limited. We are getting in touch about our workshop/parts records. Please let us know how we can assist. Thank you.";
}

function partMovements(ledger: PartLedger | null): PartMovement[] {
  if (!ledger) return [];
  return [
    ...ledger.out.map((row) => ({ ...row, movement: "issued", label: "Parts given out" })),
    ...ledger.returned.map((row) => ({ ...row, movement: "returned", label: "Parts returned" })),
    ...ledger.used.map((row) => ({ ...row, movement: "used", label: "Parts marked used" })),
    ...ledger.paid.map((row) => ({ ...row, movement: "paid", label: "Parts paid" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function statementMessage(engineer: WhatsAppEngineer, balance: EngineerBalance | undefined, transactions: EngineerTransaction[]) {
  const activity = transactions.slice(0, 8).map((item) => {
    const amount = Number(item.debit) > 0 ? "Debit " + money(Number(item.debit)) : "Credit " + money(Number(item.credit));
    return dateLabel(item.transaction_date) + " — " + item.description + ": " + amount;
  });
  return [
    "AMEZING LIMITED — ENGINEER ACCOUNT STATEMENT",
    "",
    "Engineer: " + engineer.name,
    engineer.business_name ? "Business: " + engineer.business_name : "",
    "Recorded outstanding balance: " + money(Number(balance?.balance ?? 0)),
    "",
    "Recent account activity:",
    ...(activity.length ? activity : ["No account transactions are currently recorded."]),
    "",
    "This message summarises entries currently recorded in the Amezing Limited account. Please contact the shop if anything needs checking.",
  ].filter(Boolean).join("\n");
}

function partsMessage(engineer: WhatsAppEngineer, ledger: PartLedger | null) {
  const recent = partMovements(ledger).slice(0, 10).map((item) =>
    dateLabel(item.created_at) + " — " + item.label + ": " + item.item_name + " × " + Number(item.quantity || 0) + (item.notes ? " (" + item.notes + ")" : "")
  );
  return [
    "AMEZING LIMITED — ENGINEER PARTS RECORD",
    "",
    "Engineer: " + engineer.name,
    "",
    "Recent recorded parts movements:",
    ...(recent.length ? recent : ["No parts movements are currently recorded for this engineer."]),
    "",
    "Please check this summary against the parts you have received, returned or used, and contact the shop about any difference.",
  ].join("\n");
}

export default function WhatsAppCenterPage() {
  const [rows, setRows] = useState<WhatsAppEngineer[]>([]);
  const [balances, setBalances] = useState<EngineerBalance[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [transactions, setTransactions] = useState<EngineerTransaction[]>([]);
  const [ledger, setLedger] = useState<PartLedger | null>(null);
  const [template, setTemplate] = useState<Template>("general");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [balanceUnavailable, setBalanceUnavailable] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [detailError, setDetailError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const [engineersResult, balancesResult] = await Promise.all([
        engineerService.getEngineers(),
        engineerService.getBalances(),
      ]);

      if (engineersResult.error) {
        setRows([]);
        setLoadError("Engineer records could not be loaded. Check your connection and retry.");
        toast.error(engineersResult.error.message || "Unable to load engineers.");
        return;
      }

      const engineerRows = (engineersResult.data ?? []) as Engineer[];
      const balanceRows = (balancesResult.data ?? []) as EngineerBalance[];
      setBalanceUnavailable(Boolean(balancesResult.error));
      setBalances(balancesResult.error ? [] : balanceRows);
      const byEngineer = new Map(balanceRows.map((item) => [item.engineer_id, Number(item.balance || 0)]));
      setRows(engineerRows.map((engineer) => ({
        ...engineer,
        balance: balancesResult.error ? null : (byEngineer.get(engineer.id) ?? 0),
      })));
      if (balancesResult.error) {
        toast.error("Engineer balances could not be verified. Account reminders are disabled until balances can be loaded.");
      }
    } catch {
      setRows([]);
      setLoadError("Could not connect to the engineer records. Check your connection and retry.");
      toast.error("Unable to load the engineer WhatsApp list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!selectedId) {
      setTransactions([]);
      setLedger(null);
      setDetailError("");
      setDetailLoading(false);
      return;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError("");
    void Promise.all([
      engineerService.getTransactions(selectedId),
      engineerService.getPartLedger(selectedId),
    ]).then(([transactionResult, partResult]) => {
      if (!active) return;
      if (transactionResult.error) {
        setTransactions([]);
        setDetailError("The engineer account activity could not be loaded.");
      } else {
        setTransactions((transactionResult.data ?? []) as EngineerTransaction[]);
      }
      if (partResult.error) {
        setLedger(null);
        setDetailError("The engineer parts record could not be loaded.");
      } else {
        setLedger(partResult as PartLedger);
      }
    }).catch(() => {
      if (!active) return;
      setTransactions([]);
      setLedger(null);
      setDetailError("The engineer's records could not be loaded. Refresh and try again.");
    }).finally(() => {
      if (active) setDetailLoading(false);
    });

    return () => { active = false; };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...rows]
      .filter((engineer) => engineer.status === "active" || !term)
      .filter((engineer) => !term || [engineer.name, engineer.phone, engineer.business_name, engineer.address].filter(Boolean).join(" ").toLowerCase().includes(term))
      .sort((a, b) => Number((b.balance ?? 0) > 0) - Number((a.balance ?? 0) > 0) || a.name.localeCompare(b.name));
  }, [rows, query]);

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const selectedBalance = selected?.balance == null ? undefined : balances.find((item) => item.engineer_id === selectedId);
  const totalOwedToShop = rows.reduce((sum, row) => sum + Math.max(0, Number(row.balance || 0)), 0);
  const engineersWithPhone = rows.filter((row) => Boolean(row.phone?.trim())).length;
  const owingCount = rows.filter((row) => Number(row.balance ?? 0) > 0).length;

  function selectEngineer(engineer: WhatsAppEngineer) {
    setSelectedId(engineer.id);
    setTemplate("general");
    setMessage(generalMessage(engineer));
  }

  function applyTemplate(next: Template) {
    if (!selected) {
      toast.error("Select an engineer first.");
      return;
    }
    if (next === "balance") {
      if (balanceUnavailable || selected.balance == null) {
        toast.error("Engineer balance is unavailable. Refresh and verify it before drafting a reminder.");
        return;
      }
      if (selected.balance <= 0) {
        toast.error("This engineer has no verified positive outstanding balance. Choose another template.");
        return;
      }
      setMessage("Hello " + selected.name + ", Amezing Limited's current record shows an outstanding account balance of " + money(selected.balance) + ". Please review the amount and let us know if any entry needs checking. Thank you.");
    } else if (next === "statement") {
      if (balanceUnavailable || selected.balance == null) {
        toast.error("The account balance could not be verified. Refresh the engineer records before creating a statement.");
        return;
      }
      if (detailLoading || detailError) {
        toast.error("Wait for the engineer account activity to load successfully.");
        return;
      }
      setMessage(statementMessage(selected, selectedBalance, transactions));
    } else if (next === "parts") {
      if (detailLoading || detailError || !ledger) {
        toast.error("Wait for the engineer parts record to load successfully.");
        return;
      }
      setMessage(partsMessage(selected, ledger));
    } else {
      setMessage(generalMessage(selected));
    }
    setTemplate(next);
  }

  function send() {
    if (!selected) { toast.error("Select an engineer first."); return; }
    if (!selected.phone?.trim()) { toast.error("This engineer has no phone number saved."); return; }
    if (template === "balance" && (balanceUnavailable || selected.balance == null || selected.balance <= 0)) {
      toast.error("A payment reminder requires a verified positive engineer balance.");
      return;
    }
    if ((template === "statement" || template === "parts") && (detailLoading || Boolean(detailError))) {
      toast.error("Refresh and verify the selected engineer's records before sharing.");
      return;
    }
    if (!message.trim()) { toast.error("Write a message first."); return; }
    if (openWhatsApp(selected.phone, message.trim())) toast.success("WhatsApp opened for " + selected.name + ". Review the message before sending.");
    else toast.error("Unable to open WhatsApp.");
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Engineer communication</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">WhatsApp Center</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Message an engineer, share their recorded account activity or parts movements, and review the text in WhatsApp before sending.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/workspace" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-4" /> Home</Link>
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw className="size-4" />{loading ? "Refreshing…" : "Refresh"}</button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active engineers" value={String(rows.filter((row) => row.status === "active").length)} />
          <Stat label="Engineers with phone" value={String(engineersWithPhone)} />
          <Stat label="Engineers owing the shop" value={balanceUnavailable ? "Unavailable" : String(owingCount)} />
          <Stat label="Outstanding owed to shop" value={balanceUnavailable ? "Unavailable" : money(totalOwedToShop)} />
        </section>

        {loadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-semibold">Engineer list unavailable</p><p className="mt-1">{loadError}</p><button type="button" onClick={() => void load()} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold hover:bg-red-100">Retry</button></div>}
        {balanceUnavailable && !loadError && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Engineer account balances could not be verified. Payment reminders and account statements are disabled until the balance service recovers.</div>}

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-950">Engineers</h2>
              <p className="mt-1 text-xs text-slate-500">Active engineers are shown first. Engineers with a verified positive balance are prioritised.</p>
              <div className="relative mt-4"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search engineer, phone or business" aria-label="Search engineers" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-teal-500" /></div>
            </div>
            <div className="max-h-[560px] overflow-y-auto p-2">
              {loading ? <div className="space-y-2 p-3">{[1, 2, 3, 4].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
                : filtered.length === 0 ? <div className="flex flex-col items-center p-8 text-center text-sm text-slate-500"><UserRound className="mb-2 size-6" />No engineers match this search.</div>
                  : filtered.map((engineer) => <button type="button" key={engineer.id} onClick={() => selectEngineer(engineer)} className={"w-full rounded-xl p-3 text-left transition " + (selectedId === engineer.id ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50")}><div className="flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><UserRound className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{engineer.name}</p><p className="truncate text-xs text-slate-500">{engineer.phone || "No phone number saved"}{engineer.business_name ? " · " + engineer.business_name : ""}</p></div><div className="text-right">{engineer.balance != null && engineer.balance > 0 && <p className="text-xs font-bold text-amber-700">{money(engineer.balance)}</p>}<p className={"mt-0.5 text-[10px] font-semibold " + (engineer.phone ? "text-emerald-600" : "text-slate-400")}>{engineer.phone ? "WhatsApp ready" : "No phone"}</p></div></div></button>)}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><MessageCircle className="size-5" /></div><div><h2 className="font-semibold text-slate-950">Compose message</h2><p className="text-xs text-slate-500">{selected ? "To " + selected.name : "Select an engineer to begin"}</p></div></div></div>
            <div className="space-y-5 p-5">
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Message template</label><div className="grid gap-2 sm:grid-cols-2">{templates.map((item) => <button key={item.id} type="button" disabled={!selected} onClick={() => applyTemplate(item.id)} className={"rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50 " + (template === item.id ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:bg-slate-50")}><p className="text-sm font-semibold text-slate-900">{item.label}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{item.description}</p></button>)}</div></div>
              {detailLoading && selected && <p className="text-xs text-slate-500">Loading account and parts activity…</p>}
              {detailError && selected && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{detailError} Statements and parts updates are disabled until a successful refresh.</div>}
              {selected && <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p><span className="font-semibold text-slate-800">Phone:</span> {selected.phone || "No phone number saved"}</p><p className="mt-1"><span className="font-semibold text-slate-800">Account:</span> {selected.balance == null ? "Balance unavailable" : selected.balance > 0 ? money(selected.balance) + " owed to the shop" : selected.balance < 0 ? money(Math.abs(selected.balance)) + " owed to the engineer" : "Clear based on recorded transactions"}</p><p className="mt-1"><span className="font-semibold text-slate-800">Saved activity:</span> {transactions.length} account entries · {ledger ? partMovements(ledger).length : "—"} parts movements</p></div>}
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="whatsapp-message">Message</label><textarea id="whatsapp-message" value={message} onChange={(event) => setMessage(event.target.value)} disabled={!selected} rows={10} placeholder="Select an engineer, then choose a template or write a message…" className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-teal-500 disabled:bg-slate-50" /></div>
              <button type="button" onClick={send} disabled={!selected || !selected.phone?.trim()} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4" />Review message in WhatsApp</button>
              <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-400"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />WhatsApp opens with the message pre-filled. Review it in WhatsApp and press Send yourself.</p>
            </div>
          </section>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">Need to correct an engineer's records?</p><p className="mt-1 text-sm text-slate-500">Open Engineers to review their account entries, parts movements and contact details.</p></div><Link href="/engineers" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ClipboardList className="size-4" />Open Engineers</Link></div></div>
      </main>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>;
}
