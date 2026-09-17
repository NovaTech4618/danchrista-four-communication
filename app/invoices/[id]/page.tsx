"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";
import { supabase } from "@/lib/supabase";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
type Payment = { id: string; amount: number; payment_method: string; payment_date: string; notes: string | null };
type Customer = { full_name: string; phone: string | null };

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer" | "pos" | "other">("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    const [invoiceResult, paymentResult, itemsResult] = await Promise.all([
      businessOperationsService.getInvoice(id),
      businessOperationsService.getInvoicePayments(id),
      supabase.from("invoice_items").select("*").eq("invoice_id", id).order("id"),
    ]);

    let customerResult: Customer | null = null;
    if (invoiceResult.data?.customer_id) {
      const result = await supabase.from("customers").select("full_name,phone").eq("id", invoiceResult.data.customer_id).single();
      customerResult = (result.data as Customer | null) ?? null;
    }

    setInvoice(invoiceResult.data);
    setPayments((paymentResult.data ?? []) as Payment[]);
    setItems(itemsResult.data ?? []);
    setCustomer(customerResult);
    setError(invoiceResult.error?.message ?? paymentResult.error?.message ?? itemsResult.error?.message ?? "");
    setLoading(false);
  };

  useEffect(() => { void load(); }, [id]);

  async function pay() {
    const value = Number(amount);
    if (!value || value <= 0) { setError("Enter a valid payment amount."); return; }
    if (invoice && value > Number(invoice.outstanding)) { setError(`Payment cannot exceed the remaining balance of ${money(invoice.outstanding)}.`); return; }
    setSaving(true);
    setError("");
    const result = await businessOperationsService.recordInvoicePayment({ invoiceId: id, amount: value, paymentMethod: method, notes: notes.trim() || null });
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setAmount("");
    setNotes("");
    await load();
    setSaving(false);
  }

  if (loading) return <AppLayout><div className="p-8 text-sm text-slate-500">Loading invoice…</div></AppLayout>;
  if (!invoice) return <AppLayout><div className="p-8 text-sm text-red-600">Invoice not found. {error}</div></AppLayout>;

  const outstanding = Number(invoice.outstanding || 0);
  const paid = Number(invoice.paid_amount || 0);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => router.back()} className="text-left text-sm font-semibold text-slate-500 hover:text-slate-900">← Back</button>
          <div className="flex flex-wrap gap-2">
            {invoice.repair_id && <Link href={`/repairs/${invoice.repair_id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open repair</Link>}
            <button onClick={() => window.print()} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Print / Save PDF</button>
          </div>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7 print:border-0 print:shadow-none">
          <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">DANCHRISTA FOUR COMMUNICATION</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Invoice</h1><p className="mt-1 text-sm text-slate-500">Customer-facing billing document</p></div>
            <div className="text-left sm:text-right"><p className="text-lg font-bold">{invoice.invoice_number}</p><p className="text-sm text-slate-500">{new Date(invoice.issued_at).toLocaleDateString()}</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{invoice.payment_status}</span></div>
          </header>
          <section className="grid gap-6 py-6 sm:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p><p className="mt-2 font-semibold">{customer?.full_name ?? (invoice.customer_id ? "Customer" : "Walk-in customer")}</p>{customer?.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}</div>
            <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due</p><p className="mt-2 font-semibold">{invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : "On receipt"}</p></div>
          </section>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm"><thead className="border-y border-slate-200 text-xs uppercase tracking-wide text-slate-400"><tr><th className="py-3 text-left">Description</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Price</th><th className="py-3 text-right">Amount</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-4">{item.description}</td><td className="py-4 text-right">{item.quantity}</td><td className="py-4 text-right">{money(item.unit_price)}</td><td className="py-4 text-right font-semibold">{money(item.line_total)}</td></tr>)}</tbody></table>
          </div>
          <div className="ml-auto mt-6 max-w-xs space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(invoice.subtotal)}</span></div><div className="flex justify-between"><span className="text-slate-500">Discount</span><span>{money(invoice.discount)}</span></div><div className="flex justify-between"><span className="text-slate-500">Paid</span><span>{money(paid)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Balance</span><span>{money(outstanding)}</span></div></div>
          {invoice.notes && <p className="mt-7 border-t border-slate-100 pt-5 text-sm text-slate-500">{invoice.notes}</p>}
          <footer className="mt-10 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">Thank you for choosing Danchrista Four Communication.</footer>
        </article>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 print:hidden">
          <h2 className="font-semibold text-slate-950">Record payment</h2>
          <p className="mt-1 text-xs text-slate-500">Remaining balance: <strong>{money(outstanding)}</strong>. Payments update the invoice, customer debt and Finance.</p>
          {outstanding > 0 ? <div className="mt-4 grid gap-3 md:grid-cols-4"><input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" max={outstanding} placeholder="Amount (₦)" className="h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"/><select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment note (optional)" className="h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"/><button disabled={saving} onClick={pay} className="h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? "Saving…" : "Record payment"}</button></div> : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">Invoice fully paid.</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm print:hidden">
          <div className="border-b border-slate-100 px-5 py-4 font-semibold">Payment history</div>
          {payments.length === 0 ? <p className="p-5 text-sm text-slate-500">No payments recorded.</p> : <div className="divide-y divide-slate-100">{payments.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm"><div className="min-w-0"><p className="font-semibold text-slate-900">{money(payment.amount)}</p><p className="text-xs text-slate-500">{payment.payment_method} · {new Date(payment.payment_date).toLocaleString()}{payment.notes ? ` · ${payment.notes}` : ""}</p></div><Link href={`/invoices/${id}/receipt/${payment.id}`} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Receipt</Link></div>)}</div>}
        </section>
      </div>
    </AppLayout>
  );
}
