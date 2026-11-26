"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { saleService } from "@/services/saleService";
import { inventoryService } from "@/services/inventoryService";
import { businessOperationsService } from "@/services/businessOperationsService";
import { repairService } from "@/services/repairService";
import type { Sale } from "@/types/sale";
import type { InventoryItem } from "@/types/inventory";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, Boxes, CalendarDays, ClipboardList,
  HandCoins, History, Plus, Search, ShoppingBag, Smartphone, TrendingUp,
  Wallet, Wrench, Zap,
} from "lucide-react";

const money = (value: number) => `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const closedRepairStatuses = ["Collected", "Cancelled", "No Fix", "Failed Repair", "Returned Unrepaired"];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type RepairSummary = { id: string; status: string; issue?: string | null; created_at?: string; devices?: { brand?: string; model?: string; customers?: { full_name?: string } | null } | null };

export default function WorkspacePage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [welcome, setWelcome] = useState("Welcome back");
  const [today, setToday] = useState("");
  const [repairs, setRepairs] = useState<RepairSummary[]>([]);
  const [overview, setOverview] = useState({
    salesToday: 0, salesTodayCount: 0, lowStock: 0,
    customerOutstanding: 0, loading: true, failed: false, repairsFailed: false,
  });

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then((result) => {
      if (active && result.data) setRole(result.data);
    });
    setWelcome(greeting());
    setToday(new Intl.DateTimeFormat("en-NG", {
      weekday: "long", day: "numeric", month: "short", year: "numeric",
    }).format(new Date()));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!role) return;
    let active = true;
    async function loadOverview() {
      const [salesResult, stockResult, balancesResult, repairsResult] = await Promise.all([
        hasPermission(role!, "sales") ? saleService.getSales() : Promise.resolve(null),
        hasPermission(role!, "inventory") ? inventoryService.getInventory() : Promise.resolve(null),
        hasPermission(role!, "outstanding") ? businessOperationsService.getCustomerBalances() : Promise.resolve(null),
        hasPermission(role!, "repairs") ? repairService.getAllRepairs() : Promise.resolve(null),
      ]);
      if (!active) return;
      const failed = Boolean(salesResult?.error || stockResult?.error || balancesResult?.error);
      const repairsFailed = Boolean(repairsResult?.error);
      const now = new Date();
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(startToday);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startWeek = new Date(startToday);
      startWeek.setDate(startWeek.getDate() - ((startWeek.getDay() + 6) % 7));
      const sales = (salesResult?.data ?? []) as Sale[];
      const todaySales = sales.filter((sale) => {
        const date = new Date(sale.sale_date);
        return date >= startToday && date < tomorrow;
      });
      const weekSales = sales.filter((sale) => {
        const date = new Date(sale.sale_date);
        return date >= startWeek && date < tomorrow;
      });
      const stock = (stockResult?.data ?? []) as InventoryItem[];
      const balances = (balancesResult?.data ?? []) as Array<{ balance?: number | string | null }>;
      const repairRows = (repairsResult?.data ?? []) as RepairSummary[];
      setRepairs(repairRows);
      setOverview({
        salesToday: todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        salesTodayCount: todaySales.length,
        phonesSoldToday: todaySales.reduce((sum, sale) => sum + Number((sale as any).items?.filter?.((item: any) => item.category === "Phone" || item.item_type === "phone").reduce?.((n: number, item: any) => n + Number(item.quantity || 1), 0) || 0), 0),
        lowStock: stock.filter((item) => Number(item.quantity) <= Number(item.minimum_stock)).length,
        customerOutstanding: balances.reduce((sum, item) => sum + Math.max(0, Number(item.balance || 0)), 0),
        loading: false, failed, repairsFailed,
      });
    }
    void loadOverview();
    return () => { active = false; };
  }, [role]);

  const activeRepairs = useMemo(() => repairs.filter((repair) => !closedRepairStatuses.includes(repair.status) && repair.status !== "Completed"), [repairs]);
  const readyRepairs = useMemo(() => repairs.filter((repair) => repair.status === "Completed"), [repairs]);
  const actions = [
    { title: "New sale", detail: "Sell a phone or accessory", href: "/sales", permission: "sales" as const, icon: ShoppingBag, featured: true },
    { title: "Log phone / repair", detail: "Register a device and its issue", href: "/repairs/new", permission: "repairs" as const, icon: Wrench },
    { title: "Find IMEI / receipt", detail: "Search a phone or transaction", href: "/search", permission: "search" as const, icon: Search },
    { title: "Phone records", detail: "Open device history", href: "/devices", permission: "repairs" as const, icon: Smartphone },
  ].filter((item) => role && hasPermission(role, item.permission));

  const metric = (value: number) => overview.loading ? "…" : overview.failed ? "Unavailable" : money(value);
  const count = (value: number, failed = overview.failed) => overview.loading ? "…" : failed ? "—" : value.toLocaleString("en-NG");

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1440px] space-y-6 pb-5 sm:space-y-8">
        <section className="relative overflow-hidden rounded-[26px] bg-[#102b23] px-5 py-6 text-white shadow-[0_18px_48px_rgba(16,43,35,0.14)] sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-1 top-5 size-44 rounded-full border border-white/[0.07]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#8fe0b4]"><span className="size-2 rounded-full bg-[#42c978]" /> AMEZING WORKSPACE</p>
              <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{welcome}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#c0d1c8]">Your shop at a glance. See what needs attention and get straight to work.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-xs font-medium text-[#d6e4dc]">
              <CalendarDays className="size-4 text-[#8fe0b4]" /> {today || "Today"}
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <Link href="/sales" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#42c978] px-4 py-2.5 text-sm font-bold text-[#08271a] transition hover:bg-[#6ce093]"><Plus className="size-4" /> New sale</Link>
            <Link href="/repairs/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]"><Wrench className="size-4" /> Receive repair</Link>
            <Link href="/search" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]"><Search className="size-4" /> Find a record</Link>
          </div>
        </section>

        <section aria-label="Shop overview">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#1d6a54]">Live overview</p><h2 className="mt-1 font-heading text-xl font-bold text-[#182a28]">Today in your shop</h2></div>
            <span className="rounded-full border border-[#dfe6df] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#718078]">From recorded data</span>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {hasPermission(role, "sales") && <MetricCard label="Sales today" value={metric(overview.salesToday)} detail={overview.loading ? "Loading sales" : overview.failed ? "Sales unavailable" : `${overview.salesTodayCount} completed sale${overview.salesTodayCount === 1 ? "" : "s"}`} icon={TrendingUp} tone="green" href="/sales" />}
            {hasPermission(role, "repairs") && <MetricCard label="Open repairs" value={count(activeRepairs.length, overview.repairsFailed)} detail="Jobs still in progress" icon={Wrench} tone="blue" href="/repairs" />}
            {hasPermission(role, "repairs") && <MetricCard label="Ready for pickup" value={count(readyRepairs.length, overview.repairsFailed)} detail="Completed jobs awaiting collection" icon={ClipboardList} tone="amber" href="/repairs" />}
            {hasPermission(role, "inventory") && <MetricCard label="Low stock" value={count(overview.lowStock)} detail="At or below reorder level" icon={Boxes} tone="orange" href="/inventory" />}
            {hasPermission(role, "outstanding") && <MetricCard label="Customer balances" value={metric(overview.customerOutstanding)} detail="Outstanding balances" icon={HandCoins} tone="purple" href="/owed-owing" />}
          </div>
        </section>

        <section aria-labelledby="quick-actions-heading">
          <div className="mb-3"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#1d6a54]">Get things done</p><h2 id="quick-actions-heading" className="mt-1 font-heading text-xl font-bold text-[#182a28]">Quick actions</h2></div>
          {role === null ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true">{[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#dfe6df] bg-white" />)}</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {actions.map(({title,detail,href,icon:Icon,featured}) => <Link key={title} href={href} className={`group flex min-h-[132px] flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54] ${featured ? "border-[#b9ddc7] bg-[#eff8f1]" : "border-[#dfe6df] bg-white hover:border-[#b8d1c4]"}`}>
              <div className="flex items-start justify-between gap-2"><span className={`grid size-10 place-items-center rounded-xl ${featured ? "bg-[#d7f0df] text-[#12633d]" : "bg-[#edf4ef] text-[#1d6a54]"}`}><Icon className="size-5" /></span><ArrowUpRight className="size-4 text-[#9aaba2] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1d6a54]" /></div>
              <div><h3 className="text-sm font-bold text-[#203a32]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#74837e]">{detail}</p></div>
            </Link>)}
          </div>}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#edf0ed] px-4 py-4 sm:px-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1d6a54]">Repair desk</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Needs attention</h2></div><Link href="/repairs" className="inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]">View all <ArrowRight className="size-3.5" /></Link></div>
            {overview.loading ? <div className="space-y-3 p-4"><div className="h-12 animate-pulse rounded-xl bg-[#f2f5f2]" /><div className="h-12 animate-pulse rounded-xl bg-[#f2f5f2]" /></div> : overview.repairsFailed ? <p className="p-5 text-sm text-[#74837e]">Repair information is unavailable right now.</p> : [...readyRepairs, ...activeRepairs].slice(0,4).length === 0 ? <div className="p-7 text-center"><Wrench className="mx-auto size-7 text-[#a7b6ad]" /><p className="mt-2 text-sm font-semibold text-[#394b45]">No open repair jobs</p><p className="mt-1 text-xs text-[#87958e]">New jobs will appear here when recorded.</p></div> : <div className="divide-y divide-[#edf0ed]">{[...readyRepairs, ...activeRepairs].slice(0,4).map((repair) => <Link key={repair.id} href={`/repairs/${repair.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#fafcf9] sm:px-5"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${repair.status === "Completed" ? "bg-[#fff4df] text-[#9b6612]" : "bg-[#eaf2fc] text-[#365d9b]"}`}><Wrench className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#203a32]">{repair.devices?.customers?.full_name || "Customer"}</span><span className="mt-0.5 block truncate text-xs text-[#74837e]">{[repair.devices?.brand,repair.devices?.model].filter(Boolean).join(" ") || repair.issue || "Repair job"}</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${repair.status === "Completed" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{repair.status === "Completed" ? "Ready" : repair.status}</span><ArrowRight className="size-4 shrink-0 text-[#a1afa8]" /></Link>)}</div>}
          </div>
          <div className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1d6a54]">Shortcuts</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">More of your workspace</h2>
            <div className="mt-4 space-y-2">
              <Shortcut href="/activity" icon={History} title="Activity history" detail="See recent recorded actions" />
              <Shortcut href="/inventory" icon={Boxes} title="Inventory" detail="Check stock and reorder levels" />
              <Shortcut href="/reports/daily-closing" icon={Wallet} title="Daily closing" detail="Review expenses and close the day" />
            </div>
            <div className="mt-4 rounded-xl bg-[#f3f7f3] p-3.5"><div className="flex items-center gap-2 text-[#1d6a54]"><Zap className="size-4" /><span className="text-xs font-bold">Keep records connected</span></div><p className="mt-1.5 text-xs leading-5 text-[#718078]">Record each sale, repair and stock movement in its proper place so the shop overview stays meaningful.</p></div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}

function MetricCard({label,value,detail,icon:Icon,tone,href}:{label:string;value:string;detail:string;icon:typeof TrendingUp;tone:"green"|"blue"|"amber"|"orange"|"purple";href:string}) {
  const tones={green:"bg-[#e8f5ec] text-[#187044]",blue:"bg-[#eaf0fb] text-[#365d9b]",amber:"bg-[#fff3dd] text-[#9b6612]",orange:"bg-[#fff0e5] text-[#b65a1d]",purple:"bg-[#f0eafb] text-[#6e4aa1]"};
  return <Link href={href} className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8d1c4] hover:shadow-md sm:p-5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">{label}</span><span className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-4" /></span></div><p className="mt-4 break-words text-2xl font-bold tracking-tight text-[#182a28]">{value}</p><p className="mt-1 text-xs text-[#7b8a82]">{detail}</p></Link>;
}
function Shortcut({href,icon:Icon,title,detail}:{href:string;icon:typeof History;title:string;detail:string}) {return <Link href={href} className="group flex items-center gap-3 rounded-xl border border-[#edf0ed] p-3 transition hover:border-[#c8dbcf] hover:bg-[#fafcf9]"><span className="grid size-9 place-items-center rounded-lg bg-[#edf4ef] text-[#1d6a54]"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#203a32]">{title}</span><span className="mt-0.5 block text-xs text-[#74837e]">{detail}</span></span><ArrowRight className="size-4 text-[#9aaba2] transition group-hover:translate-x-0.5 group-hover:text-[#1d6a54]" /></Link>}
