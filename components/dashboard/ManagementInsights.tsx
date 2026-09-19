"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CircleDollarSign, Package, TrendingDown, TrendingUp } from "lucide-react";
import { dashboardService, type DashboardSummary } from "@/services/dashboardService";
import { financeService } from "@/services/financeService";
import type { DailyProfit, ProfitSummary } from "@/types/finance";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

const dateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfRange = (end: Date, days: number) => addDays(end, -(days - 1));

export default function ManagementInsights() {
  const [range, setRange] = useState<7 | 30>(7);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profit, setProfit] = useState<ProfitSummary | null>(null);
  const [previousProfit, setPreviousProfit] = useState<ProfitSummary | null>(null);
  const [trend, setTrend] = useState<DailyProfit[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load(range);
  }, [range]);

  async function load(days: 7 | 30) {
    setLoading(true);
    setError("");

    const end = new Date();
    const start = startOfRange(end, days);
    const previousEnd = addDays(start, -1);
    const previousStart = startOfRange(previousEnd, days);

    const [dashboard, profitResult, previousResult, trendResult] = await Promise.all([
      dashboardService.getSummary(),
      financeService.getProfitSummary(dateOnly(start), dateOnly(end)),
      financeService.getProfitSummary(dateOnly(previousStart), dateOnly(previousEnd)),
      financeService.getDailyProfitTrend(dateOnly(start), dateOnly(end)),
    ]);

    if (dashboard.error) setError(dashboard.error.message);
    else setSummary(dashboard.data);
    if (profitResult.error) setError((current) => current || profitResult.error.message);
    else setProfit(Array.isArray(profitResult.data) ? profitResult.data[0] ?? null : null);
    if (previousResult.error) setError((current) => current || previousResult.error.message);
    else setPreviousProfit(Array.isArray(previousResult.data) ? previousResult.data[0] ?? null : null);
    if (trendResult.error) setError((current) => current || trendResult.error.message);
    else setTrend(Array.isArray(trendResult.data) ? trendResult.data : []);

    setLoading(false);
  }

  const chartData = useMemo(() => {
    const byDay = new Map(trend.map((item) => [item.day, item]));
    const end = new Date();
    return Array.from({ length: range }, (_, index) => {
      const day = startOfRange(end, range);
      day.setDate(day.getDate() + index);
      const key = dateOnly(day);
      return byDay.get(key) ?? {
        day: key,
        revenue: 0,
        parts_cost: 0,
        operating_expenses: 0,
        engineer_cost: 0,
        net_profit: 0,
      };
    });
  }, [trend, range]);

  const scale = useMemo(() => Math.max(...chartData.map((item) => Math.abs(Number(item.net_profit || 0))), 1), [chartData]);
  const currentProfit = Number(profit?.net_profit || 0);
  const previousNetProfit = Number(previousProfit?.net_profit || 0);
  const profitChange = previousNetProfit === 0 ? null : ((currentProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100;
  const totalCosts = Number(profit?.parts_cost || 0) + Number(profit?.operating_expenses || 0) + Number(profit?.engineer_cost || 0);

  return (
    <section className="space-y-5">
      {error && <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">Some management figures could not refresh: {error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={`${range}-day revenue`} value={money(Number(profit?.total_revenue || 0))} hint="Recorded revenue" icon={CircleDollarSign} href="/reports" />
        <MetricCard title={`${range}-day net profit`} value={money(currentProfit)} hint={profitChange === null ? "No earlier period to compare" : `${profitChange >= 0 ? "+" : ""}${profitChange.toFixed(1)}% vs previous ${range} days`} icon={currentProfit >= 0 ? TrendingUp : TrendingDown} href="/reports" />
        <MetricCard title="Customer debt" value={money(Number(summary?.outstanding_customer || 0))} hint="Currently outstanding" icon={ArrowUpRight} href="/outstanding" />
        <MetricCard title="Low stock" value={String(summary?.low_stock_count ?? 0)} hint="Items needing attention" icon={Package} href="/inventory" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--novatech-shadow-card)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold text-slate-950">Profit trend</h2>
              <p className="mt-0.5 text-xs text-slate-500">Net profit by day. Costs are already included in each figure.</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Profit trend period">
              {[7, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRange(days as 7 | 30)}
                  className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a] ${range === days ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                  aria-pressed={range === days}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-y border-slate-100 py-3">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Net profit</p>
              <p className={`mt-0.5 font-heading text-lg font-bold tracking-tight ${currentProfit < 0 ? "text-rose-700" : "text-slate-950"}`}>{money(currentProfit)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-slate-500">Revenue</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{money(Number(profit?.total_revenue || 0))}</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-medium text-slate-500">Costs</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{money(totalCosts)}</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto pb-1">
            <div className={`relative flex h-52 items-stretch gap-1 sm:gap-2 ${range === 30 ? "min-w-[720px]" : "min-w-0"}`}>
              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" aria-hidden="true" />
              {chartData.map((item) => {
                const value = Number(item.net_profit || 0);
                const height = Math.max(2, (Math.abs(value) / scale) * 44);
                const positive = value >= 0;
                const labelDate = new Date(`${item.day}T12:00:00`);
                return (
                  <div key={item.day} className="group relative flex min-w-0 flex-1 flex-col items-center justify-center">
                    <div className="relative flex h-full w-full items-center justify-center">
                      <div
                        className={`absolute w-[72%] min-w-[5px] rounded-sm transition-opacity group-hover:opacity-80 ${positive ? "bg-[#12b76a]" : "bg-rose-500"}`}
                        style={{ height: `${height}%`, top: positive ? `${50 - height}%` : "50%" }}
                        title={`${item.day}: ${money(value)} profit | Revenue ${money(Number(item.revenue || 0))} | Costs ${money(Number(item.parts_cost || 0) + Number(item.operating_expenses || 0) + Number(item.engineer_cost || 0))}`}
                      />
                    </div>
                    <span className="absolute bottom-0 text-[9px] font-medium text-slate-400 sm:text-[10px]">{range === 7 ? labelDate.toLocaleDateString("en-NG", { weekday: "short" }) : labelDate.getDate()}</span>
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-[10px] shadow-lg group-hover:block group-focus-within:block">
                      <p className="font-semibold text-slate-900">{labelDate.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</p>
                      <p className={`mt-1 font-bold ${value < 0 ? "text-rose-700" : "text-[#087443]"}`}>{money(value)} profit</p>
                      <p className="mt-0.5 text-slate-500">Revenue {money(Number(item.revenue || 0))}</p>
                      <p className="text-slate-500">Costs {money(Number(item.parts_cost || 0) + Number(item.operating_expenses || 0) + Number(item.engineer_cost || 0))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-400"><span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#12b76a]" /> Profit</span><span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-rose-500" /> Loss</span><span className="ml-auto">Dashed line = zero profit</span></div>
          {loading && <p className="mt-3 text-center text-[11px] text-slate-400">Updating profit figures…</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--novatech-shadow-card)] sm:p-6">
          <h2 className="font-heading text-base font-semibold text-slate-950">Management pulse</h2>
          <p className="mt-0.5 text-xs text-slate-500">The figures worth checking first.</p>
          <div className="mt-5 space-y-4">
            <Pulse label="Parts cost" value={money(Number(profit?.parts_cost || 0))} />
            <Pulse label="Operating expenses" value={money(Number(profit?.operating_expenses || 0))} />
            <Pulse label="Engineer cost" value={money(Number(profit?.engineer_cost || 0))} />
            <Pulse label="Cash received" value={money(Number(profit?.cash_in || 0))} />
          </div>
          <Link href="/reports" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#087443] hover:text-[#065c35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a]">Open full reports <ArrowUpRight className="size-3.5" /></Link>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ title, value, hint, icon: Icon, href }: { title: string; value: string; hint: string; icon: typeof CircleDollarSign; href: string }) {
  return (
    <Link href={href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--novatech-shadow-card)] transition-colors hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-medium text-slate-500">{title}</p><p className={`mt-2 font-heading text-xl font-bold tracking-tight ${title.includes("net profit") && value.startsWith("-") ? "text-rose-700" : "text-slate-950"}`}>{value}</p><p className="mt-1 text-[11px] text-slate-400">{hint}</p></div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#eaf8f1] text-[#087443]"><Icon className="size-4" /></div>
      </div>
    </Link>
  );
}

function Pulse({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-xs text-slate-500">{label}</span><span className="text-sm font-semibold text-slate-900">{value}</span></div>;
}
