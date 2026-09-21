"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saleService } from "@/services/saleService";
import { Button } from "@/components/ui/button";

type Request = {
  id: string;
  status: string;
  payment_method: string;
  discount: number;
  items: Array<{ inventory_id: string; quantity: number; unit_price: number }>;
  request_reason: string | null;
  requested_at: string;
  requestor_name?: string | null;
};

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export default function SalePriceApprovals() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await saleService.listPriceOverrideRequests();
    setLoading(false);
    if (error) return;
    setRequests((data ?? []) as Request[]);
  }

  useEffect(() => { void load(); }, []);

  async function decide(id: string, approve: boolean) {
    setBusy(id);
    const result = approve
      ? await saleService.approvePriceOverride(id)
      : await saleService.rejectPriceOverride(id, "Boss rejected the below-minimum sale.");
    setBusy(null);
    if (result.error) return toast.error(result.error.message);
    toast.success(approve ? "Approved. Sale recorded and stock reduced." : "Price override rejected.");
    void load();
  }

  if (loading) return <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading approvals…</section>;
  if (!requests.length) return <section className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-800">Price approvals</p><p className="mt-1 text-xs text-slate-500">No pending price exceptions.</p></section>;

  return <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_10px_28px_rgba(18,59,52,0.05)]">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Boss control</p><h2 className="mt-1 text-lg font-bold text-slate-900">Price approvals</h2><p className="mt-1 text-xs text-slate-500">A below-minimum sale is not recorded until you approve it.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{requests.filter(r => r.status === "pending").length} pending</span></div>
    <div className="mt-4 space-y-3">
      {requests.filter(r => r.status === "pending").map((r) => {
        const total = r.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0) - Number(r.discount || 0);
        return <div key={r.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-slate-900">{r.items.length} item{r.items.length === 1 ? "" : "s"} · {r.payment_method}</p><p className="mt-1 text-sm font-bold text-slate-800">{money(total)}</p><p className="mt-1 text-xs text-slate-500">{r.request_reason || "Below minimum selling price"}</p></div>
            <div className="flex gap-2"><Button disabled={busy === r.id} onClick={() => decide(r.id, false)} variant="outline" className="rounded-xl">Reject</Button><Button disabled={busy === r.id} onClick={() => decide(r.id, true)} className="rounded-xl bg-[#123b34] hover:bg-[#1d6a54]">{busy === r.id ? "Processing…" : "Approve & record sale"}</Button></div>
          </div>
        </div>;
      })}
    </div>
  </section>;
}
