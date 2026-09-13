"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { businessOperationsService } from "@/services/businessOperationsService";
import { repairService } from "@/services/repairService";

type Props = { repairId: string; customerId: string | null; repairTotal?: number };
type Invoice = { id: string; invoice_number: string; total: number; paid_amount: number; outstanding: number; payment_status: string; status: string };
const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function RepairInvoiceWorkflow({ repairId, customerId, repairTotal = 0 }: Props) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [total, setTotal] = useState(repairTotal);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data, error }, profit] = await Promise.all([businessOperationsService.getRepairInvoice(repairId), repairService.getRepairProfit(repairId)]);
    setLoading(false);
    if (error) return toast.error(error.message);
    setInvoice((data as Invoice | null) ?? null);
    const sourceTotal = Number(profit.data?.revenue ?? repairTotal);
    if (Number.isFinite(sourceTotal)) setTotal(sourceTotal);
  }

  useEffect(() => { void load(); }, [repairId]);

  async function issueInvoice() {
    if (!customerId) return toast.error("A customer is required before issuing a repair invoice.");
    if (!Number.isFinite(total) || total <= 0) return toast.error("Set a valid repair cost before issuing the invoice.");
    setBusy(true);
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const result = await businessOperationsService.createRepairInvoice({ repairId, invoiceNumber, amount: total });
    setBusy(false);
    if (result.error) return toast.error(result.error.message);
    toast.success("Repair invoice issued and linked to the customer.");
    await load();
  }

  if (loading) return <Card><CardContent className="p-5 text-sm text-slate-500">Checking invoice status…</CardContent></Card>;

  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2 font-heading text-lg"><FileText className="size-5 text-teal-700"/>Invoice & payment</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {invoice ? <>
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-slate-950">{invoice.invoice_number}</p><p className="mt-1 text-sm text-slate-500">Total {money(Number(invoice.total))} · Paid {money(Number(invoice.paid_amount))} · Outstanding {money(Number(invoice.outstanding))}</p></div>
          <Badge variant={invoice.outstanding > 0 ? "outline" : "default"}>{invoice.payment_status}</Badge>
        </div>
        <Link href={`/invoices/${invoice.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline"><ExternalLink className="size-4"/>Open invoice & record payment</Link>
      </> : <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">No invoice issued yet</p><p className="mt-1 text-sm text-slate-500">Issue the repair invoice before taking the final customer payment.</p></div><Button onClick={issueInvoice} disabled={busy}>{busy ? "Issuing…" : "Issue repair invoice"}</Button></div>}
    </CardContent>
  </Card>;
}
