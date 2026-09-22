"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SalesAnalytics from "@/components/reports/SalesAnalytics";
import RepairTurnaroundAnalytics from "@/components/reports/RepairTurnaroundAnalytics";
import CustomerAnalytics from "@/components/reports/CustomerAnalytics";
import StockValuation from "@/components/reports/StockValuation";
import ProfitLossBreakdown from "@/components/reports/ProfitLossBreakdown";
import { reportsService, type BusinessReport } from "@/services/reportsService";
import { financeService } from "@/services/financeService";
import type { DailyProfit, ProfitSummary } from "@/types/finance";
import { getBusinessPeriodRange, type BusinessPeriod } from "@/lib/businessTime";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
type Period = BusinessPeriod;

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [range, setRange] = useState({ start: "", end: "", timezone: "Africa/Lagos" });
  const [report, setReport] = useState<BusinessReport | null>(null);
  const [profit, setProfit] = useState<ProfitSummary | null>(null);
  const [trend, setTrend] = useState<DailyProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void getBusinessPeriodRange(period).then(setRange); }, [period]);
  useEffect(() => { if (!range.start || !range.end) return; void load(); }, [range.start, range.end]);

  async function load() {
    setLoading(true); setError("");
    const [r, p, t] = await Promise.all([
      reportsService.getBusinessReport(range.start, range.end),
      financeService.getProfitSummary(range.start, range.end),
      financeService.getDailyProfitTrend(range.start, range.end),
    ]);
    if (r.error || p.error || t.error) setError((r.error || p.error || t.error)?.message || "Unable to load reports");
    setReport(r.data);
    setProfit(Array.isArray(p.data) ? p.data[0] ?? null : null);
    setTrend(Array.isArray(t.data) ? t.data : []);
    setLoading(false);
  }

  const max = Math.max(...trend.map((x) => Math.abs(Number(x.net_profit || 0))), 1);

  return <AppLayout><div className="space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Amezing owner records</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Reports</h1><p className="mt-1 text-sm text-slate-500">Sales, repairs, stock, money received, costs and what is still owed.</p></div>
      <select aria-label="Report period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option><option value="all">All time</option></select>
    </header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Loading records…</div> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Sales revenue" value={money(report?.sales_revenue ?? 0)} hint="POS sales"/><Metric title="Repair value" value={money(report?.repair_revenue ?? 0)} hint="Repair work"/><Metric title="Cash received" value={money(report?.cash_received ?? 0)} hint="Actual money in"/><Metric title="Gross profit" value={money(report?.gross_profit ?? 0)}/></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Net profit" value={money(profit?.net_profit ?? report?.net_profit ?? 0)}/><Metric title="Parts cost" value={money(profit?.parts_cost ?? report?.inventory_cogs ?? 0)}/><Metric title="Operating expenses" value={money(profit?.operating_expenses ?? report?.operating_expenses ?? 0)}/><Metric title="Customer debt" value={money(profit?.outstanding_customer ?? report?.customer_outstanding ?? 0)}/></section>
      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">Daily profit</h2><p className="mt-1 text-xs text-slate-500">Net profit by business day.</p></div><span className="text-xs text-slate-400">{trend.length} days</span></div><div className="mt-7 flex h-48 items-end gap-1">{trend.length ? trend.map((x) => { const v = Number(x.net_profit || 0); const h = Math.max(3, Math.round(Math.abs(v) / max * 100)); return <div key={x.day} title={`${x.day}: ${money(v)}`} className="flex h-full flex-1 items-end"><div className={`mx-auto w-full max-w-5 rounded-t ${v < 0 ? "bg-red-300" : "bg-teal-600"}`} style={{ height: `${h}%` }}/></div>; }) : <div className="flex w-full items-center justify-center text-sm text-slate-400">No activity yet.</div>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-950">Money received by method</h2><div className="mt-6 space-y-4"><Mix title="Cash" value={profit?.cash_in ?? 0} total={report?.cash_received ?? 0}/><Mix title="Transfer" value={profit?.transfer_in ?? 0} total={report?.cash_received ?? 0}/><Mix title="POS / card" value={profit?.card_in ?? 0} total={report?.cash_received ?? 0}/><Mix title="Other" value={profit?.other_in ?? 0} total={report?.cash_received ?? 0}/></div></section></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Repairs received" value={String(report?.repairs_received ?? 0)}/><Metric title="Repairs completed" value={String(report?.repairs_completed ?? 0)}/><Metric title="Low-stock items" value={String(report?.low_stock_items ?? 0)}/><Metric title="Engineer balance" value={money(profit?.engineer_outstanding ?? report?.engineer_outstanding ?? 0)}/></section>
      <ProfitLossBreakdown from={range.start} to={range.end}/><SalesAnalytics from={range.start} to={range.end}/><RepairTurnaroundAnalytics from={range.start} to={range.end}/><CustomerAnalytics from={range.start} to={range.end}/><StockValuation/>
    </>}
  </div></AppLayout>;
}
function Metric({ title, value, hint }: { title: string; value: string; hint?: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>; }
function Mix({ title, value, total }: { title: string; value: number; total: number }) { const pct = total > 0 ? Math.min(100, value / total * 100) : 0; return <div><div className="mb-1 flex justify-between text-xs"><span className="text-slate-600">{title}</span><strong>{money(value)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }}/></div></div>; }
