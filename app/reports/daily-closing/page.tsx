"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCompanyTimezone } from "@/lib/businessTime";
import { hasPermission } from "@/lib/permissions";
import { staffService } from "@/services/staffService";
import {
  dailyClosingService,
  type DailyClosing,
  type DailyClosingPaymentMethod,
  type PaymentMethodActuals,
} from "@/services/dailyClosingService";
import { RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";

const METHODS: Array<{ key: PaymentMethodActuals extends Record<infer K, number> ? K : never; label: string }> = [
  { key: "cash", label: "Cash" },
  { key: "transfer", label: "Transfer" },
  { key: "pos", label: "POS" },
  { key: "other", label: "Other" },
];

const money = (value: number | null | undefined) =>
  `₦${Number(value ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const todayInTimezone = (timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value: string | null, timezone: string) =>
  value
    ? new Intl.DateTimeFormat("en-NG", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";

function Metric({ label, value, hint }: { label: string; value: number | null | undefined; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-950">{money(value)}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function DailyClosingPage() {
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [businessDate, setBusinessDate] = useState("");
  const [closing, setClosing] = useState<DailyClosing | null>(null);
  const [methods, setMethods] = useState<DailyClosingPaymentMethod[]>([]);
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [actualCashInput, setActualCashInput] = useState("");
  const [actualMethods, setActualMethods] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [canReopen, setCanReopen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewingClose, setReviewingClose] = useState(false);

  const load = useCallback(async (date: string, reconcileOpen = true) => {
    setLoading(true);
    setError("");
    setNotice("");

    const result = await dailyClosingService.getByDate(date);
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    let current = result.data;
    if (current?.status === "open" && reconcileOpen) {
      const reconciled = await dailyClosingService.reconcile(current.id);
      if (reconciled.error) {
        setError(reconciled.error.message);
      } else if (reconciled.data) {
        current = reconciled.data;
      }
    }

    setClosing(current);
    setMethods([]);
    setActualCashInput(current?.actual_cash == null ? "" : String(current.actual_cash));
    setNotes(current?.notes ?? "");
    setActualMethods({});

    if (current) {
      const methodResult = await dailyClosingService.getPaymentMethods(current.id);
      if (methodResult.error) setError((previous) => previous || methodResult.error!.message);
      else {
        setMethods(methodResult.data ?? []);
        const values: Record<string, string> = {};
        for (const method of methodResult.data ?? []) {
          if (method.actual_amount != null) values[method.payment_method] = String(method.actual_amount);
        }
        setActualMethods(values);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const zone = await getCompanyTimezone();
      const role = await staffService.getMyRole();
      if (!active) return;
      setTimezone(zone);
      setBusinessDate(todayInTimezone(zone));
      setCanReopen(hasPermission(role.data, "daily_closing") && role.data ? ["owner", "branch_manager"].includes(role.data) : false);
      await load(todayInTimezone(zone));
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const methodMap = useMemo(() => new Map(methods.map((method) => [method.payment_method, method])), [methods]);
  const expectedClosingCash = closing?.expected_cash ?? null;
  const physicalCashReceived = closing?.cash_received_total ?? null;
  const physicalCashOutflows =
    closing?.expected_cash != null ? Math.max(closing.opening_cash + closing.cash_received_total - closing.expected_cash, 0) : null;
  const actualCash = actualCashInput === "" ? null : Number(actualCashInput);
  const cashDiscrepancy = expectedClosingCash == null || actualCash == null ? null : actualCash - expectedClosingCash;

  const allMethodActualsEntered = METHODS.every(({ key }) => {
    const value = actualMethods[key];
    return value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
  });

  const paymentMethodActuals = METHODS.reduce((result, { key }) => {
    result[key] = Number(actualMethods[key]);
    return result;
  }, {} as PaymentMethodActuals);

  async function handleOpen() {
    setError("");
    setNotice("");
    const opening = Number(openingCashInput);
    if (!Number.isFinite(opening) || opening < 0) {
      setError("Enter a valid opening cash amount of zero or greater.");
      return;
    }
    setWorking(true);
    const result = await dailyClosingService.open(businessDate, opening);
    if (result.error) setError(result.error.message);
    else {
      setNotice("Daily closing opened. Reconciliation is being calculated.");
      await load(businessDate);
    }
    setWorking(false);
  }

  async function handleReconcile() {
    if (!closing) return;
    setWorking(true);
    setError("");
    const result = await dailyClosingService.reconcile(closing.id);
    if (result.error) setError(result.error.message);
    else await load(businessDate, false);
    setWorking(false);
  }

  async function handleClose() {
    if (!closing || actualCash == null || !Number.isFinite(actualCash) || actualCash < 0 || !allMethodActualsEntered) {
      setError("Enter actual counted cash and an actual amount for Cash, Transfer, POS, and Other before closing.");
      return;
    }
    setWorking(true);
    setError("");
    const result = await dailyClosingService.close(closing.id, actualCash, notes, paymentMethodActuals);
    if (result.error) {
      setError(result.error.message);
      setWorking(false);
      return;
    }
    setReviewingClose(false);
    setNotice("Daily closing is now closed.");
    await load(businessDate, false);
    setWorking(false);
  }

  async function handleReopen() {
    if (!closing) return;
    if (reopenReason.trim().length < 3) {
      setError("Enter a reopen reason of at least 3 characters.");
      return;
    }
    setWorking(true);
    setError("");
    const result = await dailyClosingService.reopen(closing.id, reopenReason);
    if (result.error) setError(result.error.message);
    else {
      setNotice("Daily closing reopened. Reconcile again before closing it.");
      setReopenReason("");
      await load(businessDate);
    }
    setWorking(false);
  }

  return (
    <AppLayout>
      <div className="space-y-5 pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">End of day</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Daily Closing</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Reconcile one business day from opening cash to the final counted balance.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold">Company timezone: {timezone}</span>
          </div>
        </header>

        {error && (
          <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{notice}</div>}

        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-xs">
              <label htmlFor="business-date" className="mb-1.5 block text-sm font-semibold text-slate-700">Business date</label>
              <Input id="business-date" type="date" value={businessDate} max={todayInTimezone(timezone)} disabled={loading || working} onChange={(event) => { setBusinessDate(event.target.value); void load(event.target.value); }} />
              <p className="mt-1.5 text-xs text-slate-500">Dates follow {timezone}; this is not your device timezone.</p>
            </div>
            <Button variant="outline" disabled={loading || working || !businessDate} onClick={() => void load(businessDate)}>
              <RefreshCw className={working ? "animate-spin" : ""} /> Refresh reconciliation
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : !closing ? (
          <Card>
            <CardHeader>
              <CardTitle>Open this business day</CardTitle>
              <CardDescription>No closing exists for {businessDate}. Opening cash must be entered explicitly; it will never be assumed to be ₦0.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm">
                <label htmlFor="opening-cash" className="mb-1.5 block text-sm font-semibold text-slate-700">Initial opening cash</label>
                <Input id="opening-cash" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={openingCashInput} onChange={(event) => setOpeningCashInput(event.target.value)} />
              </div>
              <Button disabled={working} onClick={() => void handleOpen()}>{working ? "Opening…" : "Open daily closing"}</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="border-b border-slate-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Business day: {businessDate}</CardTitle>
                    <CardDescription>{closing.status === "closed" ? "This day is closed and its snapshot is preserved." : "This day is open and ready for reconciliation."}</CardDescription>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${closing.status === "closed" ? "bg-slate-900 text-white" : "bg-teal-50 text-teal-700"}`}>{closing.status}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Opening cash</p><p className="mt-1 text-lg font-bold text-slate-950">{money(closing.opening_cash)}</p><p className="text-xs text-slate-500">{closing.opening_cash_source === "previous_closing" ? "Previous closing" : closing.opening_cash_source === "initial_manual" ? "Initial manual" : "Source unavailable"}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Opening source</p><p className="mt-1 text-sm font-semibold text-slate-900">{closing.opening_cash_source ?? "Unavailable"}</p><p className="text-xs text-slate-500">Authoritative source recorded by the closing workflow.</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Expected closing cash</p><p className="mt-1 text-lg font-bold text-slate-950">{expectedClosingCash == null ? "Unavailable" : money(expectedClosingCash)}</p><p className="text-xs text-slate-500">Calculated from the canonical financial position.</p></div>
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Revenue" value={closing.revenue_total} />
              <Metric label="Cash received" value={closing.cash_received_total} />
              <Metric label="Customer outstanding" value={closing.customer_outstanding} />
              <Metric label="Engineer outstanding" value={closing.engineer_outstanding} />
              <Metric label="COGS" value={closing.cogs_total} />
              <Metric label="Operating expenses" value={closing.operating_expenses} />
              <Metric label="Engineer direct cost" value={closing.engineer_direct_cost} />
              <Metric label="Net profit" value={closing.net_profit} />
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Cash reconciliation</CardTitle>
                <CardDescription>Expected cash is calculated. Actual cash is what was physically counted. The discrepancy is actual minus expected.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Opening cash" value={closing.opening_cash} />
                  <Metric label="Physical cash received" value={physicalCashReceived} />
                  <Metric label="Physical cash outflows" value={physicalCashOutflows} hint="Derived from the canonical expected-cash calculation." />
                  <Metric label="Expected closing cash" value={expectedClosingCash} />
                </div>
                {closing.status === "open" ? (
                  <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-end">
                    <div>
                      <label htmlFor="actual-cash" className="mb-1.5 block text-sm font-semibold text-slate-700">Actual counted cash</label>
                      <Input id="actual-cash" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Enter physical count" value={actualCashInput} onChange={(event) => setActualCashInput(event.target.value)} />
                    </div>
                    <div className="rounded-lg border border-white bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cash discrepancy</p>
                      <p className={`mt-1 text-xl font-bold ${cashDiscrepancy == null ? "text-slate-400" : cashDiscrepancy === 0 ? "text-slate-950" : "text-rose-700"}`}>{cashDiscrepancy == null ? "Enter actual cash" : money(cashDiscrepancy)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Metric label="Actual counted cash" value={closing.actual_cash} />
                    <Metric label="Final discrepancy" value={closing.cash_discrepancy} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment methods</CardTitle>
                <CardDescription>Expected amounts come from canonical incoming financial transactions. Enter actual verified amounts; discrepancies never create financial events.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-3 pr-4">Method</th><th className="pb-3 pr-4">Expected</th><th className="pb-3 pr-4">Actual</th><th className="pb-3 pr-4">Discrepancy</th><th className="pb-3 text-right">Transactions</th></tr></thead>
                    <tbody>
                      {METHODS.map(({ key, label }) => {
                        const method = methodMap.get(key);
                        const expected = method?.expected_amount ?? 0;
                        const entered = actualMethods[key] === undefined || actualMethods[key] === "" ? null : Number(actualMethods[key]);
                        const discrepancy = entered == null || !Number.isFinite(entered) ? null : entered - expected;
                        return <tr key={key} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4 font-semibold text-slate-800">{label}</td><td className="py-3 pr-4 text-slate-700">{money(expected)}</td><td className="py-3 pr-4">{closing.status === "open" ? <Input className="max-w-[170px]" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Enter actual" value={actualMethods[key] ?? ""} onChange={(event) => setActualMethods((current) => ({ ...current, [key]: event.target.value }))} /> : <span className="font-semibold text-slate-900">{method?.actual_amount == null ? "—" : money(method.actual_amount)}</span>}</td><td className={`py-3 pr-4 font-semibold ${discrepancy == null ? "text-slate-400" : discrepancy === 0 ? "text-slate-900" : "text-rose-700"}`}>{discrepancy == null ? "—" : money(discrepancy)}</td><td className="py-3 text-right text-slate-500">{method?.transaction_count ?? 0}</td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {closing.status === "open" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Review before closing</CardTitle>
                  <CardDescription>Nothing is closed until you explicitly confirm the final snapshot.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Final cash summary</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div><p className="text-xs text-slate-500">Expected cash</p><p className="mt-1 font-bold text-slate-950">{money(expectedClosingCash)}</p></div>
                      <div><p className="text-xs text-slate-500">Actual cash</p><p className="mt-1 font-bold text-slate-950">{actualCash == null ? "Not entered" : money(actualCash)}</p></div>
                      <div><p className="text-xs text-slate-500">Discrepancy</p><p className={`mt-1 font-bold ${cashDiscrepancy && cashDiscrepancy !== 0 ? "text-rose-700" : "text-slate-950"}`}>{cashDiscrepancy == null ? "Not calculated" : money(cashDiscrepancy)}</p></div>
                    </div>
                  </div>
                  <div><label htmlFor="closing-notes" className="mb-1.5 block text-sm font-semibold text-slate-700">Closing notes <span className="font-normal text-slate-400">(optional)</span></label><textarea id="closing-notes" rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10" placeholder="Record a useful operational note, if needed." value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="outline" disabled={working} onClick={() => void handleReconcile()}><RefreshCw className={working ? "animate-spin" : ""} /> Reconcile again</Button><Button disabled={working || actualCash == null || !allMethodActualsEntered} onClick={() => setReviewingClose(true)}>Review & close</Button></div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Closed state</CardTitle>
                  <CardDescription>The closing snapshot is preserved. Ordinary reconciliation and close actions are disabled.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Closed at</p><p className="mt-1 font-semibold text-slate-900">{formatDateTime(closing.closed_at, timezone)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Closed by</p><p className="mt-1 font-semibold text-slate-900">{closing.closed_by_name || "Recorded account"}</p></div></div>
                  {canReopen && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Reopen this closing</p><p className="mt-1 text-xs text-amber-800">Use a clear reason. Reopening does not erase the audit trail.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} placeholder="Reason for reopening" /><Button variant="outline" disabled={working || reopenReason.trim().length < 3} onClick={() => void handleReopen()}><RotateCcw /> Reopen</Button></div></div>}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {reviewingClose && closing?.status === "open" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="close-review-title">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">Final confirmation</p>
              <h2 id="close-review-title" className="mt-1 text-xl font-bold text-slate-950">Close {businessDate}?</h2>
              <p className="mt-2 text-sm text-slate-500">This will persist the final financial snapshot and reconciliation values. Confirm only after checking the physical count.</p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Expected cash</span><strong>{money(expectedClosingCash)}</strong></div><div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Actual cash</span><strong>{actualCash == null ? "—" : money(actualCash)}</strong></div><div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Discrepancy</span><strong className={cashDiscrepancy && cashDiscrepancy !== 0 ? "text-rose-700" : ""}>{cashDiscrepancy == null ? "—" : money(cashDiscrepancy)}</strong></div></div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" disabled={working} onClick={() => setReviewingClose(false)}>Go back</Button><Button disabled={working} onClick={() => void handleClose()}>{working ? "Closing…" : "Confirm & close day"}</Button></div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
