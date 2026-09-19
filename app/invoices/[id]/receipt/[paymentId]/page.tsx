"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { businessOperationsService } from "@/services/businessOperationsService";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
type Payment = { id: string; amount: number; payment_method: string; payment_date: string; notes: string | null };
type Customer = { full_name: string; phone: string | null };

export default function PaymentReceiptPage() {
  const { id, paymentId } = useParams<{ id: string; paymentId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!id || !paymentId) return;
      setLoading(true); setError("");
      const invoiceResult = await businessOperationsService.getInvoice(id);
      const paymentsResult = await businessOperationsService.getInvoicePayments(id);
      const foundPayment = (paymentsResult.data ?? []).find((row: any) => row.id === paymentId) as Payment | undefined;
      let customerResult: Customer | null = null;
      if (invoiceResult.data?.customer_id) {
        const { supabase } = await import("@/lib/supabase");
        const result = await supabase.from("customers").select("full_name,phone").eq("id", invoiceResult.data.customer_id).single();
        customerResult = (result.data as Customer | null) ?? null;
      }
      setInvoice(invoiceResult.data); setPayment(foundPayment ?? null); setCustomer(customerResult);
      setError(invoiceResult.error?.message ?? paymentsResult.error?.message ?? (!foundPayment ? "Payment receipt not found." : ""));
      setLoading(false);
    }
    void load();
  }, [id, paymentId]);

  if (loading) return <AppLayout><div className="p-8 text-sm text-slate-500">Loading receipt…</div></AppLayout>;
  if (!invoice || !payment) return <AppLayout><div className="mx-auto max-w-2xl p-8"><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Receipt not found. {error}</div></div></AppLayout>;

  return <AppLayout><div className="mx-auto max-w-2xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><button onClick={() => router.back()} className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Back</button><button onClick={() => window.print()} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Print / Save PDF</button></div>
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:shadow-none">
      <header className="border-b border-slate-200 pb-6 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">AMEZING LIMITED</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Payment Receipt</h1><p className="mt-2 text-sm text-slate-500">Receipt for invoice {invoice.invoice_number}</p></header>
      <section className="grid gap-5 py-6 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Received from</p><p className="mt-2 font-semibold text-slate-950">{customer?.full_name ?? "Walk-in customer"}</p>{customer?.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}</div><div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment date</p><p className="mt-2 font-semibold text-slate-950">{new Date(payment.payment_date).toLocaleString()}</p></div></section>
      <div className="rounded-2xl bg-slate-50 p-5 text-center sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount received</p><p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{money(payment.amount)}</p><p className="mt-2 text-sm font-semibold uppercase text-slate-500">{payment.payment_method}</p></div>
      <dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Invoice total</dt><dd className="font-semibold">{money(invoice.total)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Total paid after receipt</dt><dd className="font-semibold">{money(invoice.paid_amount)}</dd></div><div className="flex justify-between gap-4 border-t border-slate-200 pt-3"><dt className="font-semibold">Remaining balance</dt><dd className="font-bold">{money(invoice.outstanding)}</dd></div></dl>
      {payment.notes && <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">Note: {payment.notes}</p>}<footer className="mt-10 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">Thank you for choosing Amezing Limited.</footer>
    </article>
  </div></AppLayout>;
}
