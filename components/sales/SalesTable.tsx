"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { saleService } from "@/services/saleService";
import type { Sale, SaleItem } from "@/types/sale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const money = (value: number | null | undefined) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

function dateKey(value: string) {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()) {
  const value = startOfDay(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfWeek(date = new Date()) {
  const value = startOfDay(date);
  const day = value.getDay();
  const daysSinceMonday = (day + 6) % 7;
  value.setDate(value.getDate() - daysSinceMonday);
  return value;
}

function endOfWeek(date = new Date()) {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  return endOfDay(value);
}

function startOfMonth(date = new Date()) {
  const value = startOfDay(date);
  value.setDate(1);
  return value;
}

function endOfMonth(date = new Date()) {
  const value = startOfMonth(date);
  value.setMonth(value.getMonth() + 1, 0);
  return endOfDay(value);
}

function itemNames(sale: Sale) {
  const items = sale.sale_items || [];
  if (!items.length) return "Sale";
  return items.map((entry: SaleItem) => {
    const inventory = Array.isArray(entry.inventory) ? entry.inventory[0] : entry.inventory;
    return `${inventory?.item_name || "Item"}${entry.quantity > 1 ? ` ×${entry.quantity}` : ""}`;
  }).join(", ");
}

function formatDateHeading(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

function paymentLabel(value: string | null) {
  if (!value) return "—";
  const normalized = value.toLowerCase();
  if (normalized === "pos") return "POS";
  if (normalized === "bank_transfer") return "Transfer";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type Filter = "today" | "yesterday" | "week" | "month" | "custom";

type Props = { refreshKey: number };

export default function SalesTable({ refreshKey }: Props) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filter, setFilter] = useState<Filter>("week");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    saleService.getSales().then(({ data, error }) => {
      if (error) toast.error("Failed to load sales history.");
      else setSales((data || []) as Sale[]);
      setLoading(false);
    });
  }, [refreshKey]);

  const summary = useMemo(() => {
    const now = new Date();
    const total = (items: Sale[]) => items.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    return {
      today: total(sales.filter(s => { const d = new Date(s.sale_date); return d >= startOfDay(now) && d <= endOfDay(now); })),
      week: total(sales.filter(s => { const d = new Date(s.sale_date); return d >= startOfWeek(now) && d <= endOfWeek(now); })),
      month: total(sales.filter(s => { const d = new Date(s.sale_date); return d >= startOfMonth(now) && d <= endOfMonth(now); })),
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    if (filter === "today") { start = startOfDay(now); end = endOfDay(now); }
    if (filter === "yesterday") { const d = new Date(now); d.setDate(d.getDate() - 1); start = startOfDay(d); end = endOfDay(d); }
    if (filter === "week") { start = startOfWeek(now); end = endOfWeek(now); }
    if (filter === "month") { start = startOfMonth(now); end = endOfMonth(now); }
    if (filter === "custom" && from) { start = startOfDay(new Date(`${from}T00:00:00`)); end = to ? endOfDay(new Date(`${to}T00:00:00`)) : endOfDay(start); }

    const needle = search.trim().toLowerCase();
    return sales.filter(sale => {
      const date = new Date(sale.sale_date);
      const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
      const searchable = `${itemNames(sale)} ${customer?.full_name || ""} ${sale.staff_name || ""} ${sale.payment_method || ""}`.toLowerCase();
      return (!start || date >= start) && (!end || date <= end) && (!needle || searchable.includes(needle));
    });
  }, [sales, filter, from, to, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Sale[]>();
    filteredSales.forEach(sale => { const key = dateKey(sale.sale_date); map.set(key, [...(map.get(key) || []), sale]); });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredSales]);

  const periodTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-xl font-bold tracking-tight text-slate-950">Sales History</h2><p className="mt-1 text-sm text-slate-500">A day-by-day record of what left the shop.</p></div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Today</p><p className="mt-1 text-lg font-bold text-slate-950">{money(summary.today)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">This week</p><p className="mt-1 text-lg font-bold text-slate-950">{money(summary.week)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">This month</p><p className="mt-1 text-lg font-bold text-slate-950">{money(summary.month)}</p></div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["today", "yesterday", "week", "month"] as Filter[]).map(value => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition ${filter === value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{value === "week" ? "This week" : value.charAt(0).toUpperCase() + value.slice(1)}</button>)}
            <button type="button" onClick={() => setFilter("custom")} className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition ${filter === "custom" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Custom</button>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input aria-label="Search sales history" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item, customer, staff or payment..." className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--novatech-primary)] focus:ring-2 focus:ring-[var(--novatech-primary)]/15" />
            {filter === "custom" && <><input aria-label="Sales from date" type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input aria-label="Sales to date" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /></>}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">{filteredSales.length} transaction{filteredSales.length === 1 ? "" : "s"}</span><span className="font-semibold text-slate-900">Period sales: {money(periodTotal)}</span></div>
        </div>

        {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading sales history…</div> : groups.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-slate-900">No sales in this period</p><p className="mt-1 text-sm text-slate-500">Try another date range or search.</p></div> : <div className="divide-y divide-slate-200">
          {groups.map(([key, daySales]) => {
            const dayTotal = daySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
            return <section key={key}>
              <div className="flex items-center justify-between gap-4 bg-slate-50/80 px-4 py-3 sm:px-5"><div><h3 className="font-semibold text-slate-950">{formatDateHeading(key)}</h3><p className="mt-0.5 text-xs text-slate-500">{daySales.length} transaction{daySales.length === 1 ? "" : "s"}</p></div><div className="text-right"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Daily sales</p><p className="text-lg font-bold text-slate-950">{money(dayTotal)}</p></div></div>
              <div className="hidden md:block">
                {daySales.map(sale => { const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers; return <div key={sale.id} className="grid grid-cols-[80px_minmax(220px,1.8fr)_minmax(120px,1fr)_100px_120px_70px] items-center gap-4 border-t border-slate-100 px-4 py-3 text-sm sm:px-5"><span className="font-medium text-slate-500">{new Date(sale.sale_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{itemNames(sale)}</p><p className="truncate text-xs text-slate-500">{customer?.full_name || "Walk-in"}</p></div><span className="truncate text-slate-600">{sale.staff_name || "—"}</span><Badge variant="secondary" className="w-fit">{paymentLabel(sale.payment_method)}</Badge><span className="text-right font-semibold text-slate-950">{money(sale.total)}</span><Link href={`/sales/${sale.id}`} className="text-right text-sm font-semibold text-teal-700 hover:text-teal-800">View</Link></div>; })}
              </div>
              <div className="divide-y divide-slate-100 md:hidden">{daySales.map(sale => { const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers; return <Link key={sale.id} href={`/sales/${sale.id}`} className="block p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-slate-950">{itemNames(sale)}</p><p className="mt-1 text-xs text-slate-500">{new Date(sale.sale_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {customer?.full_name || "Walk-in"}</p></div><p className="shrink-0 font-bold text-slate-950">{money(sale.total)}</p></div><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{paymentLabel(sale.payment_method)}</Badge>{sale.staff_name && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{sale.staff_name}</span>}</div></Link>; })}</div>
            </section>;
          })}
        </div>}
      </CardContent>
    </Card>
  );
}
