"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleDollarSign, ClipboardList, UserRound, Wrench } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import RepairOperationsPanel from "@/components/repairs/RepairOperationsPanel";
import RepairPartsPanel from "@/components/repairs/RepairPartsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { businessOperationsService } from "@/services/businessOperationsService";
import { engineerService } from "@/services/engineerService";
import { repairPaymentService } from "@/services/repairPaymentService";
import { repairService } from "@/services/repairService";
import { MANUAL_REPAIR_STATUSES } from "@/types/repair";
import type { RepairPayment } from "@/types/repairPayment";
import type { RepairProfit } from "@/types/repairParts";

type Engineer = { id: string; name: string; status: string };

type RepairData = {
  id: string;
  device_id: string;
  company_id: string;
  branch_id: string | null;
  engineer_id: string | null;
  technician: string | null;
  issue: string;
  diagnosis: string | null;
  repair_notes: string | null;
  solution: string | null;
  priority: string;
  deposit: number | null;
  expected_completion_date: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  status: string;
  completed_at: string | null;
  devices?: {
    id: string;
    brand: string;
    model: string;
    customers: { id: string; full_name: string; phone: string | null } | null;
  } | null;
  repair_tickets?: { id: string; ticket_number: string; issued_at: string }[] | null;
};

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const terminalStatuses = ["Collected", "Cancelled"];
const outcomeStatuses = ["No Fix", "Failed Repair", "Returned Unrepaired"];

function statusVariant(status: string) {
  if (status === "Completed" || status === "Collected") return "default";
  if (outcomeStatuses.includes(status) || status === "Cancelled") return "destructive";
  if (status === "Repairing" || status === "Testing") return "secondary";
  return "outline";
}

function slaLabel(repair: RepairData) {
  if (terminalStatuses.includes(repair.status)) return "Closed";
  if (!repair.expected_completion_date) return "No deadline";
  const due = new Date(`${repair.expected_completion_date}T23:59:59`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days <= 2) return `Due in ${days}d`;
  return `${days}d remaining`;
}

export default function RepairDetailPage() {
  const params = useParams<{ id: string }>();
  const [repair, setRepair] = useState<RepairData | null>(null);
  const [profit, setProfit] = useState<RepairProfit | null>(null);
  const [payments, setPayments] = useState<RepairPayment[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [engineerId, setEngineerId] = useState("");
  const [status, setStatus] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: profitRows }, { data: paymentRows }, { data: engineerRows }] = await Promise.all([
      repairService.getRepairById(params.id),
      repairService.getRepairProfit(params.id),
      repairPaymentService.getPayments(params.id),
      engineerService.getEngineers(),
    ]);
    setLoading(false);
    if (error) return toast.error(error.message);
    const nextRepair = data as RepairData;
    setRepair(nextRepair);
    setProfit(profitRows?.[0] ?? null);
    setPayments(paymentRows ?? []);
    setEngineers((engineerRows ?? []) as Engineer[]);
    setEngineerId(nextRepair?.engineer_id ?? "");
    setStatus(nextRepair?.status ?? "");
  }

  useEffect(() => { if (params.id) void load(); }, [params.id]);

  async function assignEngineer() {
    if (!repair || !engineerId) return toast.error("Select an engineer first.");
    setBusy("assign");
    const { error } = await businessOperationsService.assignRepair(repair.id, engineerId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Engineer assigned.");
    await load();
  }

  async function updateStatus() {
    if (!repair || !status || status === repair.status) return;
    if (!MANUAL_REPAIR_STATUSES.includes(status as (typeof MANUAL_REPAIR_STATUSES)[number])) return toast.error("Choose an active workflow status.");
    setBusy("status");
    const { error } = await repairService.changeStatus(repair.id, status);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Status changed to ${status}.`);
    await load();
  }

  async function recordPayment() {
    if (!repair) return;
    const amount = Number(paymentAmount);
    const total = Number(profit?.revenue ?? repair.final_cost ?? repair.estimated_cost ?? 0);
    const paid = Number(profit?.amount_paid ?? repair.deposit ?? 0);
    const balance = Math.max(total - paid, 0);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a valid payment amount.");
    if (amount > balance) return toast.error(`Payment cannot exceed ${money(balance)}.`);
    setBusy("payment");
    const { error } = await repairPaymentService.recordPayment(repair.id, amount, paymentMethod);
    setBusy(null);
    if (error) return toast.error(error.message);
    setPaymentAmount("");
    toast.success(`${money(amount)} payment recorded.`);
    await load();
  }

  async function complete() {
    if (!repair || repair.status !== "Testing") return toast.error("Move the repair to Testing before completing it.");
    if (!confirm("Mark this repair completed and issue the pickup ticket?")) return;
    setBusy("complete");
    const { data, error } = await repairService.completeRepair(repair.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Repair completed${data?.ticket_number ? ` · ${data.ticket_number}` : ""}.`);
    await load();
  }

  async function collect() {
    if (!repair || !["Completed", "No Fix", "Failed Repair", "Returned Unrepaired"].includes(repair.status)) return;
    if (Number(balance) > 0 && repair.status === "Completed") return toast.error(`Collect the outstanding ${money(balance)} before marking the phone collected.`);
    if (!confirm("Mark this phone as collected by the customer?")) return;
    setBusy("collect");
    const { error } = await repairService.changeStatus(repair.id, "Collected", "Device handed back to customer.");
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Repair marked as collected.");
    await load();
  }

  if (loading) return <AppLayout><main className="mx-auto max-w-[1500px] space-y-4 p-5 sm:p-6 lg:p-8"><div className="h-5 w-28 animate-pulse rounded bg-slate-100"/><div className="h-40 animate-pulse rounded-2xl bg-slate-100"/><div className="grid gap-3 sm:grid-cols-4">{[1,2,3,4].map(n => <div key={n} className="h-24 animate-pulse rounded-2xl bg-slate-100"/>)}</div></main></AppLayout>;

  if (!repair) return <AppLayout><main className="mx-auto max-w-[1500px] p-5 sm:p-6 lg:p-8"><Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Wrench className="size-8 text-slate-400"/><h1 className="mt-4 font-heading text-xl font-semibold">Repair not found</h1><p className="mt-1 text-sm text-slate-500">This repair may have been removed or the link is invalid.</p><Button asChild className="mt-5"><Link href="/repairs">Back to repairs</Link></Button></CardContent></Card></main></AppLayout>;

  const device = repair.devices;
  const customer = device?.customers;
  const total = Number(profit?.revenue ?? repair.final_cost ?? repair.estimated_cost ?? 0);
  const paid = Number(profit?.amount_paid ?? repair.deposit ?? 0);
  const balance = Number(profit?.outstanding ?? Math.max(total - paid, 0));
  const partsCost = Number(profit?.parts_cost ?? 0);
  const gross = Number(profit?.gross_profit ?? total - partsCost);
  const margin = Number(profit?.margin_percent ?? (total ? gross / total * 100 : 0));
  const ticket = repair.repair_tickets?.[0];
  const closed = terminalStatuses.includes(repair.status);
  const assignedEngineer = engineers.find(engineer => engineer.id === repair.engineer_id);
  const canCollect = ["Completed", "No Fix", "Failed Repair", "Returned Unrepaired"].includes(repair.status);

  return <AppLayout><main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
    <Link href="/repairs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"><ArrowLeft className="size-4"/>Back to repairs</Link>

    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-teal-50/80 to-transparent"/><div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariant(repair.status)}>{repair.status}</Badge><Badge variant={slaLabel(repair) === "Closed" ? "secondary" : slaLabel(repair).includes("overdue") ? "destructive" : "outline"}>{slaLabel(repair)}</Badge>{ticket && <Link href={`/tickets/${ticket.id}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-teal-200 hover:text-teal-700">{ticket.ticket_number}</Link>}</div><h1 className="mt-3 truncate font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">{device?.brand} {device?.model}</h1><p className="mt-1 text-sm text-slate-500">{repair.issue || "Repair job"}</p></div><div className="flex flex-wrap gap-2"><Link href={`/devices/${repair.device_id}`}><Button variant="outline"><Wrench className="mr-2 size-4"/>Device</Button></Link>{ticket && <Link href={`/tickets/${ticket.id}`}><Button variant="outline"><ClipboardList className="mr-2 size-4"/>Ticket</Button></Link>}{repair.status === "Testing" && <Button onClick={complete} disabled={busy !== null}><CheckCircle2 className="mr-2 size-4"/>{busy === "complete" ? "Completing..." : "Mark Completed"}</Button>}{canCollect && !closed && <Button onClick={collect} disabled={busy !== null}><CheckCircle2 className="mr-2 size-4"/>{busy === "collect" ? "Collecting..." : "Mark Collected"}</Button>}</div></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Repair value" value={money(total)}/><Kpi label="Paid" value={money(paid)}/><Kpi label="Outstanding" value={money(balance)}/><Kpi label="Gross profit" value={money(gross)} hint={`${margin.toFixed(1)}% margin`}/></section>

    <RepairOperationsPanel repairId={repair.id} companyId={repair.company_id} branchId={repair.branch_id} customerId={customer?.id ?? null} status={repair.status} expectedCompletionDate={repair.expected_completion_date}/>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.75fr)]"><div className="space-y-6">
      <Card><CardHeader><CardTitle className="font-heading text-lg">Repair workflow</CardTitle></CardHeader><CardContent className="space-y-5"><Step label="Customer issue" value={repair.issue} done/><Step label="Diagnosis" value={repair.diagnosis} done={Boolean(repair.diagnosis)}/><Step label="Solution / work performed" value={repair.solution} done={Boolean(repair.solution)}/><Step label="Repair notes" value={repair.repair_notes} done={Boolean(repair.repair_notes)}/><div className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_auto]"><div><label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Workflow status</label><select value={status} onChange={e => setStatus(e.target.value)} disabled={closed} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500"><option value="">Select status</option>{MANUAL_REPAIR_STATUSES.map(value => <option key={value}>{value}</option>)}</select></div><Button className="self-end" variant="outline" onClick={updateStatus} disabled={closed || busy !== null || status === repair.status}>{busy === "status" ? "Saving..." : "Save status"}</Button></div></CardContent></Card>

      <Card><CardHeader><CardTitle className="font-heading text-lg">Engineer ownership</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><div><label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assigned engineer</label><select value={engineerId} onChange={e => setEngineerId(e.target.value)} disabled={closed} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500"><option value="">Select engineer</option>{engineers.map(engineer => <option key={engineer.id} value={engineer.id} disabled={engineer.status !== "active"}>{engineer.name}{engineer.status !== "active" ? " · inactive" : ""}</option>)}</select></div><Button className="self-end" onClick={assignEngineer} disabled={closed || busy !== null || !engineerId}>{busy === "assign" ? "Assigning..." : assignedEngineer ? "Reassign" : "Assign Engineer"}</Button></div>{assignedEngineer && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><UserRound className="size-4"/>Parts issued from this repair debit <strong>{assignedEngineer.name}</strong>'s engineer account automatically.</p>}</CardContent></Card>

      <RepairPartsPanel repairId={repair.id}/>

      <Card><CardHeader><CardTitle className="font-heading text-lg">Payment history</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Input type="number" min="0" step="0.01" placeholder={`Amount · balance ${money(balance)}`} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} disabled={balance <= 0 || closed}/><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>Cash</option><option>Transfer</option><option>POS</option><option>Other</option></select><Button onClick={recordPayment} disabled={balance <= 0 || closed || busy !== null}>{busy === "payment" ? "Recording..." : "Record Payment"}</Button></div>{payments.length === 0 ? <p className="text-sm text-slate-500">No payment has been recorded for this repair yet.</p> : <div className="space-y-2 border-t border-slate-100 pt-4">{payments.map(payment => <div key={payment.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><div><p className="font-semibold text-slate-900">{money(Number(payment.amount))}</p><p className="text-xs text-slate-500">{new Date(payment.payment_date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p></div><Badge variant="secondary">{payment.payment_method}</Badge></div>)}</div>}</CardContent></Card>
    </div>

    <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start"><Card><CardHeader><CardTitle className="font-heading text-lg">Customer</CardTitle></CardHeader><CardContent><p className="font-semibold text-slate-900">{customer?.full_name || "Unknown customer"}</p>{customer?.phone && <p className="mt-1 text-sm text-slate-500">{customer.phone}</p>}{customer?.id && <Link href={`/customers/${customer.id}`} className="mt-4 block text-sm font-semibold text-teal-700 hover:underline">Open customer profile →</Link>}</CardContent></Card><Card><CardHeader><CardTitle className="font-heading text-lg">Financial summary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Line label="Repair value" value={money(total)}/><Line label="Parts cost" value={money(partsCost)}/><Line label="Gross profit" value={money(gross)}/><div className="border-t border-slate-100 pt-3"><Line label="Paid" value={money(paid)} strong/><Line label="Outstanding" value={money(balance)} strong/></div></CardContent></Card><Card className={closed ? "border-teal-100 bg-teal-50/50" : "border-slate-200"}><CardContent className="p-5"><div className="flex items-start gap-3"><CheckCircle2 className={`mt-0.5 size-5 ${closed ? "text-teal-700" : "text-slate-400"}`}/><div><p className="font-semibold text-slate-900">{closed ? "Phone collected" : repair.status === "Completed" ? "Ready for collection" : "Repair in progress"}</p><p className="mt-1 text-sm text-slate-600">{closed ? "The repair is closed and the phone has been handed back." : repair.status === "Completed" ? balance > 0 ? `Collect ${money(balance)} before handing the phone back.` : "Payment is complete. Hand the phone back and mark it collected." : assignedEngineer ? `Owned by ${assignedEngineer.name}. Keep parts, diagnosis and payments updated here.` : "Assign an engineer before issuing repair parts."}</p></div></div></CardContent></Card></aside>
    </div>
  </main></AppLayout>;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) { return <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-2"><CircleDollarSign className="size-4 text-teal-700"/><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p></div><p className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-950">{value}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</CardContent></Card>; }
function Step({ label, value, done }: { label: string; value?: string | null; done: boolean }) { return <div className="flex gap-3"><div className={`mt-0.5 size-5 rounded-full border ${done ? "border-teal-600 bg-teal-50" : "border-slate-300"}`}><span className="block size-full rounded-full"/></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{value || "Not recorded yet"}</p></div></div>; }
function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-3"><span className={strong ? "font-semibold text-slate-700" : "text-slate-500"}>{label}</span><span className={strong ? "font-semibold text-slate-950" : "text-slate-700"}>{value}</span></div>; }
