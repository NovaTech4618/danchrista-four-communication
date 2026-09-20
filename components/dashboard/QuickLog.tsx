"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardPlus, Loader2 } from "lucide-react";
import { quickLogService } from "@/services/quickLogService";
import type { QuickLogPaymentMethod } from "@/types/quickLog";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0);

export default function QuickLog() {
  const [jobName, setJobName] = useState("");
  const [charged, setCharged] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState<QuickLogPaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const amount = Number(charged) || 0;
  const payment = Number(paid) || 0;
  const cost = Number(partsCost) || 0;
  const balance = Math.max(0, amount - payment);
  const profit = Math.max(0, payment - cost);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");
    if (!jobName.trim() || amount <= 0) { setError("Enter the job and amount charged."); return; }
    if (payment > amount) { setError("Payment cannot be more than the amount charged."); return; }
    setSaving(true);
    const { error: resultError } = await quickLogService.create({
      job_name: jobName.trim(), amount_charged: amount, parts_cost: cost,
      amount_paid: payment, payment_method: method, notes,
    });
    setSaving(false);
    if (resultError) { setError(resultError.message); return; }
    setMessage("Quick log saved.");
    setJobName(""); setCharged(""); setPartsCost(""); setPaid(""); setNotes(""); setMethod("cash");
  }

  return (
    <section className="rounded-3xl border border-[var(--amezing-border)] bg-[var(--amezing-surface)] p-5 shadow-[var(--amezing-shadow-glass)] sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--amezing-primary)]/10 text-[var(--amezing-primary-light)]"><ClipboardPlus className="size-5" /></div>
        <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fast entry</p><h2 className="mt-1 font-heading text-lg font-semibold">Quick Log</h2><p className="mt-1 text-sm text-muted-foreground">Record a job in seconds without opening the full workflow.</p></div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer / job" value={jobName} onChange={setJobName} placeholder="e.g. Ahmed — iPhone 11 screen" />
          <Field label="Amount charged" value={charged} onChange={setCharged} placeholder="25000" type="number" />
          <Field label="Parts cost" value={partsCost} onChange={setPartsCost} placeholder="12000" type="number" />
          <Field label="Amount paid now" value={paid} onChange={setPaid} placeholder="25000" type="number" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm"><span className="text-xs font-medium text-muted-foreground">Payment method</span><select value={method} onChange={(e) => setMethod(e.target.value as QuickLogPaymentMethod)} className="h-10 w-full rounded-xl border border-[var(--amezing-border)] bg-background px-3 text-sm"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS / Card</option><option value="other">Other</option></select></label>
          <Field label="Note (optional)" value={notes} onChange={setNotes} placeholder="Screen replaced" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini label="Balance" value={money(balance)} tone={balance > 0 ? "warn" : "ok"} />
          <Mini label="Paid" value={money(payment)} />
          <Mini label="Parts" value={money(cost)} />
          <Mini label="Money left" value={money(profit)} tone={profit > 0 ? "ok" : "warn"} />
        </div>

        {error && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>}
        {message && <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-600"><CheckCircle2 className="size-4" />{message}</p>}
        <button disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--amezing-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">{saving && <Loader2 className="size-4 animate-spin" />}Save Quick Log</button>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="space-y-1.5 text-sm"><span className="text-xs font-medium text-muted-foreground">{label}</span><input type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? 100 : undefined} inputMode={type === "number" ? "decimal" : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-[var(--amezing-border)] bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--amezing-primary)]/30" /></label>;
}

function Mini({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "ok" | "warn" }) {
  return <div className={`rounded-xl border p-3 ${tone === "ok" ? "border-emerald-500/25 bg-emerald-500/5" : tone === "warn" ? "border-[var(--amezing-copper)]/25 bg-[var(--amezing-copper)]/5" : "border-[var(--amezing-border)] bg-muted/30"}`}><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
