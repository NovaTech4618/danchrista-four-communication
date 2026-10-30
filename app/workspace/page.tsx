"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { saleService } from "@/services/saleService";
import { inventoryService } from "@/services/inventoryService";
import { businessOperationsService } from "@/services/businessOperationsService";
import type { Sale } from "@/types/sale";
import type { InventoryItem } from "@/types/inventory";
import {
  AlertTriangle, ArrowRight, Boxes, CalendarDays, HandCoins,
  ShoppingCart, TrendingUp, UserRound, Wallet, Wrench,
} from "lucide-react";

const quickLinks = [
  { title: "New sale", detail: "Record goods sold", href: "/sales", permission: "sales" as const, icon: ShoppingCart },
  { title: "Receive repair", detail: "Register a device", href: "/repairs/new", permission: "repairs" as const, icon: Wrench },
  { title: "Parts collection", detail: "Issue or return parts", href: "/parts-collection", permission: "inventory" as const, icon: Boxes },
  { title: "Engineer accounts", detail: "Work and balances", href: "/engineers", permission: "engineers" as const, icon: UserRound },
  { title: "Daily closing", detail: "Record expenses and reconcile", href: "/reports/daily-closing", permission: "daily_closing" as const, icon: Wallet },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const money = (value: number) => `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export default function WorkspacePage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [welcome, setWelcome] = useState("Welcome back");
  const [today, setToday] = useState("");
  const [overview, setOverview] = useState({
    salesToday: 0, salesTodayCount: 0, salesWeek: 0, lowStock: 0,
    customerOutstanding: 0, loading: true, failed: false,
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
      const [salesResult, stockResult, balancesResult] = await Promise.all([
        hasPermission(role, "sales") ? saleService.getSales() : Promise.resolve(null),
        hasPermission(role, "inventory") ? inventoryService.getInventory() : Promise.resolve(null),
        hasPermission(role, "outstanding") ? businessOperationsService.getCustomerBalances() : Promise.resolve(null),
      ]);
      if (!active) return;
      const failed = Boolean(salesResult?.error || stockResult?.error || balancesResult?.error);
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
        failed,
      });
    }
    void loadOverview();
    return () => { active = false; };
  }, [role]);

  const actions = quickLinks.filter((item) => role && hasPermission(role, item.permission));
  const metricValue = (value: number) => overview.loading ? "…" : overview.failed ? "Unavailable" : money(value);
  const countValue = (value: number) => overview.loading ? "…" : overview.failed ? "—" : value.toLocaleString("en-NG");

  return (
    <AppLayout>
      <main className="mx-auto max-w-[1180px] space-y-6 pb-4 lg:space-y-8 lg:pb-8">
        <section className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-medium text-[#1d6a54]">{welcome}</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#182a28] sm:text-3xl">Amezing</h1>
            <p className="mt-1 text-sm text-[#74837e]">Here’s what’s happening in your shop today.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-3 py-2 text-xs font-medium text-[#63746b]">
            <CalendarDays className="size-4 text-[#1d6a54]" /> {today}
          </div>
        </section>

        <section aria-label="Business overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {hasPermission(role, "sales") && (
            <>
              <Link href="/sales" className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Sales today</span><span className="grid size-9 place-items-center rounded-xl bg-[#e8f5ec] text-[#187044]"><TrendingUp className="size-4" /></span></div>
                <p className="mt-4 break-words text-xl font-bold tracking-tight text-[#182a28] sm:text-2xl">{metricValue(overview.salesToday)}</p>
                <p className="mt-1 text-xs text-[#7b8a82]">{overview.loading ? "Loading recorded sales" : overview.failed ? "Sales data unavailable" : `${overview.salesTodayCount} completed sale${overview.salesTodayCount === 1 ? "" : "s"}`}</p>
              </Link>
              <Link href="/sales" className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Sales this week</span><span className="grid size-9 place-items-center rounded-xl bg-[#eaf0fb] text-[#365d9b]"><TrendingUp className="size-4" /></span></div>
                <p className="mt-4 break-words text-xl font-bold tracking-tight text-[#182a28] sm:text-2xl">{metricValue(overview.salesWeek)}</p>
                <p className="mt-1 text-xs text-[#7b8a82]">Recorded sales · Monday to today</p>
              </Link>
            </>
          )}
          {hasPermission(role, "inventory") && (
            <Link href="/inventory" className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Low stock</span><span className="grid size-9 place-items-center rounded-xl bg-[#fff3dd] text-[#9b6612]"><AlertTriangle className="size-4" /></span></div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-[#182a28]">{countValue(overview.lowStock)}</p>
              <p className="mt-1 text-xs text-[#7b8a82]">Items at or below reorder level</p>
            </Link>
          )}
          {hasPermission(role, "outstanding") && (
            <Link href="/owed-owing" className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm transition hover:border-[#b8d1c4] hover:shadow-md sm:p-5">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#718078]">Customer balances</span><span className="grid size-9 place-items-center rounded-xl bg-[#f0eafb] text-[#6e4aa1]"><HandCoins className="size-4" /></span></div>
              <p className="mt-4 break-words text-xl font-bold tracking-tight text-[#182a28] sm:text-2xl">{metricValue(overview.customerOutstanding)}</p>
              <p className="mt-1 text-xs text-[#7b8a82]">Outstanding customer balances</p>
            </Link>
          )}
        </section>

        <section aria-labelledby="quick-actions-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Shortcuts</p>
              <h2 id="quick-actions-heading" className="mt-1 font-heading text-xl font-bold text-[#182a28]">Quick actions</h2>
            </div>
          </div>
          {role === null ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#dfe6df] bg-white" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {actions.map(({ title, detail, href, icon: Icon }) => (
                <Link key={title} href={href} className="group flex min-h-[100px] items-center gap-3 rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8d1c4] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#f2d8a5]"><Icon className="size-5" strokeWidth={1.9} /></span>
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
      </main>
    </AppLayout>
  );
}
