"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCompanyTimezone } from "@/lib/businessTime";
import { hasPermission } from "@/lib/permissions";
import { staffService } from "@/services/staffService";
import { dailyClosingService, type DailyClosing, type DailyClosingPaymentMethod, type PaymentMethodActuals, type DailyMoneyBuckets } from "@/services/dailyClosingService";
import { shopOperationsService } from "@/services/shopOperationsService";
import type { ShopExpense, ShopExpenseCategory, ShopExpensePaymentMethod } from "@/types/shopOperations";
import { RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";

type PaymentMethodKey = DailyClosingPaymentMethod["payment_method"];
const METHODS: Array<{ key: PaymentMethodKey; label: string }> = [
  { key: "cash", label: "Cash" },
  { key: "transfer", label: "Transfer" },
  { key: "pos", label: "POS" },
  { key: "other", label: "Other" },
];
const money = (value: number | null | undefined) => `₦${Number(value ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const todayInTimezone = (timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value ?? "1970"}-${parts.find((part) => part.type === "month")?.value ?? "01"}-${parts.find((part) => part.type === "day")?.value ?? "01"}`;
};
const formatDateTime = (value: string | null, timezone: string) => value ? new Intl.DateTimeFormat("en-NG", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

function Metric({ label, value, hint }: { label: string; value: number | null | undefined; hint?: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-xl font-bold tracking-tight text-slate-950">{money(value)}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>;
}

export default function DailyClosingPage() {
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [businessDate, setBusinessDate] = useState("");
  const [closing, setClosing] = useState<DailyClosing | null>(null);
  const [methods, setMethods] = useState<DailyClosingPaymentMethod[]>([]);
  const [buckets, setBuckets] = useState<DailyMoneyBuckets | null>(null);
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [actualCashInput, setActualCashInput] = useState("");
  const [actualMethods, setActualMethods] = useState<Record<PaymentMethodKey, string>>({ cash: "", transfer: "", pos: "", other: "" });
  const [notes, setNotes] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [canReopen, setCanReopen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewingClose, setReviewingClose] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ShopExpenseCategory>("transportation");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseMethod, setExpenseMethod] = useState<ShopExpensePaymentMethod>("cash");
  const [expenseDescription, setExpenseDescription] = useState("");

  const load = useCallback(async (date: string, reconcileOpen = true) => {
    setLoading(true); setError(""); setNotice("");
    const [roleResult, result, expenseResult] = await Promise.all([
      staffService.getMyRole(),
      dailyClosingService.getByDate(date),
      shopOperationsService.getExpenses(date),
    ]);
    if (result.error) { setError(result.error.message); setLoading(false); return; }
    if (expenseResult.error) setError(expenseResult.error.message);
    const owner = roleResult.data === "owner";
    setIsOwner(owner);
    setCanReopen(hasPermission(roleResult.data, "daily_closing") && owner);
    setExpenses(expenseResult.data ?? []);

    let current = result.data;
    if (current?.status === "open" && reconcileOpen) {
      const reconciled = await dailyClosingService.reconcile(current.id);
      if (reconciled.error) setError((previous) => previous || reconciled.error!.message);
      else if (reconciled.data) current = reconciled.data;
    }
    setClosing(current);
    setMethods([]);
    setBuckets(null);
    setActualCashInput(current?.actual_cash == null ? "" : String(current.actual_cash));
    setNotes(current?.notes ?? "");
    setActualMethods({ cash: "", transfer: "", pos: "", other: "" });

    if (current) {
      const methodResult = await dailyClosingService.getPaymentMethods(current.id);
      if (methodResult.error) setError((previous) => previous || methodResult.error!.message);
      else {
        setMethods(methodResult.data ?? []);
        const values: Record<PaymentMethodKey, string> = { cash: "", transfer: "", pos: "", other: "" };
        for (const method of methodResult.data ?? []) if (method.actual_amount != null) values[method.payment_method] = String(method.actual_amount);
        setActualMethods(values);
      }
    }
    if (owner) {
      const bucketResult = await dailyClosingService.getMoneyBuckets(date);
      if (!bucketResult.error) setBuckets(bucketResult.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const zone = await getCompanyTimezone();
      const role = await staffService.getMyRole();
      if (!active) return;
      const date = todayInTimezone(zone);
      setTimezone(zone); setBusinessDate(date);
      setIsOwner(role.data === "owner");
      setCanReopen(hasPermission(role.data, "daily_closing") && role.data === "owner");
      await load(date);
    })();
    return () => { active = false; };
  }, [load]);

  const methodMap = useMemo(() => new Map(methods.map((method) => [method.payment_method, method])), [methods]);
  const expectedClosingCash = closing?.expected_cash ?? null;
  const actualCash = actualCashInput === "" ? null : Number(actualCashInput);
  const cashDiscrepancy = expectedClosingCash == null || actualCash == null ? null : actualCash - expectedClosingCash;
  const allMethodActualsEntered = METHODS.every(({ key }) => actualMethods[key] !== "" && Number.isFinite(Number(actualMethods[key])) && Number(actualMethods[key]) >= 0);
  const paymentMethodActuals = METHODS.reduce((result, { key }) => { result[key] = Number(actualMethods[key]); return result; }, {} as PaymentMethodActuals);

  async function handleOpen() {
    setError(""); setNotice("");
    const opening = Number(openingCashInput);
    if (!Number.isFinite(opening) || opening < 0) { setError("Enter a valid opening cash amount of zero or greater."); return; }
    setWorking(true);
    const result = await dailyClosingService.open(businessDate, opening);
    if (result.error) setError(result.error.message);
    else { setNotice("Business day opened. The system will keep reconciling recorded money movements."); await load(businessDate); }
    setWorking(false);
  }

  async function handleReconcile() {
    if (!closing) return;
    setWorking(true); setError("");
    const result = await dailyClosingService.reconcile(closing.id);
    if (result.error) setError(result.error.message); else await load(businessDate, false);
    setWorking(false);
  }

  async function handleClose() {
    if (!closing || actualCash == null || !Number.isFinite(actualCash) || actualCash < 0 || !allMethodActualsEntered) {
      setError("Enter actual counted cash and an actual amount for Cash, Transfer, POS, and Other before closing.");
      return;
    }
    setWorking(true); setError("");
    const result = await dailyClosingService.close(closing.id, actualCash, notes, paymentMethodActuals);
    if (result.error) { setError(result.error.message); setWorking(false); return; }
    setReviewingClose(false); setNotice("Daily closing is now closed."); await load(businessDate, false); setWorking(false);
  }

  async function handleReopen() {
    if (!closing) return;
    if (reopenReason.trim().length < 3) { setError("Enter a reopen reason of at least 3 characters."); return; }
    setWorking(true); setError("");
    const result = await dailyClosingService.reopen(closing.id, reopenReason);
    if (result.error) setError(result.error.message);
    else { setNotice("Daily closing reopened. Reconcile again before closing it."); setReopenReason(""); await load(businessDate); }
    setWorking(false);
  }

  async function handleExpense() {
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0 || expenseDescription.trim().length < 2) {
      setError("Enter an expense amount and a short description.");
      return;
    }
    setExpenseSaving(true); setError(""); setNotice("");
    const result = await shopOperationsService.recordExpense({
      businessDate, category: expenseCategory, amount, paymentMethod: expenseMethod, description: expenseDescription,
    });
    if (result.error) setError(result.error.message);
    else {
      setExpenseAmount(""); setExpenseDescription("");
      setNotice("Shop expense recorded. Reconcile again so it is included in today's expected cash.");
      const expenseResult = await shopOperationsService.getExpenses(businessDate);
      if (!expenseResult.error) setExpenses(expenseResult.data ?? []);
      if (closing) await dailyClosingService.reconcile(closing.id);
      await load(businessDate, false);
    }
    setExpenseSaving(false);
  }

  return <AppLayout><div className="space-y-5 pb-10">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">End of day</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Daily Closing</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Open the shop, record every movement, reconcile the day, then count what is actually there.</p></div>
      <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">{isOwner ? "Boss / Owner" : "Apprentice"} · {timezone}</span>
    </header>

    {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><ShieldAlert className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}
    {notice && <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{notice}</div>}

    <Card><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-xs"><label htmlFor="business-date" className="mb-1.5 block text-sm font-semibold text-slate-700">Business date</label><Input id="business-date" type="date" value={businessDate} max={todayInTimezone(timezone)} disabled={loading || working} onChange={(event) => { setBusinessDate(event.target.value); void load(event.target.value); }} /><p className="mt-1.5 text-xs text-slate-500">All records use the company's Africa/Lagos business timezone.</p></div>
      <Button variant="outline" disabled={loading || working || !businessDate} onClick={() => void load(businessDate)}><RefreshCw className={working ? "animate-spin" : ""} /> Refresh</Button>
    </CardContent></Card>

    {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div> : !closing ? <Card><CardHeader><CardTitle>Open this business day</CardTitle><CardDescription>No closing exists for {businessDate}. The opening cash must be entered explicitly; the system will not silently assume zero.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="max-w-sm"><label htmlFor="opening-cash" className="mb-1.5 block text-sm font-semibold text-slate-700">Opening cash</label><Input id="opening-cash" type="number" min="0" step="0.01" inputMode="decimal" placeholder="₦0.00" value={openingCashInput} onChange={(event) => setOpeningCashInput(event.target.value)} /></div><Button disabled={working} onClick={() => void handleOpen()}>{working ? "Opening…" : "Open business day"}</Button></CardContent></Card> : <>
      <Card><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Business day: {businessDate}</CardTitle><CardDescription>{closing.status === "closed" ? "This day's final snapshot is preserved." : "This day is open. Record movements as they happen, then close it once the physical count is verified."}</CardDescription></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${closing.status === "closed" ? "bg-slate-900 text-white" : "bg-teal-50 text-teal-700"}`}>{closing.status}</span></div></CardHeader><CardContent className="pt-5"><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Opening cash</p><p className="mt-1 text-lg font-bold text-slate-950">{money(closing.opening_cash)}</p><p className="text-xs text-slate-500">{closing.opening_cash_source === "previous_closing" ? "Previous closing" : "Initial manual"}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Expected closing cash</p><p className="mt-1 text-lg font-bold text-slate-950">{expectedClosingCash == null ? "Unavailable" : money(expectedClosingCash)}</p><p className="text-xs text-slate-500">Opening + recorded cash in − recorded cash expenses.</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cash difference</p><p className={`mt-1 text-lg font-bold ${cashDiscrepancy == null ? "text-slate-400" : cashDiscrepancy === 0 ? "text-emerald-700" : "text-rose-700"}`}>{cashDiscrepancy == null ? "Not counted" : money(cashDiscrepancy)}</p><p className="text-xs text-slate-500">Actual counted cash minus expected.</p></div></div></CardContent></Card>

      {isOwner && buckets && <Card><CardHeader><CardTitle>Business money books</CardTitle><CardDescription>Management view separating the shop's main money streams without changing the accounting source of truth.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Metric label="Phone parts sales" value={buckets.parts_sales}/><Metric label="Accessories & gadgets sales" value={buckets.accessories_sales}/><Metric label="Repair payments" value={buckets.repair_payments}/><Metric label="Transportation" value={buckets.transportation_expenses}/><Metric label="Water" value={buckets.water_expenses}/><Metric label="Other shop expenses" value={buckets.other_shop_expenses}/></div><p className="mt-4 text-xs leading-5 text-slate-500">Mixed sales are allocated between parts and accessories by their line-item value. This is a reporting allocation; the original sale remains authoritative.</p></CardContent></Card>}

      {isOwner && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Revenue" value={closing.revenue_total}/><Metric label="Cash received" value={closing.cash_received_total}/><Metric label="Customer outstanding" value={closing.customer_outstanding}/><Metric label="Engineer outstanding" value={closing.engineer_outstanding}/><Metric label="COGS" value={closing.cogs_total}/><Metric label="Operating expenses" value={closing.operating_expenses}/><Metric label="Engineer direct cost" value={closing.engineer_direct_cost}/><Metric label="Net profit" value={closing.net_profit}/></section>}

      <Card><CardHeader><CardTitle>Cash reconciliation</CardTitle><CardDescription>Expected cash is calculated from recorded financial events. Actual cash is the physical count.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Opening cash" value={closing.opening_cash}/><Metric label="Cash received" value={closing.cash_received_total}/><Metric label="Expected closing" value={expectedClosingCash}/><Metric label="Actual counted" value={closing.status === "closed" ? closing.actual_cash : actualCash}/></div>{closing.status === "open" ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-end"><div><label htmlFor="actual-cash" className="mb-1.5 block text-sm font-semibold text-slate-700">Actual counted cash</label><Input id="actual-cash" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Enter physical count" value={actualCashInput} onChange={(event) => setActualCashInput(event.target.value)} /></div><div className="rounded-lg border border-white bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Difference</p><p className={`mt-1 text-xl font-bold ${cashDiscrepancy == null ? "text-slate-400" : cashDiscrepancy === 0 ? "text-emerald-700" : "text-rose-700"}`}>{cashDiscrepancy == null ? "Enter actual cash" : money(cashDiscrepancy)}</p></div></div></div> : <div className="grid gap-3 sm:grid-cols-2"><Metric label="Actual counted cash" value={closing.actual_cash}/><Metric label="Final discrepancy" value={closing.cash_discrepancy}/></div>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Payment methods</CardTitle><CardDescription>Verify what was actually received through each method before closing. These actuals do not create duplicate financial transactions.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-3 pr-4">Method</th><th className="pb-3 pr-4">Expected</th><th className="pb-3 pr-4">Actual</th><th className="pb-3 pr-4">Difference</th><th className="pb-3 text-right">Transactions</th></tr></thead><tbody>{METHODS.map(({ key, label }) => { const method = methodMap.get(key); const expected = method?.expected_amount ?? 0; const entered = actualMethods[key] === "" ? null : Number(actualMethods[key]); const discrepancy = entered == null || !Number.isFinite(entered) ? null : entered - expected; return <tr key={key} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4 font-semibold text-slate-800">{label}</td><td className="py-3 pr-4 text-slate-700">{money(expected)}</td><td className="py-3 pr-4">{closing.status === "open" ? <Input className="max-w-[170px]" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Enter actual" value={actualMethods[key]} onChange={(event) => setActualMethods((current) => ({ ...current, [key]: event.target.value }))}/> : <span className="font-semibold text-slate-900">{method?.actual_amount == null ? "—" : money(method.actual_amount)}</span>}</td><td className={`py-3 pr-4 font-semibold ${discrepancy == null ? "text-slate-400" : discrepancy === 0 ? "text-slate-900" : "text-rose-700"}`}>{discrepancy == null ? "—" : money(discrepancy)}</td><td className="py-3 text-right text-slate-500">{method?.transaction_count ?? 0}</td></tr>; })}</tbody></table></div></CardContent></Card>

      {closing.status === "open" && <Card><CardHeader><CardTitle>Record a shop expense</CardTitle><CardDescription>Use this for real day-to-day cash-outs such as transportation, water, or another small shop need. It immediately becomes part of the financial ledger and closing calculation.</CardDescription></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-semibold text-slate-700">Category<select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as ShopExpenseCategory)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="transportation">Transportation</option><option value="water">Water</option><option value="other">Other shop need</option></select></label><label className="text-sm font-semibold text-slate-700">Amount<Input type="number" min="0" step="0.01" inputMode="decimal" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="₦0"/></label><label className="text-sm font-semibold text-slate-700">Paid by<select value={expenseMethod} onChange={(event) => setExpenseMethod(event.target.value as ShopExpensePaymentMethod)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></label><label className="text-sm font-semibold text-slate-700">Reason<Input value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} placeholder="e.g. transport"/></label></div><div className="mt-4 flex justify-end"><Button disabled={expenseSaving} onClick={() => void handleExpense()}>{expenseSaving ? "Recording…" : "Record expense"}</Button></div></CardContent></Card>}

      <Card><CardHeader><CardTitle>Today's shop expenses</CardTitle><CardDescription>{expenses.length ? `${expenses.length} expense record${expenses.length === 1 ? "" : "s"} — each is linked to the financial ledger.` : "No shop expenses recorded for this business date."}</CardDescription></CardHeader><CardContent>{expenses.length ? <div className="divide-y divide-slate-100">{expenses.map((expense) => <div key={expense.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-800">{expense.description}</p><p className="text-xs text-slate-500">{expense.category} · {expense.payment_method} · {formatDateTime(expense.created_at, timezone)}</p></div><p className="font-bold text-rose-700">−{money(expense.amount)}</p></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500">Nothing recorded yet.</p>}</CardContent></Card>

      {closing.status === "open" ? <Card><CardHeader><CardTitle>Finish the day</CardTitle><CardDescription>Reconcile once more, review the physical count, then close. Closing freezes the snapshot.</CardDescription></CardHeader><CardContent><div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="outline" disabled={working} onClick={() => void handleReconcile()}><RefreshCw className={working ? "animate-spin" : ""}/> Reconcile now</Button><Button disabled={working || actualCash == null || !allMethodActualsEntered} onClick={() => setReviewingClose(true)}>Review & close</Button></div></CardContent></Card> : <Card><CardHeader><CardTitle>Closed state</CardTitle><CardDescription>The snapshot is preserved. Only the boss can reopen it.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Closed at</p><p className="mt-1 font-semibold text-slate-900">{formatDateTime(closing.closed_at, timezone)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Closed by</p><p className="mt-1 font-semibold text-slate-900">{closing.closed_by_name || "Recorded account"}</p></div></div>{canReopen && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Reopen this closing</p><p className="mt-1 text-xs text-amber-800">Only use this when a genuine correction is required. The reason is permanently recorded.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} placeholder="Reason for reopening"/><Button variant="outline" disabled={working} onClick={() => void handleReopen()}><RotateCcw/> Reopen</Button></div></div>}</CardContent></Card>}
    </>}

    {reviewingClose && closing?.status === "open" && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Review daily closing"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-xl font-bold text-slate-950">Confirm today's closing</h2><p className="mt-1 text-sm text-slate-500">This will freeze the closing snapshot. Make sure the physical cash and payment-method counts are correct.</p><div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Expected" value={expectedClosingCash}/><Metric label="Actual" value={actualCash}/><Metric label="Difference" value={cashDiscrepancy}/></div><div className="mt-4"><label className="text-sm font-semibold text-slate-700">Closing note (optional)<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Anything the boss should know?"/></label></div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setReviewingClose(false)}>Go back</Button><Button disabled={working} onClick={() => void handleClose()}>{working ? "Closing…" : "Confirm & close day"}</Button></div></div></div>}
  </div></AppLayout>;
}
