"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CheckCircle2, CircleDollarSign, Clock3, PackageSearch, UserRound, Wrench } from "lucide-react";
import { dashboardService, type DashboardSummary } from "@/services/dashboardService";
import { dailyClosingService, type DailyClosing } from "@/services/dailyClosingService";
import { financeService } from "@/services/financeService";
import type { ProfitSummary } from "@/types/finance";

const empty: DashboardSummary = { repairs_today: 0, active_repairs: 0, completed_today: 0, cash_today: 0, outstanding_customer: 0, low_stock_count: 0, engineer_debit: 0 };
const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function Stat({ title, value, note, href, icon: Icon }: { title: string; value: string; note: string; href: string; icon: typeof Banknote }) {
  return <Link href={href} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium text-slate-500">{title}</p><p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-400">{note}</p></div><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700"><Icon className="size-4" /></span></div>
  </Link>;
}

export default function OwnerControlPanel() {
  const [summary, setSummary] = useState<DashboardSummary>(empty);
  const [profit, setProfit] = useState<ProfitSummary | null>(null);
  const [closing, setClosing] = useState<DailyClosing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    const date = today();
    const [dashboardResult, profitResult, closingResult] = await Promise.all([
      dashboardService.getSummary(),
      financeService.getProfitSummary(date, date),
      dailyClosingService.getByDate(date),
    ]);
    if (dashboardResult.error) setError(dashboardResult.error.message); else if (dashboardResult.data) setSummary(dashboardResult.data);
    if (profitResult.error) setError((current) => current || profitResult.error.message); else setProfit(Array.isArray(profitResult.data) ? profitResult.data[0] ?? null : null);
    if (closingResult.error) setError((current) => current || closingResult.error.message); else setClosing(closingResult.data);
    setLoading(false);
  }

  const sales = Number(profit?.total_revenue || 0);
  const grossProfit = Number(profit?.gross_profit || 0);
  const attention = [
    summary.active_repairs > 0 ? { label: `${summary.active_repairs} repair${summary.active_repairs === 1 ? "" : "s"} still in the workshop`, href: "/repairs", icon: Wrench } : null,
    summary.low_stock_count > 0 ? { label: `${summary.low_stock_count} stock item${summary.low_stock_count === 1 ? "" : "s"} need attention`, href: "/inventory", icon: PackageSearch } : null,
    summary.outstanding_customer > 0 ? { label: `${money(summary.outstanding_customer)} customer balance is outstanding`, href: "/outstanding", icon: UserRound } : null,
    summary.engineer_debit > 0 ? { label: `${money(summary.engineer_debit)} is owed on engineer accounts`, href: "/technician-ledger", icon: UserRound } : null,
  ].filter(Boolean) as { label: string; href: string; icon: typeof Wrench }[];

  return <section className="space-y-5" aria-labelledby="owner-control-panel">
    <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Owner view</p><h2 id="owner-control-panel" className="mt-1 text-lg font-bold tracking-tight text-slate-950">Today&apos;s shop</h2><p className="mt-1 text-sm text-slate-500">Sales, cash, profit, debt, repairs and stock in one place.</p></div>{loading && <span className="text-xs text-slate-400">Updating…</span>}</div>
    {error ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Some figures could not be refreshed: {error}</div> : null}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Stat title="Sales today" value={money(sales)} note="Recorded sales revenue" href="/sales" icon={CircleDollarSign} />
      <Stat title="Gross profit" value={money(grossProfit)} note="Sales less item costs" href="/reports" icon={CircleDollarSign} />
      <Stat title="Cash received" value={money(summary.cash_today)} note="Money received today" href="/finance" icon={Banknote} />
      <Stat title="Engineer debt" value={money(summary.engineer_debit)} note="Parts / service owed" href="/technician-ledger" icon={UserRound} />
      <Stat title="Active repairs" value={String(summary.active_repairs)} note={`${summary.completed_today} completed today`} href="/repairs" icon={Wrench} />
      <Stat title="Low stock" value={String(summary.low_stock_count)} note="Items below minimum" href="/inventory" icon={PackageSearch} />
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-950">What needs attention?</h3><p className="mt-1 text-xs text-slate-500">Start with anything that can affect today&apos;s work or closing.</p></div><AlertTriangle className="size-4 text-slate-400" /></div>
        {attention.length === 0 ? <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="size-5 shrink-0" />Nothing is currently flagged on the dashboard.</div> : <div className="mt-4 space-y-2">{attention.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"><span className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="size-4" /></span><span className="truncate text-sm text-slate-700">{item.label}</span></span><ArrowRight className="size-4 shrink-0 text-slate-400" /></Link>; })}</div>}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">Daily closing</h3><p className="mt-1 text-xs text-slate-500">Reconcile the shop before the day ends.</p></div><Clock3 className="size-4 text-slate-400" /></div>
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Status</p><p className="mt-1 text-base font-bold text-slate-950">{!closing ? "Not opened" : closing.status === "closed" ? "Closed" : "Open — needs reconciliation"}</p>{closing ? <p className="mt-2 text-xs text-slate-500">Expected cash {money(Number(closing.expected_cash || 0))} · Received {money(Number(closing.cash_received_total || 0))}</p> : null}</div>
        <Link href="/reports/daily-closing" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">{closing?.status === "closed" ? "View today&apos;s closing" : "Open daily closing"}<ArrowRight className="size-4" /></Link>
      </div>
    </div>
  </section>;
}
