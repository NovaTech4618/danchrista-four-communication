"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { workspaceGroups } from "@/lib/workspaceSections";
import { saleService } from "@/services/saleService";
import { inventoryService } from "@/services/inventoryService";
import { businessOperationsService } from "@/services/businessOperationsService";
import type { Sale } from "@/types/sale";
import type { InventoryItem } from "@/types/inventory";
import {
  ArrowRight, Boxes, CalendarDays, CircleHelp, TrendingUp, HandCoins, AlertTriangle,
  Search, ShoppingCart, UserRound, Wrench, X,
} from "lucide-react";

const quickLinks = [
  { title: "New sale", detail: "Record a customer purchase", href: "/sales", permission: "sales" as const, icon: ShoppingCart },
  { title: "Receive repair", detail: "Register a phone for repair", href: "/repairs/new", permission: "repairs" as const, icon: Wrench },
  { title: "Parts collection", detail: "Record parts issued or returned", href: "/parts-collection", permission: "inventory" as const, icon: Boxes },
  { title: "Engineer accounts", detail: "Review work and balances", href: "/engineers", permission: "engineers" as const, icon: UserRound },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function WorkspacePage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [search, setSearch] = useState("");
  const [welcome, setWelcome] = useState("Welcome back");
  const [today, setToday] = useState("");
  const [overview, setOverview] = useState({ salesToday: 0, salesTodayCount: 0, salesWeek: 0, lowStock: 0, customerOutstanding: 0, loading: true });

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
      const [salesResult, stockResult, balancesResult] = await Promise.all([
        hasPermission(role, "sales") ? saleService.getSales() : Promise.resolve(null),
        hasPermission(role, "inventory") ? inventoryService.getInventory() : Promise.resolve(null),
        hasPermission(role, "outstanding") ? businessOperationsService.getCustomerBalances() : Promise.resolve(null),
      ]);
      if (!active) return;

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
      setOverview({
        salesToday: todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        salesTodayCount: todaySales.length,
        salesWeek: weekSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        lowStock: stock.filter((item) => Number(item.quantity) <= Number(item.minimum_stock)).length,
        customerOutstanding: balances.reduce((sum, item) => sum + Math.max(0, Number(item.balance || 0)), 0),
        loading: false,
      });
    }
    void loadOverview();
    return () => { active = false; };
  }, [role]);

  const groups = useMemo(() => workspaceGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.showOnHome !== false &&
      (!role || hasPermission(role, item.permission)) &&
      (search.trim() === "" || `${item.title} ${item.description} ${group.title}`.toLowerCase().includes(search.trim().toLowerCase()))
    ),
  })).filter((group) => group.items.length > 0), [role, search]);

  const actions = quickLinks.filter((item) => role && hasPermission(role, item.permission));

  return (
    <AppLayout>
      <main className="mx-auto max-w-[1400px] space-y-6 pb-4 lg:pb-8">
        <section className="relative isolate overflow-hidden rounded-[28px] border border-[#24483f] bg-[#0d211c] px-5 py-6 text-white shadow-[0_24px_70px_rgba(10,35,28,0.18)] sm:px-8 sm:py-8 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 -z-10 size-80 rounded-full bg-[#28755e]/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 size-72 rounded-full bg-[#d7a95a]/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#c4d9cf]">
              <span className="size-2 rounded-full bg-[#70c49a]" /> AMEZING WORKSPACE
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[#b5c9c0]">
              <CalendarDays className="size-4" /> {today || "Your shop workspace"}
            </div>
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-medium text-[#d7a95a]">{welcome}, welcome to Amezing.</p>
              <h1 className="mt-2 max-w-2xl font-heading text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                Let’s get the shop <span className="text-[#83c4a6]">running smoothly.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b0c4bb] sm:text-base">
                Your daily work, stock records and accounts in one place. Choose a task below to get started.
              </p>
            </div>
            <Link href="/help" className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
              <CircleHelp className="size-4" /> How to use Amezing <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-xs text-[#c4d9cf]">
            <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">Real business records</span>
            <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">Access based on your role</span>
            <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">Phone and desktop ready</span>
          </div>
        </section>

        <section aria-label="Business overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {hasPermission(role, "sales") && (
            <>
              <Link href="/sales" className="group rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,52,0.035)] transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Sales today</span><span className="grid size-8 place-items-center rounded-xl bg-[#e8f5ec] text-[#187044]"><TrendingUp className="size-4" /></span></div>
                <p className="mt-3 break-words text-xl font-bold tracking-tight text-[#182a28] sm:text-2xl">{overview.loading ? "Loading…" : `₦${overview.salesToday.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}</p>
                <p className="mt-1 text-xs text-[#7b8a82]">{overview.loading ? "Checking recorded sales" : `${overview.salesTodayCount} recorded sale${overview.salesTodayCount === 1 ? "" : "s"}`}</p>
              </Link>
              <Link href="/sales" className="group rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,52,0.035)] transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Sales this week</span><span className="grid size-8 place-items-center rounded-xl bg-[#eaf0fb] text-[#365d9b]"><TrendingUp className="size-4" /></span></div>
                <p className="mt-3 break-words text-xl font-bold tracking-tight text-[#182a28] sm:text-2xl">{overview.loading ? "Loading…" : `₦${overview.salesWeek.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}</p>
                <p className="mt-1 text-xs text-[#7b8a82]">Monday to today · recorded sales</p>
              </Link>
            </>
          )}
          {hasPermission(role, "inventory") && (
            <Link href="/inventory" className="group rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,52,0.035)] transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Low-stock items</span><span className="grid size-8 place-items-center rounded-xl bg-[#fff3dd] text-[#9b6612]"><AlertTriangle className="size-4" /></span></div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-[#182a28]">{overview.loading ? "…" : overview.lowStock}</p>
              <p className="mt-1 text-xs text-[#7b8a82]">At or below reorder level</p>
            </Link>
          )}
          {hasPermission(role, "outstanding") && (
            <Link href="/owed-owing" className="group rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,52,0.035)] transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Customer balances</span><span className="grid size-8 place-items-center rounded-xl bg-[#f0eafb] text-[#6e4aa1]"><HandCoins className="size-4" /></span></div>
              <p className="mt-3 break-words text-xl font-bold tracking-tight text-[#182a28] sm:text-2xl">{overview.loading ? "Loading…" : `₦${overview.customerOutstanding.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}</p>
              <p className="mt-1 text-xs text-[#7b8a82]">Outstanding customer balances</p>
            </Link>
          )}
        </section>

        <section aria-labelledby="quick-actions-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Get things done</p>
              <h2 id="quick-actions-heading" className="mt-1 font-heading text-xl font-bold text-[#182a28] sm:text-2xl">Quick actions</h2>
            </div>
            <span className="hidden text-xs text-[#74837e] sm:block">Your most-used workflows</span>
          </div>
          {role === null ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#dfe6df] bg-white" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {actions.map(({ title, detail, href, icon: Icon }) => (
                <Link key={title} href={href} className="group flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,52,0.035)] transition hover:-translate-y-0.5 hover:border-[#b8d1c4] hover:shadow-[0_12px_26px_rgba(18,59,52,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eaf3ed] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#f2d8a5]"><Icon className="size-5" strokeWidth={1.9} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#203a32]">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#74837e]">{detail}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-[#91a49a] transition group-hover:translate-x-0.5 group-hover:text-[#1d6a54]" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="all-sections-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Everything in its place</p>
              <h2 id="all-sections-heading" className="mt-1 font-heading text-xl font-bold text-[#182a28] sm:text-2xl">Shop sections</h2>
              <p className="mt-1 text-sm text-[#74837e]">Open a section to record or review actual shop activity.</p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#82938b]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find sales, repairs, parts…" aria-label="Search shop sections" className="h-11 w-full rounded-xl border border-[#dfe6df] bg-white pl-10 pr-10 text-sm text-[#182a28] outline-none transition placeholder:text-[#8a9992] focus:border-[#1d6a54] focus:ring-4 focus:ring-[#1d6a54]/10" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-[#74837e] hover:bg-[#eef4f1]"><X className="size-4" /></button>}
            </label>
          </div>

          {role === null ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-[#dfe6df] bg-white" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbd8d0] bg-white p-8 text-center">
              <Search className="mx-auto size-7 text-[#789087]" />
              <p className="mt-3 font-semibold text-[#203a32]">No matching sections</p>
              <p className="mt-1 text-sm text-[#74837e]">Try another search term.</p>
              <button type="button" onClick={() => setSearch("")} className="mt-4 rounded-xl bg-[#123b34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d6a54]">Clear search</button>
            </div>
          ) : (
            <div className="space-y-7">
              {groups.map((group) => (
                <section key={group.title} aria-labelledby={group.title.replaceAll(" ", "-").toLowerCase()}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 id={group.title.replaceAll(" ", "-").toLowerCase()} className="font-heading text-base font-bold text-[#263a35] sm:text-lg">{group.title}</h3>
                      <p className="mt-0.5 text-xs text-[#829088]">{group.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#dfe6df] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#6b7e74]">{group.items.length} sections</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map(({ title, href, description, icon: Icon }) => (
                      <Link key={title} href={href} className="group flex min-h-[126px] min-w-0 gap-3 rounded-2xl border border-[#e0e7e1] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#bdd1c5] hover:shadow-[0_10px_25px_rgba(18,59,52,0.07)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54] sm:p-5">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eff5f1] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#f2d8a5]"><Icon className="size-[18px]" strokeWidth={1.9} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-[#263a35]">{title}</span>
                          <span className="mt-1.5 block text-xs leading-5 text-[#74837e]">{description}</span>
                          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]">Open section <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <p className="pb-2 text-center text-[11px] leading-5 text-[#8b9991]">
          Only sections allowed for your account are shown. Use the Help &amp; Section Guide if you are unsure which record to update.
        </p>
      </main>
    </AppLayout>
  );
}
