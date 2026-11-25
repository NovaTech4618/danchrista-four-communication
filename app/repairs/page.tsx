"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertCircle, Clock3, Plus, Search, Smartphone, Wrench } from "lucide-react";
import { toast } from "sonner";
import { repairService } from "@/services/repairService";
import AppLayout from "@/components/layout/AppLayout";
import ReturnApprovalPanel from "@/components/sales/ReturnApprovalPanel";

type RepairRow = {
  id: string;
  device_id: string;
  issue: string;
  status: string;
  service_type?: string | null;
  created_at: string;
  deposit: number | null;
  estimated_cost: number | null;
  final_cost: number | null;
  expected_completion_date: string | null;
  devices: { brand: string; model: string; customers: { full_name: string; phone?: string | null } | null } | null;
  repair_tickets: { id: string; ticket_number: string }[] | null;
  outstanding?: number | null;
};
type RepairBalance = { repair_id: string; outstanding: number | null };
type QueueFilter = "all" | "active" | "ready" | "closed" | "attention" | "overdue";
const closedStatuses = ["Collected", "Cancelled", "No Fix", "Failed Repair", "Returned Unrepaired"];
const statusList = ["Received", "Diagnosis", "Estimate Sent", "Customer Approved", "Repairing", "Testing", "Completed", ...closedStatuses];
const money = (value: number) => `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

function statusClass(status: string) {
  if (status === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (closedStatuses.includes(status)) return "border-slate-200 bg-slate-100 text-slate-600";
  if (status === "Repairing" || status === "Testing" || status === "Customer Approved") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "Estimate Sent") return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}
function deadline(repair: RepairRow) {
  if (closedStatuses.includes(repair.status)) return "Closed";
  if (repair.status === "Completed") return "Ready for pickup";
  if (!repair.expected_completion_date) return "No target date";
  const due = new Date(`${repair.expected_completion_date}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  return days < 0 ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue` : days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} left`;
}
function nextAction(status: string) {
  if (status === "Received") return "Start diagnosis";
  if (status === "Diagnosis") return "Record diagnosis";
  if (status === "Estimate Sent") return "Await customer approval";
  if (status === "Customer Approved") return "Start repair";
  if (status === "Repairing") return "Update repair progress";
  if (status === "Testing") return "Complete final checks";
  if (status === "Completed") return "Prepare customer collection";
  return "View repair record";
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queue, setQueue] = useState<QueueFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  async function load() {
    setLoading(true); setLoadError(false);
    const [{ data, error }, { data: balanceRows, error: balanceError }] = await Promise.all([
      repairService.getAllRepairs(), repairService.getAllRepairBalances(),
    ]);
    setLoading(false);
    if (error) { setLoadError(true); toast.error("Could not load the repair list."); return; }
    if (balanceError) toast.error("Repair balances could not be loaded. Payment values are marked unavailable.");
    const balances = new Map(((balanceRows ?? []) as RepairBalance[]).map(row => [row.repair_id, Number(row.outstanding ?? 0)]));
    setRepairs(((data as unknown as RepairRow[]) || []).map(repair => ({
      ...repair,
      outstanding: balanceError ? null : balances.has(repair.id) ? balances.get(repair.id)! : null,
    })));
  }
  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => ({
    active: repairs.filter(r => !closedStatuses.includes(r.status) && r.status !== "Completed").length,
    ready: repairs.filter(r => r.status === "Completed").length,
    closed: repairs.filter(r => closedStatuses.includes(r.status)).length,
    awaiting: repairs.filter(r => r.status === "Received" || r.status === "Diagnosis" || r.status === "Estimate Sent").length,
    overdue: repairs.filter(r => !closedStatuses.includes(r.status) && r.status !== "Completed" && r.expected_completion_date && new Date(`${r.expected_completion_date}T23:59:59`).getTime() < Date.now()).length,
  }), [repairs]);

  const filtered = useMemo(() => repairs.filter(repair => {
    const q = search.trim().toLowerCase();
    const device = repair.devices;
    const customer = device?.customers;
    const ticket = repair.repair_tickets?.[0]?.ticket_number ?? "";
    const matchesSearch = !q || [repair.issue, device?.brand, device?.model, customer?.full_name, customer?.phone, ticket, repair.id].some(value => String(value ?? "").toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    const isActive = !closedStatuses.includes(repair.status) && repair.status !== "Completed";
    const isOverdue = isActive && Boolean(repair.expected_completion_date) && new Date(String(repair.expected_completion_date) + "T23:59:59").getTime() < Date.now();
    const needsAttention = ["Received", "Diagnosis", "Estimate Sent"].includes(repair.status);
    const matchesQueue = queue === "all" || (queue === "active" && isActive) || (queue === "ready" && repair.status === "Completed") || (queue === "closed" && closedStatuses.includes(repair.status)) || (queue === "attention" && needsAttention) || (queue === "overdue" && isOverdue);
    return matchesSearch && matchesStatus && matchesQueue;
  }), [repairs, search, statusFilter, queue]);

  return <AppLayout><main className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Amezing · Workshop</p><h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Repairs</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">Every device has one repair record. Follow it from check-in to diagnosis, repair, testing and collection.</p></div>
      <Link href="/repairs/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#123b34] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0d302a]"><Plus className="size-4" /> Receive a device</Link>
    </header>

    <ReturnApprovalPanel />

    <section aria-label="Repair queue summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button onClick={() => { setQueue("active"); setStatusFilter("all"); }} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-teal-300 ${queue === "active" ? "border-teal-500 ring-2 ring-teal-100" : "border-[#dfe6df]"}`}><p className="text-xs font-semibold text-[#74837e]">Active jobs</p><p className="mt-2 font-heading text-2xl font-bold text-[#182a28] tabular-nums">{counts.active}</p><p className="mt-1 text-xs text-[#74837e]">Being handled</p></button>
      <button onClick={() => { setQueue("ready"); setStatusFilter("all"); }} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-teal-300 ${queue === "ready" ? "border-teal-500 ring-2 ring-teal-100" : "border-[#dfe6df]"}`}><p className="text-xs font-semibold text-[#74837e]">Ready for pickup</p><p className="mt-2 font-heading text-2xl font-bold text-emerald-700 tabular-nums">{counts.ready}</p><p className="mt-1 text-xs text-[#74837e]">Customer to collect</p></button>
      <button onClick={() => { setQueue("attention"); setStatusFilter("all"); }} className="rounded-2xl border border-[#dfe6df] bg-white p-4 text-left shadow-sm transition hover:border-teal-300"><p className="text-xs font-semibold text-[#74837e]">Needs attention</p><p className="mt-2 font-heading text-2xl font-bold text-amber-700 tabular-nums">{counts.awaiting}</p><p className="mt-1 text-xs text-[#74837e]">New, diagnosis or approval</p></button>
      <button onClick={() => { setQueue("overdue"); setStatusFilter("all"); }} className="rounded-2xl border border-[#dfe6df] bg-white p-4 text-left shadow-sm transition hover:border-teal-300"><p className="text-xs font-semibold text-[#74837e]">Overdue jobs</p><p className="mt-2 font-heading text-2xl font-bold text-rose-700 tabular-nums">{counts.overdue}</p><p className="mt-1 text-xs text-[#74837e]">Past target date</p></button>
    </section>

    <section className="rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
      <div className="space-y-3 border-b border-[#edf0ed] p-4">
        <div className="flex flex-wrap gap-2" aria-label="Filter repair queue">
          {([{ key: "all", label: "All repairs" }, { key: "active", label: "Active" }, { key: "ready", label: "Ready for pickup" }, { key: "closed", label: "Closed" }] as const).map(item => <button key={item.key} type="button" onClick={() => { setQueue(item.key); setStatusFilter("all"); }} aria-pressed={queue === item.key} className={`min-h-9 rounded-full px-4 text-xs font-bold transition ${queue === item.key ? "bg-[#123b34] text-white" : "bg-[#f2f5f2] text-[#53635d] hover:bg-[#e8efea]"}`}>{item.label}{item.key === "all" ? ` · ${repairs.length}` : item.key === "active" ? ` · ${counts.active}` : item.key === "ready" ? ` · ${counts.ready}` : ` · ${counts.closed}`}</button>)}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa9a4]" /><input aria-label="Search repairs" placeholder="Search customer, phone, ticket, device or fault..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 w-full rounded-xl border border-[#dfe6df] pl-9 pr-3 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" /></div>
          <select aria-label="Filter by repair status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setQueue("all"); }} className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm sm:w-56"><option value="all">Every status</option>{statusList.map(status => <option key={status} value={status}>{status}</option>)}</select>
          <p className="text-xs text-[#74837e] sm:ml-auto">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      {loading ? <div className="space-y-3 p-5" aria-label="Loading repairs"><div className="h-16 animate-pulse rounded-xl bg-[#f0f3f0]" /><div className="h-16 animate-pulse rounded-xl bg-[#f0f3f0]" /><div className="h-16 animate-pulse rounded-xl bg-[#f0f3f0]" /></div>
      : loadError ? <div className="p-12 text-center"><AlertCircle className="mx-auto size-8 text-rose-600" /><p className="mt-3 text-sm font-semibold text-[#394b45]">The repair list could not be loaded.</p><button onClick={() => void load()} className="mt-4 rounded-xl bg-[#123b34] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div>
      : filtered.length === 0 ? <div className="p-12 text-center"><Wrench className="mx-auto size-8 text-[#b6c2bd]" /><p className="mt-3 text-sm font-semibold text-[#394b45]">{search || statusFilter !== "all" || queue !== "all" ? "No repairs match these filters." : "No repairs recorded yet."}</p><p className="mt-1 text-xs text-[#74837e]">A repair appears here as soon as a device is received.</p><Link href="/repairs/new" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#1d6a54]">Receive first device <ArrowRight className="size-4" /></Link></div>
      : <>
        <div className="space-y-3 p-3 sm:hidden">{filtered.map(repair => <RepairCard key={repair.id} repair={repair} />)}</div>
        <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[900px] text-left"><thead className="bg-[#f7f8f5]"><tr>{["Customer / device", "Reported problem", "Status", "Payment", "Target", ""].map(label => <th key={label} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#74837e]">{label}</th>)}</tr></thead><tbody>{filtered.map(repair => {
          const customer = repair.devices?.customers; const balance = repair.outstanding; const ticket = repair.repair_tickets?.[0]?.ticket_number;
          return <tr key={repair.id} className="border-t border-[#edf0ed] hover:bg-[#fbfcfa]">
            <td className="px-5 py-4"><Link href={`/repairs/${repair.id}`} className="block"><p className="font-semibold text-[#182a28]">{customer?.full_name || "Customer not named"}</p><p className="mt-0.5 text-xs text-[#74837e]">{repair.devices?.brand} {repair.devices?.model}{repair.service_type === "Network Unlock" ? " · Network Unlock" : ""}{ticket ? ` · ${ticket}` : ""}</p><p className="text-xs text-[#74837e]">{customer?.phone || "No phone recorded"}</p></Link></td>
            <td className="max-w-[260px] px-5 py-4 text-sm text-[#53635d]"><span className="line-clamp-2">{repair.issue || "No problem recorded"}</span></td>
            <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(repair.status)}`}>{repair.status}</span></td>
            <td className="px-5 py-4 text-sm">{balance === null || balance === undefined ? <span className="text-xs text-slate-500">Unavailable</span> : balance > 0 ? <span className="font-bold text-amber-700">{money(balance)} due</span> : <span className="text-emerald-700">Paid</span>}</td>
            <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-xs text-[#74837e]"><Clock3 className="size-3.5" />{deadline(repair)}</span></td>
            <td className="px-5 py-4"><Link href={`/repairs/${repair.id}`} aria-label={`Open repair for ${customer?.full_name || repair.devices?.model || "device"}`} className="inline-flex size-9 items-center justify-center rounded-lg text-[#74837e] hover:bg-[#eef4f1] hover:text-[#1d6a54]"><ArrowRight className="size-4" /></Link></td>
          </tr>;
        })}</tbody></table></div>
      </>}
    </section>
  </main></AppLayout>;
}

function RepairCard({ repair }: { repair: RepairRow }) {
  const customer = repair.devices?.customers; const balance = repair.outstanding; const ticket = repair.repair_tickets?.[0]?.ticket_number;
  return <Link href={`/repairs/${repair.id}`} className="block rounded-2xl border border-[#e3e9e3] bg-white p-4 shadow-sm transition hover:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-600">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold text-[#182a28]">{customer?.full_name || "Customer not named"}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#74837e]"><Smartphone className="size-3.5 shrink-0" />{repair.devices?.brand} {repair.devices?.model}{repair.service_type === "Network Unlock" ? " · Network Unlock" : ""}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(repair.status)}`}>{repair.status}</span></div>
    <p className="mt-3 line-clamp-2 text-sm text-[#53635d]">{repair.issue || "No problem recorded"}</p>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ed] pt-3 text-xs"><span className="font-semibold text-[#53635d]">{ticket || "Repair record"}</span><span className="text-[#74837e]">{deadline(repair)}</span></div>
    <div className="mt-2 flex items-center justify-between gap-2"><span className={balance === null || balance === undefined ? "text-xs text-slate-500" : balance > 0 ? "text-xs font-bold text-amber-700" : "text-xs font-semibold text-emerald-700"}>{balance === null || balance === undefined ? "Balance unavailable" : balance > 0 ? `${money(balance)} outstanding` : "No balance due"}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800">{nextAction(repair.status)} <ArrowRight className="size-3.5" /></span></div>
  </Link>;
}
