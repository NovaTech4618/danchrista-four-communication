"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { businessOperationsService } from "@/services/businessOperationsService";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

type Invoice = { id: string; invoice_number: string; issued_at: string; total: number | null; paid: number | null; balance: number | null; status: string | null };

type Payment = { id: string; invoice_id: string; amount: number; payment_method: string; payment_date: string; notes: string | null };

export default function CustomerLedger({ customerId }: { customerId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await businessOperationsService.getInvoices();
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = ((data ?? []) as Invoice[]).filter((row) => row.status !== "void");
    const customerInvoices = rows.filter((row: Invoice & { customer_id?: string | null }) => row.customer_id === customerId);
    setInvoices(customerInvoices);
    const paymentResults = await Promise.all(customerInvoices.map((row) => businessOperationsService.getInvoicePayments(row.id)));
    setPayments(paymentResults.flatMap((result) => (result.data ?? []) as Payment[]));
    setLoading(false);
  }

  useEffect(() => { void load(); }, [customerId]);

  const outstanding = useMemo(() => invoices.reduce((sum, row) => sum + Number(row.balance || 0), 0), [invoices]);
  const paid = useMemo(() => invoices.reduce((sum, row) => sum + Number(row.paid || 0), 0), [invoices]);

  async function recordPayment(invoice: Invoice) {
    const value = Number(amount);
    const balance = Number(invoice.balance || 0);
    if (!Number.isFinite(value) || value <= 0) return toast.error("Enter a valid payment amount.");
    if (value > balance + 0.01) return toast.error("Payment cannot be greater than the outstanding balance.");
    setPayingId(invoice.id);
    const result = await businessOperationsService.recordInvoicePayment({ invoiceId: invoice.id, amount: value, paymentMethod: "cash", notes: "Customer account payment" });
    if (result.error) toast.error(result.error.message);
    else { toast.success("Payment recorded."); setAmount(""); await load(); }
    setPayingId(null);
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="flex items-center gap-2"><CircleDollarSign className="size-5 text-teal-700" /><h2 className="font-heading text-lg font-semibold text-slate-950">Debit account</h2></div><p className="mt-1 text-sm text-slate-500">Every charge and payment stays attached to this person's account.</p></div>
      <div className="flex gap-6 text-right"><div><p className="text-xs text-slate-400">Paid</p><p className="font-semibold text-emerald-700">{money(paid)}</p></div><div><p className="text-xs text-slate-400">Outstanding</p><p className="font-semibold text-amber-700">{money(outstanding)}</p></div></div>
    </div>
    {loading ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-slate-50" /> : invoices.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">No debit entries yet.</div> : <div className="mt-6 space-y-3">{invoices.map((invoice) => { const balance = Number(invoice.balance || 0); const invoicePayments = payments.filter((p) => p.invoice_id === invoice.id); return <div key={invoice.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-semibold text-slate-900">{invoice.invoice_number}</p><p className="mt-1 text-xs text-slate-500">{new Date(invoice.issued_at).toLocaleDateString("en-NG", { dateStyle: "medium" })} · Charged {money(Number(invoice.total || 0))}</p><p className="mt-1 text-xs text-slate-500">Payments: {invoicePayments.length} · Paid {money(Number(invoice.paid || 0))}</p></div><div className="flex flex-wrap items-center gap-2">{balance <= 0.01 ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-3.5" />Paid</span> : <><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">Owes {money(balance)}</span><input type="number" min="1" max={balance} value={payingId === invoice.id ? amount : ""} onChange={(e) => { setPayingId(invoice.id); setAmount(e.target.value); }} placeholder="Payment" className="h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm" /><button type="button" disabled={payingId === invoice.id && !amount} onClick={() => void recordPayment(invoice)} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white disabled:opacity-50">{payingId === invoice.id ? "Save payment" : "Add payment"}</button></>}</div></div></div>; })}</div>}
  </section>;
}
