"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, RefreshCw, RotateCcw, Wallet, Wrench } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { engineerService } from "@/services/engineerService";
import type { Engineer } from "@/types/engineer";

type MovementType = "collected" | "returned" | "used" | "paid";
type PartItem = { item_name: string; brand?: string | null; compatible_models?: string | null; subcategory?: string | null };
type Movement = {
  id: string;
  engineer_id: string;
  engineer_name: string;
  inventory_id: string;
  quantity: number;
  unit_price?: number | null;
  created_at: string;
  notes?: string | null;
  movement: MovementType;
  return_condition?: "normal" | "faulty" | null;
  payment_method?: string | null;
  item?: PartItem | null;
};
type OutstandingPart = {
  engineer_id: string;
  engineer_name: string;
  inventory_id: string;
  quantity: number;
  issued: number;
  returned: number;
  used: number;
  paid: number;
  item?: PartItem | null;
};
type Payment = {
  id: string;
  engineer_id: string;
  credit: number | null;
  payment_method: string | null;
  transaction_date: string;
  notes: string | null;
};
type EngineerDaily = {
  engineer_id: string;
  name: string;
  given: number;
  returned: number;
  used: number;
  payments: number;
  paymentCount: number;
};

const money = (value: number) => "₦" + Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });
const quantity = (value: number) => Number(value || 0).toLocaleString("en-NG");
const shopDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return parts.find((part) => part.type === "year")!.value + "-" +
    parts.find((part) => part.type === "month")!.value + "-" +
    parts.find((part) => part.type === "day")!.value;
};
function nextShopDate(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + 1, 12));
  return [next.getUTCFullYear(), String(next.getUTCMonth() + 1).padStart(2, "0"), String(next.getUTCDate()).padStart(2, "0")].join("-");
}
function actionLabel(movement: MovementType, condition?: "normal" | "faulty" | null) {
  if (movement === "collected") return "Given out";
  if (movement === "returned") return condition === "faulty" ? "Faulty return" : "Returned";
  if (movement === "used") return "Marked used";
  return "Marked paid";
}
function timeLabel(date: string) {
  return new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}
function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }).format(new Date(date + "T12:00:00+01:00"));
}

export default function ReportsPage() {
  const [date, setDate] = useState(shopDate());
  const [movements, setMovements] = useState<Movement[]>([]);
  const [outstanding, setOutstanding] = useState<OutstandingPart[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movementError, setMovementError] = useState("");
  const [outstandingError, setOutstandingError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [engineerError, setEngineerError] = useState("");

  async function load(selectedDate = date, manual = false) {
    setLoading(true);
    if (manual) setRefreshing(true);
    setMovementError("");
    setOutstandingError("");
    setPaymentError("");
    setEngineerError("");

    const nextDate = nextShopDate(selectedDate);
    const start = selectedDate + "T00:00:00+01:00";
    const end = nextDate + "T00:00:00+01:00";

    try {
      const [movementResult, outstandingResult, paymentResult, engineerResult] = await Promise.all([
        engineerService.getTodayPartMovement(selectedDate),
        engineerService.getOutstandingPartBalances(),
        supabase.from("engineer_transactions")
          .select("id,engineer_id,credit,payment_method,transaction_date,notes")
          .eq("transaction_type", "payment_in")
          .gte("transaction_date", start)
          .lt("transaction_date", end)
          .order("transaction_date", { ascending: false }),
        engineerService.getEngineers(),
      ]);

      if (movementResult.error) setMovementError("Parts movements could not be loaded. Retry to see the correct daily activity.");
      setMovements((movementResult.data ?? []) as Movement[]);

      if (outstandingResult.error) setOutstandingError("Parts still with engineers could not be verified.");
      setOutstanding((outstandingResult.data ?? []) as OutstandingPart[]);

      if (paymentResult.error) setPaymentError("Engineer payments could not be loaded. The total is hidden to avoid showing a misleading figure.");
      setPayments((paymentResult.data ?? []) as Payment[]);

      if (engineerResult.error) setEngineerError("Some engineer names could not be loaded.");
      setEngineers((engineerResult.data ?? []) as Engineer[]);
    } catch {
      setMovementError("The report could not be loaded. Check your connection and retry.");
      setOutstandingError("The report could not be loaded. Check your connection and retry.");
      setPaymentError("The report could not be loaded. Check your connection and retry.");
      setEngineerError("The report could not be loaded. Check your connection and retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(date); }, [date]);

  const engineerNameMap = useMemo(() => new Map(engineers.map((engineer) => [engineer.id, engineer.name])), [engineers]);

  const totalGiven = movements.filter((item) => item.movement === "collected").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalReturned = movements.filter((item) => item.movement === "returned").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalUsed = movements.filter((item) => item.movement === "used").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalStillOut = outstanding.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const paymentTotal = payments.reduce((sum, payment) => sum + Number(payment.credit || 0), 0);

  const dailyByEngineer = useMemo(() => {
    const byId = new Map<string, EngineerDaily>();
    const get = (id: string, fallbackName?: string) => {
      let row = byId.get(id);
      if (!row) {
        row = { engineer_id: id, name: engineerNameMap.get(id) || fallbackName || "Engineer", given: 0, returned: 0, used: 0, payments: 0, paymentCount: 0 };
        byId.set(id, row);
      }
      return row;
    };
    movements.forEach((item) => {
      const row = get(item.engineer_id, item.engineer_name);
      if (item.movement === "collected") row.given += Number(item.quantity || 0);
      if (item.movement === "returned") row.returned += Number(item.quantity || 0);
      if (item.movement === "used") row.used += Number(item.quantity || 0);
    });
    payments.forEach((payment) => {
      const row = get(payment.engineer_id);
      row.payments += Number(payment.credit || 0);
      row.paymentCount += 1;
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [movements, payments, engineerNameMap]);

  const paymentByEngineer = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; amount: number; count: number; methods: string[] }>();
    payments.forEach((payment) => {
      const existing = byId.get(payment.engineer_id) ?? {
        id: payment.engineer_id,
        name: engineerNameMap.get(payment.engineer_id) || "Engineer",
        amount: 0,
        count: 0,
        methods: [],
      };
      existing.amount += Number(payment.credit || 0);
      existing.count += 1;
      if (payment.payment_method && !existing.methods.includes(payment.payment_method)) existing.methods.push(payment.payment_method);
      byId.set(payment.engineer_id, existing);
    });
    return [...byId.values()].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  }, [payments, engineerNameMap]);

  const currentActivity = movements;
  const reportHasError = Boolean(movementError || outstandingError || paymentError || engineerError);

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl space-y-5 pb-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Amezing Limited · Engineer records</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Daily Report</h1>
            <p className="mt-1 text-sm text-slate-500">Four quick answers: parts given out, returned, used, and what remains with engineers.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/workspace" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-4" />Home</Link>
            <input aria-label="Report date" type="date" value={date} max={shopDate()} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" />
            <button type="button" onClick={() => void load(date, true)} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#123b34] px-3 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw className={"size-4 " + (refreshing ? "animate-spin" : "")} />Refresh</button>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{dateLabel(date)}</span>
          <span className="ml-2">· Amounts show payments recorded from engineers only. This page does not include customer sales or repair records.</span>
        </div>

        {reportHasError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Some report information is unavailable.</p>
          <p className="mt-1">{[movementError, outstandingError, paymentError, engineerError].filter(Boolean).join(" ")}</p>
          <button type="button" onClick={() => void load(date, true)} className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold">Retry report</button>
        </div>}

        <section className="grid gap-3 grid-cols-2 lg:grid-cols-5" aria-label="Daily totals">
          <Metric label="Parts given out" value={movementError ? "—" : quantity(totalGiven)} note="Today" icon={<Package className="size-4" />} />
          <Metric label="Parts returned" value={movementError ? "—" : quantity(totalReturned)} note="Today" icon={<RotateCcw className="size-4" />} />
          <Metric label="Parts marked used" value={movementError ? "—" : quantity(totalUsed)} note="Today" icon={<Wrench className="size-4" />} />
          <Metric label="Payments received" value={paymentError ? "—" : money(paymentTotal)} note="From engineers today" icon={<Wallet className="size-4" />} />
          <Metric label="Parts still with engineers" value={outstandingError ? "—" : quantity(totalStillOut)} note="All open parts records" icon={<Package className="size-4" />} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <h2 className="text-lg font-bold text-slate-950">What each engineer did today</h2>
            <p className="mt-1 text-sm text-slate-500">One line per engineer with activity. Balances are not mixed into today's totals.</p>
          </div>
          {loading ? <LoadingRows /> : dailyByEngineer.length === 0 ? <Empty text={movementError || paymentError ? "No activity can be confirmed because some records failed to load." : "No engineer parts movements or payments recorded on this date."} /> :
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Engineer</th><th className="px-4 py-3 text-right">Given out</th><th className="px-4 py-3 text-right">Returned</th><th className="px-4 py-3 text-right">Used</th><th className="px-4 py-3 text-right">Money received</th></tr></thead>
                <tbody>{dailyByEngineer.map((row) => <tr key={row.engineer_id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td><td className="px-4 py-3 text-right tabular-nums">{movementError ? "—" : quantity(row.given)}</td><td className="px-4 py-3 text-right tabular-nums">{movementError ? "—" : quantity(row.returned)}</td><td className="px-4 py-3 text-right tabular-nums">{movementError ? "—" : quantity(row.used)}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{paymentError ? "—" : money(row.payments)}</td></tr>)}</tbody>
              </table>
            </div>
          }
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <h2 className="text-lg font-bold text-slate-950">Parts movements</h2>
            <p className="mt-1 text-sm text-slate-500">The exact part and quantity recorded for each movement on the selected day.</p>
          </div>
          {loading ? <LoadingRows /> : currentActivity.length === 0 ? <Empty text={movementError ? "Parts movements could not be confirmed." : "No parts movements recorded on this date."} /> :
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Engineer</th><th className="px-4 py-3">Part</th><th className="px-4 py-3">Action</th><th className="px-4 py-3 text-right">Qty</th></tr></thead>
                <tbody>{currentActivity.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="whitespace-nowrap px-4 py-3 text-slate-500">{timeLabel(item.created_at)}</td><td className="px-4 py-3 font-semibold text-slate-900">{item.engineer_name || engineerNameMap.get(item.engineer_id) || "Engineer"}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{item.item?.item_name || "Part name unavailable"}</p><p className="text-xs text-slate-500">{[item.item?.brand, item.item?.subcategory, item.item?.compatible_models].filter(Boolean).join(" · ")}</p></td><td className="px-4 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + (item.movement === "returned" ? "bg-blue-50 text-blue-700" : item.movement === "used" ? "bg-amber-50 text-amber-700" : item.movement === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700")}>{actionLabel(item.movement, item.return_condition)}</span></td><td className="px-4 py-3 text-right font-bold tabular-nums">{quantity(item.quantity)}</td></tr>)}</tbody>
              </table>
            </div>
          }
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <h2 className="text-lg font-bold text-slate-950">Payments received from engineers</h2>
            <p className="mt-1 text-sm text-slate-500">Recorded payments only, grouped by engineer. This is not a cash count.</p>
          </div>
          {loading ? <LoadingRows /> : paymentByEngineer.length === 0 ? <Empty text={paymentError ? "Payments could not be confirmed." : "No engineer payments recorded on this date."} /> :
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Engineer</th><th className="px-4 py-3">Payment method</th><th className="px-4 py-3 text-right">Payments</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
                <tbody>{paymentByEngineer.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td><td className="px-4 py-3 text-slate-600">{row.methods.length ? row.methods.map((method) => method.replace(/_/g, " ")).join(", ") : "Not recorded"}</td><td className="px-4 py-3 text-right tabular-nums">{row.count}</td><td className="px-4 py-3 text-right font-bold tabular-nums">{money(row.amount)}</td></tr>)}</tbody>
              </table>
            </div>
          }
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <h2 className="text-lg font-bold text-slate-950">Parts still with engineers</h2>
            <p className="mt-1 text-sm text-slate-500">Collected quantity minus returned, used and paid quantities, based on recorded movements.</p>
          </div>
          {loading ? <LoadingRows /> : outstanding.length === 0 ? <Empty text={outstandingError ? "Outstanding parts could not be verified." : "No outstanding parts are recorded for engineers."} /> :
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Engineer</th><th className="px-4 py-3">Part</th><th className="px-4 py-3 text-right">Qty remaining</th></tr></thead>
                <tbody>{outstanding.slice().sort((a, b) => a.engineer_name.localeCompare(b.engineer_name) || (a.item?.item_name || "").localeCompare(b.item?.item_name || "")).map((item) => <tr key={item.engineer_id + ":" + item.inventory_id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-slate-900">{item.engineer_name}</td><td className="px-4 py-3 text-slate-700">{item.item?.item_name || "Part name unavailable"}<p className="text-xs text-slate-500">{[item.item?.brand, item.item?.compatible_models, item.item?.subcategory].filter(Boolean).join(" · ")}</p></td><td className="px-4 py-3 text-right font-bold tabular-nums">{quantity(item.quantity)}</td></tr>)}</tbody>
              </table>
            </div>
          }
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>Only saved shop records are shown. Missing entries must be recorded in Engineers or Daily Parts Collection.</span>
          <Link href="/parts-collection" className="font-bold text-[#1d6a54] hover:underline">Open Daily Parts Collection →</Link>
        </div>
      </main>
    </AppLayout>
  );
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-500">{label}</p><span className="text-[#1d6a54]">{icon}</span></div><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>;
}
function LoadingRows() {
  return <div className="space-y-3 p-4" aria-label="Loading report"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-slate-700">{text}</p></div>;
}
