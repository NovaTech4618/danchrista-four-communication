"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, Banknote, Boxes, ClipboardList,
  Package, RefreshCw, UserRound, Wallet, Wrench,
} from "lucide-react";
import { dashboardService, type DashboardSummary } from "@/services/dashboardService";
import { repairService } from "@/services/repairService";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";

type CustomerRow = { full_name: string | null };
type CustomerRelation = CustomerRow | CustomerRow[] | null;
type DeviceRow = { brand: string | null; model: string | null; customers: CustomerRelation };
type DeviceRelation = DeviceRow | DeviceRow[] | null;
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
  { label: "Quote", statuses: ["Diagnosis", "Estimate Sent", "Customer Approved"] },
  { label: "Repair", statuses: ["Repairing"] },
  { label: "Test", statuses: ["Testing"] },
  { label: "Ready", statuses: ["Completed"] },
  { label: "Collected", statuses: ["Collected"] },
];

function firstDevice(value: DeviceRelation): DeviceRow | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function firstCustomer(value: CustomerRelation | undefined): CustomerRow | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function shopDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos", day: "numeric", month: "short",
  }).format(new Date(value));
}

function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function deviceLabel(repair: RepairRow) {
  const device = firstDevice(repair.devices);
  const label = [device?.brand, device?.model].filter(Boolean).join(" ");
  return label || "Unknown device";
}

function customerLabel(repair: RepairRow) {
  const device = firstDevice(repair.devices);
  const customer = firstCustomer(device?.customers);
  return customer?.full_name || "Unknown customer";
}

function statusLabel(status: string) {
  return status === "Completed" ? "Ready" : status;
}

function statusStyle(status: string) {
  if (status === "Completed" || status === "Collected") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["No Fix", "Failed Repair", "Returned Unrepaired", "Cancelled"].includes(status)) return "border-slate-200 bg-slate-100 text-slate-600";
  if (status === "Repairing" || status === "Testing") return "border-sky-200 bg-sky-50 text-sky-700";
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
  const monthKey = today.slice(0, 7);
  const monthRepairs = repairs?.filter((repair) => shopDate(repair.created_at).slice(0, 7) === monthKey) ?? [];
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
  const actions: Array<{ title: string; href: string; permission: Permission; icon: typeof Wrench }> =
    role === "owner"
      ? [
          { title: "New repair", href: "/repairs/new", permission: "repairs", icon: Wrench },
          { title: "Parts out", href: "/parts-collection", permission: "inventory", icon: Boxes },
          { title: "Engineers", href: "/engineers", permission: "engineers", icon: UserRound },
          { title: "Report", href: "/reports", permission: "profit", icon: ClipboardList },
          { title: "Closing", href: "/reports/daily-closing", permission: "daily_closing", icon: Wallet },
        ]
      : [
          { title: "New repair", href: "/repairs/new", permission: "repairs", icon: Wrench },
          { title: "Parts out", href: "/parts-collection", permission: "inventory", icon: Boxes },
          { title: "Stock", href: "/inventory", permission: "inventory", icon: Package },
          { title: "Sale", href: "/sales", permission: "sales", icon: Banknote },
          { title: "Closing", href: "/reports/daily-closing", permission: "daily_closing", icon: Wallet },
        ];
  const visibleActions = actions.filter((action) => hasPermission(role, action.permission));

  return (
    <section className="space-y-4" aria-labelledby="overview-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="overview-title" className="font-heading text-xl font-bold tracking-tight text-[#182a28]">Overview</h2>
        <button type="button" onClick={() => void load()} disabled={refreshing} aria-label="Refresh" title="Refresh" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#dfe6df] bg-white text-[#285c4d] hover:bg-[#f5f8f5] disabled:opacity-60">
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <Metric title="New today" value={metrics ? String(metrics.receivedToday) : "—"} icon={Wrench} href="/repairs" />
        <Metric title="Active" value={metrics ? String(metrics.active.length) : "—"} icon={Activity} href="/repairs" />
        <Metric title="Ready" value={metrics ? String(metrics.ready.length) : "—"} icon={ArrowUpRight} href="/repairs" />
        <Metric title="Late" value={metrics ? String(metrics.overdue.length) : "—"} icon={AlertTriangle} href="/repairs" tone={Boolean(metrics?.overdue.length) ? "amber" : "normal"} />
        {canSeeOwnerSummary && (
          <>
            <Metric title="Owing" value={summary ? money(summary.outstanding_customer) : "—"} icon={Wallet} href="/outstanding" />
            <Metric title="Engineers" value={summary ? money(summary.engineer_debit) : "—"} icon={UserRound} href="/engineers" />
            <Metric title="Low stock" value={summary ? String(summary.low_stock_count) : "—"} icon={Package} href="/inventory" tone={summary?.low_stock_count ? "amber" : "normal"} />
          </>
        )}
      </div>
      {(repairError || summaryError) && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some data did not load. Refresh to retry.
        </p>
      )}

      <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
        <h3 className="mb-3 font-heading text-lg font-bold text-[#182a28]">Quick links</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href} className="flex min-h-20 items-center gap-3 rounded-xl border border-[#e3e9e4] p-3 transition hover:border-[#bfd2c8] hover:bg-[#f7faf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-4" /></span>
                <span className="text-sm font-bold text-[#263a35]">{action.title}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#182a28]">Repairs</h3>
              <p className="text-xs text-[#74837e]">This month</p>
            </div>
            <Link href="/repairs" className="text-xs font-bold text-[#1d6a54] hover:underline">All</Link>
          </div>
          {repairs === null ? (
            <p className="rounded-xl bg-[#f7f8f5] p-4 text-sm text-[#74837e]">{repairError ? "Can't load repairs." : "Loading…"}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REPAIR_PIPELINE.map((stage) => {
                const count = monthRepairs.filter((repair) => stage.statuses.includes(repair.status)).length;
                return <Link key={stage.label} href="/repairs" className="rounded-xl border border-[#e6ebe6] bg-[#fbfcfa] p-3 transition hover:border-[#bfd2c8] hover:bg-[#f4f8f4]">
                  <span className="text-xs font-medium text-[#74837e]">{stage.label}</span>
                  <span className="mt-1 block font-heading text-2xl font-bold text-[#182a28]">{count}</span>
                </Link>;
              })}
            </div>
          )}
          {metrics && metrics.overdue.length > 0 && (
            <Link href="/repairs" className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{metrics.overdue.length} late</span>
            </Link>
          )}
        </section>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-bold text-[#182a28]">Ready</h3>
            <Link href="/repairs" className="text-xs font-bold text-[#1d6a54] hover:underline">All</Link>
          </div>
          {repairs === null ? (
            <p className="rounded-xl bg-[#f7f8f5] p-4 text-sm text-[#74837e]">Can't load repairs.</p>
          ) : readyRepairs.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-[#dfe6df] bg-[#fbfcfa] p-4 text-center">
              <p className="text-sm font-semibold text-[#263a35]">All clear</p>
            </div>
          ) : (
            <div className="space-y-2">
              {readyRepairs.map((repair) => (
                <Link key={repair.id} href={`/repairs/${repair.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#e3e9e4] p-3 transition hover:bg-[#f7faf7]">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#263a35]">{deviceLabel(repair)}</span>
                    <span className="mt-1 block truncate text-xs text-[#74837e]">{customerLabel(repair)}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Ready</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_8px_24px_rgba(18,59,52,0.04)] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-bold text-[#182a28]">Recent repairs</h3>
          <Link href="/repairs" className="text-xs font-bold text-[#1d6a54] hover:underline">All</Link>
        </div>
        {repairs === null ? (
          <p className="rounded-xl bg-[#f7f8f5] p-4 text-sm text-[#74837e]">Can't load repairs.</p>
        ) : recentRepairs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dfe6df] p-6 text-center">
            <p className="text-sm font-semibold text-[#263a35]">No repairs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf0ed]">
            {recentRepairs.map((repair) => (
              <Link key={repair.id} href={`/repairs/${repair.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#263a35]">{deviceLabel(repair)}</span>
                  <span className="mt-1 block truncate text-xs text-[#74837e]">{customerLabel(repair)} · {displayDate(repair.created_at)}</span>
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
  title, value, icon: Icon, href, tone = "normal",
}: {
  title: string;
  value: string;
  icon: typeof Wrench;
  href: string;
  tone?: "normal" | "amber";
}) {
  return (
    <Link href={href} className={`rounded-2xl border p-3 shadow-[0_4px_16px_rgba(18,59,52,0.04)] transition hover:-translate-y-0.5 hover:shadow-sm sm:p-4 ${tone === "amber" ? "border-amber-200 bg-amber-50/70" : "border-[#dfe6df] bg-white hover:border-[#bfd2c8]"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#74837e]">{title}</span>
        <Icon className={`size-4 shrink-0 ${tone === "amber" ? "text-amber-700" : "text-[#1d6a54]"}`} />
      </div>
      <span className="mt-2 block break-words font-heading text-xl font-bold tracking-tight text-[#182a28] sm:text-2xl">{value}</span>
    </Link>
  );
}
