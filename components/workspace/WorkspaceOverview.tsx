"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, Banknote, Boxes,
  ClipboardList, Package, RefreshCw, UserRound, Wallet, Wrench,
} from "lucide-react";
import { dashboardService, type DashboardSummary } from "@/services/dashboardService";
import { repairService } from "@/services/repairService";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";

type CustomerRelation = { full_name: string | null } | { full_name: string | null }[] | null;
type DeviceRelation = {
  brand: string | null;
  model: string | null;
  customers: CustomerRelation;
} | {
  brand: string | null;
  model: string | null;
  customers: CustomerRelation;
}[] | null;
type RepairRow = {
  id: string;
  issue: string;
  status: string;
  created_at: string;
  expected_completion_date: string | null;
  devices: DeviceRelation;
};
type OverviewProps = { role: StaffRole };

const TERMINAL_STATUSES = ["Collected", "Cancelled", "No Fix", "Failed Repair", "Returned Unrepaired"];
const REPAIR_PIPELINE = [
  { label: "Received", statuses: ["Received"] },
  { label: "Diagnosis / quote", statuses: ["Diagnosis", "Estimate Sent", "Customer Approved"] },
  { label: "Repairing", statuses: ["Repairing"] },
  { label: "Testing", statuses: ["Testing"] },
  { label: "Ready for pickup", statuses: ["Completed"] },
  { label: "Collected", statuses: ["Collected"] },
];

function related<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function shopDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function deviceLabel(repair: RepairRow) {
  const device = related(repair.devices);
  const label = [device?.brand, device?.model].filter(Boolean).join(" ");
  return label || "Device details unavailable";
}

function customerLabel(repair: RepairRow) {
  const device = related(repair.devices);
  const customer = related(device?.customers);
  return customer?.full_name || "Customer name unavailable";
}

function statusLabel(status: string) {
  return status === "Completed" ? "Ready for pickup" : status;
}

function statusStyle(status: string) {
  if (status === "Completed" || status === "Collected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["No Fix", "Failed Repair", "Returned Unrepaired", "Cancelled"].includes(status)) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  if (status === "Repairing" || status === "Testing") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function WorkspaceOverview({ role }: OverviewProps) {
  const [repairs, setRepairs] = useState<RepairRow[] | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [repairError, setRepairError] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const canSeeOwnerSummary = hasPermission(role, "profit");

  const load = useCallback(async () => {
    setRefreshing(true);
    const [repairResult, summaryResult] = await Promise.all([
      repairService.getAllRepairs(),
      canSeeOwnerSummary ? dashboardService.getSummary() : Promise.resolve(null),
    ]);

    if (repairResult.error) {
      setRepairs(null);
      setRepairError(true);
    } else {
      setRepairs((repairResult.data ?? []) as unknown as RepairRow[]);
      setRepairError(false);
    }

    if (canSeeOwnerSummary && summaryResult) {
      if (summaryResult.error || !summaryResult.data) {
        setSummary(null);
        setSummaryError(true);
      } else {
        setSummary(summaryResult.data);
        setSummaryError(false);
      }
    }
    setRefreshing(false);
  }, [canSeeOwnerSummary]);

  useEffect(() => { void load(); }, [load]);

  const today = shopDate(new Date());
  const metrics = useMemo(() => {
    if (!repairs) return null;
    const receivedToday = repairs.filter((repair) => shopDate(repair.created_at) === today).length;
    const active = repairs.filter((repair) => !TERMINAL_STATUSES.includes(repair.status) && repair.status !== "Completed");
    const ready = repairs.filter((repair) => repair.status === "Completed");
    const overdue = active.filter((repair) => repair.expected_completion_date && repair.expected_completion_date < today);
    return { receivedToday, active, ready, overdue };
  }, [repairs, today]);

  const recentRepairs = repairs?.slice(0, 5) ?? [];
  const readyRepairs = metrics?.ready.slice(0, 4) ?? [];
  const actions: Array<{ title: string; detail: string; href: string; permission: Permission; icon: typeof Wrench }> =
    role === "owner"
      ? [
          { title: "New repair", detail: "Receive a phone and record its fault", href: "/repairs/new", permission: "repairs", icon: Wrench },
          { title: "Daily parts collection", detail: "Track parts given to or returned by engineers", href: "/parts-collection", permission: "inventory", icon: Boxes },
          { title: "Engineers & balances", detail: "Review parts, payments and outstanding balances", href: "/engineers", permission: "engineers", icon: UserRound },
          { title: "Engineer daily report", detail: "Check today's part movements and payments", href: "/reports", permission: "profit", icon: ClipboardList },
          { title: "Expenses & closing", detail: "Record costs and reconcile the day", href: "/reports/daily-closing", permission: "daily_closing", icon: Wallet },
        ]
      : [
          { title: "New repair", detail: "Receive a phone and record its fault", href: "/repairs/new", permission: "repairs", icon: Wrench },
          { title: "Daily parts collection", detail: "Track parts given out and returned", href: "/parts-collection", permission: "inventory", icon: Boxes },
          { title: "Phone parts", detail: "Find stock and check quantities", href: "/inventory", permission: "inventory", icon: Package },
          { title: "Sales / POS", detail: "Record a shop sale", href: "/sales", permission: "sales", icon: Banknote },
          { title: "Expenses & closing", detail: "Record shop expenses", href: "/reports/daily-closing", permission: "daily_closing", icon: Wallet },
        ];
  const visibleActions = actions.filter((action) => hasPermission(role, action.permission));

  return (
    <section className="space-y-5" aria-labelledby="shop-activity-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Shop activity</p>
          <h2 id="shop-activity-heading" className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#182a28]">At a glance</h2>
          <p className="mt-1 text-sm text-[#74837e]">Live repair work and the main tasks for the shop.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={refreshing} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-semibold text-[#285c4d] hover:bg-[#f5f8f5] disabled:opacity-60 sm:self-auto">
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Repairs received today" value={metrics ? String(metrics.receivedToday) : "—"} detail="New repair records" icon={Wrench} href="/repairs" />
        <Metric title="In the workshop" value={metrics ? String(metrics.active.length) : "—"} detail="Still being worked on" icon={Activity} href="/repairs" />
        <Metric title="Ready for pickup" value={metrics ? String(metrics.ready.length) : "—"} detail="Completed, awaiting collection" icon={ArrowUpRight} href="/repairs" />
        <Metric title="Overdue jobs" value={metrics ? String(metrics.overdue.length) : "—"} detail="Past expected date, still in progress" icon={AlertTriangle} href="/repairs" tone={Boolean(metrics?.overdue.length) ? "amber" : "normal"} />
        {canSeeOwnerSummary && (
          <>
            <Metric title="Customer balances due" value={summary ? money(summary.outstanding_customer) : "—"} detail="Outstanding across customer accounts" icon={Wallet} href="/outstanding" />
            <Metric title="Engineer balances" value={summary ? money(summary.engineer_debit) : "—"} detail="Engineer account overview" icon={UserRound} href="/engineers" />
            <Metric title="Low-stock items" value={summary ? String(summary.low_stock_count) : "—"} detail="Check quantities before issuing parts" icon={Package} href="/inventory" tone={summary?.low_stock_count ? "amber" : "normal"} />
          </>
        )}
      </div>
      {(repairError || summaryError) && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some live figures could not be loaded. Refresh to try again; unavailable values are shown as a dash rather than a misleading zero.
        </div>
      )}

      <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Quick actions</p>
          <h3 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Start the next task</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href} className="group flex min-h-24 items-start gap-3 rounded-xl border border-[#e3e9e4] p-3 transition hover:border-[#bfd2c8] hover:bg-[#f7faf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#263a35]">{action.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#74837e]">{action.detail}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#1d6a54]">Open <ArrowRight className="size-3" /></span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Repair flow</p>
              <h3 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Current pipeline</h3>
              <p className="mt-1 text-xs text-[#74837e]">Counts are based on saved repair statuses.</p>
            </div>
            <Link href="/repairs" className="shrink-0 text-xs font-bold text-[#1d6a54] hover:underline">All repairs</Link>
          </div>
          {repairs === null ? (
            <p className="rounded-xl bg-[#f7f8f5] p-4 text-sm text-[#74837e]">{repairError ? "Repair status counts are unavailable." : "Loading repair statuses…"}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REPAIR_PIPELINE.map((stage) => {
                const count = repairs.filter((repair) => stage.statuses.includes(repair.status)).length;
                return <Link key={stage.label} href="/repairs" className="rounded-xl border border-[#e6ebe6] bg-[#fbfcfa] p-3 transition hover:border-[#bfd2c8] hover:bg-[#f4f8f4]">
                  <span className="text-xs font-medium text-[#74837e]">{stage.label}</span>
                  <span className="mt-1 block font-heading text-2xl font-bold text-[#182a28]">{count}</span>
                </Link>;
              })}
            </div>
          )}
          {metrics && metrics.overdue.length > 0 && (
            <Link href="/repairs" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span><strong>{metrics.overdue.length} overdue {metrics.overdue.length === 1 ? "job needs" : "jobs need"} attention.</strong> Check the expected completion dates and update the repair records.</span>
            </Link>
          )}
        </section>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Customer collection</p>
              <h3 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Ready for pickup</h3>
              <p className="mt-1 text-xs text-[#74837e]">Completed repairs that have not been marked collected.</p>
            </div>
            <Link href="/repairs" className="shrink-0 text-xs font-bold text-[#1d6a54] hover:underline">View all</Link>
          </div>
          {repairs === null ? (
            <p className="rounded-xl bg-[#f7f8f5] p-4 text-sm text-[#74837e]">Ready-for-pickup jobs could not be confirmed.</p>
          ) : readyRepairs.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-[#dfe6df] bg-[#fbfcfa] p-4 text-center">
              <Wrench className="size-5 text-[#9aa9a4]" />
              <p className="mt-2 text-sm font-semibold text-[#263a35]">No devices waiting for pickup</p>
              <p className="mt-1 text-xs text-[#74837e]">When a repair is marked completed, it will appear here until collected.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {readyRepairs.map((repair) => (
                <Link key={repair.id} href={`/repairs/${repair.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#e3e9e4] p-3 transition hover:bg-[#f7faf7]">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#263a35]">{deviceLabel(repair)}</span>
                    <span className="mt-1 block truncate text-xs text-[#74837e]">{customerLabel(repair)}</span>
                    <span className="mt-1 block text-[11px] text-[#89958f]">Received {displayDate(repair.created_at)}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Ready</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Latest records</p>
            <h3 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Recent repair jobs</h3>
          </div>
          <Link href="/repairs" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#1d6a54] hover:underline">View all <ArrowRight className="size-3.5" /></Link>
        </div>
        {repairs === null ? (
          <p className="rounded-xl bg-[#f7f8f5] p-4 text-sm text-[#74837e]">Recent repair jobs could not be loaded.</p>
        ) : recentRepairs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dfe6df] p-6 text-center">
            <p className="text-sm font-semibold text-[#263a35]">No repair jobs recorded yet</p>
            <p className="mt-1 text-xs text-[#74837e]">New repair records will appear here after they are saved.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf0ed]">
            {recentRepairs.map((repair) => (
              <Link key={repair.id} href={`/repairs/${repair.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#263a35]">{deviceLabel(repair)}</span>
                  <span className="mt-1 block truncate text-xs text-[#74837e]">{customerLabel(repair)} · {displayDate(repair.created_at)}</span>
                  <span className="mt-1 block max-w-full truncate text-xs text-[#89958f]">{repair.issue || "No issue description saved"}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyle(repair.status)}`}>{statusLabel(repair.status)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function Metric({
  title, value, detail, icon: Icon, href, tone = "normal",
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Wrench;
  href: string;
  tone?: "normal" | "amber";
}) {
  return (
    <Link href={href} className={`rounded-2xl border p-4 shadow-[0_4px_16px_rgba(18,59,52,0.04)] transition hover:-translate-y-0.5 hover:shadow-sm ${tone === "amber" ? "border-amber-200 bg-amber-50/70" : "border-[#dfe6df] bg-white hover:border-[#bfd2c8]"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-[#74837e]">{title}</span>
        <Icon className={`size-4 shrink-0 ${tone === "amber" ? "text-amber-700" : "text-[#1d6a54]"}`} />
      </div>
      <span className="mt-3 block font-heading text-2xl font-bold tracking-tight text-[#182a28]">{value}</span>
      <span className="mt-1 block text-[11px] leading-5 text-[#89958f]">{detail}</span>
    </Link>
  );
}
