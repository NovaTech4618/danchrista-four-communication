"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity as ActivityIcon, ArrowDownLeft, ArrowRight, ArrowUpRight, ClipboardCheck, CreditCard, Package, RefreshCw, Wrench } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Category = "all" | "repairs" | "inventory" | "money";

type ActivityItem = {
  id: string;
  category: Exclude<Category, "all">;
  title: string;
  description: string;
  detail?: string;
  occurredAt: string;
  href?: string;
  icon: typeof Wrench;
};

type RepairStatusRow = {
  id: string; repair_id: string; from_status: string | null; to_status: string; note: string | null; changed_at: string;
  repairs?: { devices?: { brand?: string | null; model?: string | null; customers?: { full_name?: string | null } | { full_name?: string | null }[] | null } | { brand?: string | null; model?: string | null; customers?: { full_name?: string | null } | { full_name?: string | null }[] | null }[] | null } | null;
};

type AssignmentRow = {
  id: string; repair_id: string; engineer_id: string; assigned_at: string; notes: string | null;
  engineers?: { name?: string | null } | { name?: string | null }[] | null;
  repairs?: { devices?: { brand?: string | null; model?: string | null; customers?: { full_name?: string | null } | { full_name?: string | null }[] | null } | { brand?: string | null; model?: string | null; customers?: { full_name?: string | null } | { full_name?: string | null }[] | null }[] | null } | null;
};

type StockRow = { id: string; inventory_id: string; movement_type: string; quantity: number; notes: string | null; created_at: string; inventory?: { item_name?: string | null; sku?: string | null } | { item_name?: string | null; sku?: string | null }[] | null };

type FinancialRow = { id: string; direction: "in" | "out"; category: string; amount: number | string; payment_method: string | null; description: string; occurred_at: string };

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<Category>("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [statusResult, assignmentResult, stockResult, financeResult] = await Promise.all([
      supabase.from("repair_status_history").select("id, repair_id, from_status, to_status, note, changed_at, repairs(devices(brand, model, customers(full_name)))").order("changed_at", { ascending: false }).limit(40),
      supabase.from("repair_assignments").select("id, repair_id, engineer_id, assigned_at, notes, engineers(name), repairs(devices(brand, model, customers(full_name)))").order("assigned_at", { ascending: false }).limit(30),
      supabase.from("inventory_stock_movements").select("id, inventory_id, movement_type, quantity, notes, created_at, inventory(item_name, sku)").order("created_at", { ascending: false }).limit(30),
      supabase.from("financial_transactions").select("id, direction, category, amount, payment_method, description, occurred_at").order("occurred_at", { ascending: false }).limit(30),
    ]);

    const next: ActivityItem[] = [];

    for (const row of (statusResult.data ?? []) as RepairStatusRow[]) {
      const device = Array.isArray(row.repairs?.devices) ? row.repairs?.devices[0] : row.repairs?.devices;
      const customer = Array.isArray(device?.customers) ? device?.customers[0] : device?.customers;
      const deviceName = `${device?.brand ?? "Unknown"} ${device?.model ?? "device"}`.trim();
      next.push({ id: `status-${row.id}`, category: "repairs", title: `Repair moved to ${row.to_status}`, description: `${deviceName}${customer?.full_name ? ` · ${customer.full_name}` : ""}`, detail: row.from_status ? `${row.from_status} → ${row.to_status}${row.note ? ` · ${row.note}` : ""}` : row.note ?? undefined, occurredAt: row.changed_at, href: `/repairs/${row.repair_id}`, icon: Wrench });
    }

    for (const row of (assignmentResult.data ?? []) as AssignmentRow[]) {
      const device = Array.isArray(row.repairs?.devices) ? row.repairs?.devices[0] : row.repairs?.devices;
      const customer = Array.isArray(device?.customers) ? device?.customers[0] : device?.customers;
      const engineer = Array.isArray(row.engineers) ? row.engineers[0] : row.engineers;
      const deviceName = `${device?.brand ?? "Unknown"} ${device?.model ?? "device"}`.trim();
      next.push({ id: `assignment-${row.id}`, category: "repairs", title: `Repair assigned to ${engineer?.name ?? "engineer"}`, description: `${deviceName}${customer?.full_name ? ` · ${customer.full_name}` : ""}`, detail: row.notes ?? undefined, occurredAt: row.assigned_at, href: `/repairs/${row.repair_id}`, icon: ClipboardCheck });
    }

    for (const row of (stockResult.data ?? []) as StockRow[]) {
      const inventory = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
      const movementLabel = row.movement_type.replaceAll("_", " ");
      const quantity = Math.abs(Number(row.quantity));
      const direction = row.quantity >= 0 ? "added" : "removed";
      next.push({ id: `stock-${row.id}`, category: "inventory", title: `${inventory?.item_name ?? "Stock item"} ${direction}`, description: `${quantity} unit${quantity === 1 ? "" : "s"} · ${movementLabel}`, detail: inventory?.sku ? `SKU ${inventory.sku}${row.notes ? ` · ${row.notes}` : ""}` : row.notes ?? undefined, occurredAt: row.created_at, href: "/inventory", icon: Package });
    }

    for (const row of (financeResult.data ?? []) as FinancialRow[]) {
      const amount = Number(row.amount) || 0;
      const isIncoming = row.direction === "in";
      next.push({ id: `finance-${row.id}`, category: "money", title: isIncoming ? "Money received" : "Business payment recorded", description: row.description, detail: `${formatNaira(amount)}${row.payment_method ? ` · ${row.payment_method}` : ""} · ${row.category.replaceAll("_", " ")}`, occurredAt: row.occurred_at, icon: isIncoming ? ArrowDownLeft : ArrowUpRight });
    }

    next.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    setItems(next);
    setLoading(false);
    const firstError = [statusResult.error, assignmentResult.error, stockResult.error, financeResult.error].find(Boolean);
    if (firstError && next.length === 0) toast.error("Could not load activity history.");
  }

  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => filter === "all" ? items : items.filter((item) => item.category === filter), [filter, items]);
  const todayCount = items.filter((item) => new Date(item.occurredAt).toDateString() === new Date().toDateString()).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1d6a54]">Operations</p><h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-950">Activity History</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">See the important work happening across repairs, inventory and money without opening every module.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></header>
        <section className="grid gap-3 sm:grid-cols-3"><Metric icon={ActivityIcon} label="Events" value={String(items.length)} hint="Recent operational events" /><Metric icon={Wrench} label="Repairs" value={String(items.filter((item) => item.category === "repairs").length)} hint="Status and assignments" /><Metric icon={CreditCard} label="Today" value={String(todayCount)} hint="Events recorded today" /></section>
        <Card className="overflow-hidden border-slate-200 shadow-sm"><CardContent className="p-0"><div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">{["all", "repairs", "inventory", "money"].map((value) => { const label = value === "all" ? "All activity" : value.charAt(0).toUpperCase() + value.slice(1); return <button key={value} type="button" onClick={() => setFilter(value as Category)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === value ? "border-[#cbded3] bg-[#eef4f1] text-[#1d6a54]" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}>{label}</button>; })}<span className="ml-auto text-xs text-slate-400">{filtered.length} event{filtered.length === 1 ? "" : "s"}</span></div>
          {loading ? <div className="space-y-3 p-5">{[1,2,3,4].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div> : filtered.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="grid size-12 place-items-center rounded-2xl bg-[#eef4f1] text-[#1d6a54]"><ActivityIcon className="size-6" /></div><h2 className="mt-4 font-heading text-lg font-semibold text-slate-900">No activity yet</h2><p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Operational events will appear here as your team moves repairs, stock and payments forward.</p></div> : <div className="divide-y divide-slate-100">{filtered.map((item) => { const Icon = item.icon; const content = <div className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-950">{item.title}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.category}</span></div><p className="mt-1 text-sm text-slate-600">{item.description}</p>{item.detail && <p className="mt-1 text-xs text-slate-400">{item.detail}</p>}<time className="mt-2 block text-[11px] text-slate-400" dateTime={item.occurredAt}>{formatDate(item.occurredAt)}</time></div>{item.href && <ArrowRight className="mt-2 size-4 shrink-0 text-slate-300" />}</div>; return item.href ? <Link key={item.id} href={item.href}>{content}</Link> : <div key={item.id}>{content}</div>; })}</div>}
        </CardContent></Card>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm"><div className="flex items-center gap-3"><ClipboardCheck className="size-5 text-slate-500" /><p className="text-slate-600">Need the deeper security trail? That remains in the manager-only Audit Log.</p></div><Link href="/audit" className="shrink-0 font-semibold text-[#1d6a54] hover:underline">Open audit log</Link></div>
      </div>
    </AppLayout>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof Wrench; label: string; value: string; hint: string }) { return <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-4" /></div><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 font-heading text-2xl font-bold text-slate-950">{value}</p></div></div><p className="mt-3 text-xs text-slate-400">{hint}</p></CardContent></Card>; }
function formatDate(value: string) { return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }); }
function formatNaira(value: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value); }
