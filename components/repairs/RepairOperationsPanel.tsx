"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, FileCheck2, HandCoins, History, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { repairOperationsService, type RepairOutcome, type RepairWarranty } from "@/services/repairOperationsService";
import type { RepairApprovalHistory, RepairIntake, RepairQuote } from "@/types/repairPhase4";
import type { RepairHandover, RepairRepeatLink } from "@/types/repairHandover";
import RepairInvoiceWorkflow from "@/components/repairs/RepairInvoiceWorkflow";
import RepairDeskWorkflow from "@/components/repairs/RepairDeskWorkflow";

type Props = { repairId: string; companyId: string; branchId: string | null; customerId: string | null; status: string; expectedCompletionDate: string | null; repairTotal?: number };
type CheckKey = "power_test" | "charging_test" | "camera_test" | "speaker_test" | "microphone_test" | "buttons_test" | "biometric_test" | "network_test";
const checks: { key: CheckKey; label: string }[] = [
  { key: "power_test", label: "Power" }, { key: "charging_test", label: "Charging" }, { key: "camera_test", label: "Camera" }, { key: "speaker_test", label: "Speaker" },
  { key: "microphone_test", label: "Microphone" }, { key: "buttons_test", label: "Buttons" }, { key: "biometric_test", label: "Biometric" }, { key: "network_test", label: "Network" },
];

export default function RepairOperationsPanel({ repairId, companyId, branchId, customerId, status, expectedCompletionDate, repairTotal = 0 }: Props) {
  const [intake, setIntake] = useState<RepairIntake | null>(null);
  const [quote, setQuote] = useState<RepairQuote | null>(null);
  const [history, setHistory] = useState<RepairApprovalHistory[]>([]);
  const [outcome, setOutcome] = useState<RepairOutcome | null>(null);
  const [warranty, setWarranty] = useState<RepairWarranty | null>(null);
  const [handover, setHandover] = useState<RepairHandover | null>(null);
  const [repeatLinks, setRepeatLinks] = useState<RepairRepeatLink[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [i, q, h, o, w, ho, rl] = await Promise.all([
      repairOperationsService.getIntake(repairId), repairOperationsService.getQuote(repairId), repairOperationsService.getApprovalHistory(repairId),
      repairOperationsService.getOutcome(repairId), repairOperationsService.getWarranty(repairId), repairOperationsService.getHandover(repairId), repairOperationsService.getRepeatLinks(repairId),
    ]);
    if (!i.error) setIntake(i.data);
    if (!q.error) setQuote(q.data);
    if (!h.error) setHistory(h.data ?? []);
    if (!o.error) setOutcome(o.data);
    if (!w.error) setWarranty(w.data);
    if (!ho.error) setHandover(ho.data);
    if (!rl.error) setRepeatLinks(rl.data ?? []);
  }
  useEffect(() => { void load(); }, [repairId]);

  const sla = useMemo(() => {
    if (!expectedCompletionDate) return { label: "No deadline", tone: "secondary" as const };
    if (["Completed", "Collected", "No Fix", "Failed Repair", "Returned Unrepaired", "Cancelled"].includes(status)) return { label: "Closed", tone: "secondary" as const };
    const due = new Date(`${expectedCompletionDate}T23:59:59`);
    const today = new Date();
    const delta = Math.ceil((due.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
    if (delta < 0) return { label: `${Math.abs(delta)}d overdue`, tone: "destructive" as const };
    if (delta === 0) return { label: "Due today", tone: "default" as const };
    if (delta <= 2) return { label: `Due in ${delta}d`, tone: "outline" as const };
    return { label: `${delta}d remaining`, tone: "secondary" as const };
  }, [expectedCompletionDate, status]);

  async function saveIntake() {
    if (!intake) return;
    setBusy(true);
    const { error } = await repairOperationsService.saveIntake({ ...intake, company_id: companyId, branch_id: branchId, repair_id: repairId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Device intake saved.");
    await load();
  }

  async function sendQuote() {
    const amount = Number((document.getElementById("repair-quote-amount") as HTMLInputElement | null)?.value ?? "");
    const notes = (document.getElementById("repair-quote-notes") as HTMLInputElement | null)?.value ?? "";
    if (!Number.isFinite(amount) || amount < 0) return toast.error("Enter a valid quote amount.");
    setBusy(true);
    const { error } = await repairOperationsService.sendQuote(repairId, amount, notes || null);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Quote sent and repair marked as Estimate Sent.");
    await load();
  }

  async function respondQuote(action: "approved" | "rejected") {
    if (!quote) return;
    setBusy(true);
    const { error } = await repairOperationsService.respondToQuote(quote.id, action);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(action === "approved" ? "Customer approval recorded." : "Quote rejected.");
    await load();
  }

  async function recordOutcome(nextOutcome: RepairOutcome["outcome"]) {
    const reason = window.prompt("Reason / outcome note (optional):") ?? "";
    setBusy(true);
    const { error } = await repairOperationsService.recordOutcome(repairId, nextOutcome, reason || null);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Repair outcome recorded.");
    await load();
  }

  async function createWarranty() {
    const raw = window.prompt("Warranty period in days", String(warranty?.warranty_days ?? 30));
    const days = Number(raw);
    if (!Number.isInteger(days) || days < 0) return toast.error("Enter a valid warranty period.");
    const terms = window.prompt("Warranty terms (optional)", warranty?.terms ?? "") ?? "";
    setBusy(true);
    const { error } = await repairOperationsService.createWarranty(repairId, days, terms || null);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Warranty saved.");
    await load();
  }

  async function collect() {
    const recipient = window.prompt("Recipient name", handover?.recipient_name ?? "");
    if (!recipient?.trim()) return toast.error("Recipient name is required.");
    const phone = window.prompt("Recipient phone (optional)", handover?.recipient_phone ?? "") ?? "";
    const condition = window.prompt("Device condition at handover (optional)", handover?.device_condition ?? "") ?? "";
    setBusy(true);
    const { error } = await repairOperationsService.recordHandover({ repairId, recipientName: recipient.trim(), recipientPhone: phone || null, deviceCondition: condition || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Device collected and handover recorded.");
    await load();
  }

  const defaultIntake: RepairIntake = {
    id: intake?.id ?? "", company_id: companyId, branch_id: branchId, repair_id: repairId,
    device_condition: intake?.device_condition ?? "", screen_condition: intake?.screen_condition ?? "", body_condition: intake?.body_condition ?? "",
    power_test: intake?.power_test ?? "untested", charging_test: intake?.charging_test ?? "untested", camera_test: intake?.camera_test ?? "untested", speaker_test: intake?.speaker_test ?? "untested",
    microphone_test: intake?.microphone_test ?? "untested", buttons_test: intake?.buttons_test ?? "untested", biometric_test: intake?.biometric_test ?? "untested", network_test: intake?.network_test ?? "untested",
    water_damage: intake?.water_damage ?? false, physical_damage: intake?.physical_damage ?? false, customer_password_provided: intake?.customer_password_provided ?? false,
    accessories_received: intake?.accessories_received ?? "", missing_items: intake?.missing_items ?? "", intake_notes: intake?.intake_notes ?? "",
    customer_acknowledged: intake?.customer_acknowledged ?? false, acknowledged_at: intake?.acknowledged_at ?? null, acknowledged_by: intake?.acknowledged_by ?? null, created_at: intake?.created_at ?? "", updated_at: intake?.updated_at ?? "",
  };

  const workStarted = ["Repairing", "Testing", "Completed", "Ready for Collection", "Collected"].includes(status);
  const completed = ["Completed", "Ready for Collection", "Collected"].includes(status);
  const paidAmount = Number(repairTotal || 0);

  return <section className="space-y-6">
    <RepairDeskWorkflow status={status} engineerAssigned={Boolean(customerId && workStarted)} total={paidAmount} paid={0} balance={paidAmount} hasTicket={Boolean(handover)} hasInvoice={false}/>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 font-heading text-lg"><ClipboardCheck className="size-5 text-teal-700"/>01 · Intake <Badge variant={sla.tone} className="ml-auto">{sla.label}</Badge></CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3"><Field label="Device condition" value={defaultIntake.device_condition ?? ""} onChange={(v) => setIntake({ ...defaultIntake, device_condition: v })}/><Field label="Screen condition" value={defaultIntake.screen_condition ?? ""} onChange={(v) => setIntake({ ...defaultIntake, screen_condition: v })}/><Field label="Body condition" value={defaultIntake.body_condition ?? ""} onChange={(v) => setIntake({ ...defaultIntake, body_condition: v })}/></div>
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Functional intake checks</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{checks.map((check) => <label key={check.key} className="rounded-xl border border-slate-200 p-3 text-sm"><span className="font-medium text-slate-700">{check.label}</span><select value={defaultIntake[check.key] ?? "untested"} onChange={(e) => setIntake({ ...defaultIntake, [check.key]: e.target.value as RepairIntake[CheckKey] })} className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"><option value="untested">Untested</option><option value="pass">Pass</option><option value="fail">Fail</option><option value="na">N/A</option></select></label>)}</div></div>
      <div className="grid gap-2 sm:grid-cols-3"><label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={defaultIntake.water_damage} onChange={(e) => setIntake({ ...defaultIntake, water_damage: e.target.checked })}/>Water damage</label><label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={defaultIntake.physical_damage} onChange={(e) => setIntake({ ...defaultIntake, physical_damage: e.target.checked })}/>Physical damage</label><label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={defaultIntake.customer_password_provided} onChange={(e) => setIntake({ ...defaultIntake, customer_password_provided: e.target.checked })}/>Password provided</label></div>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Accessories received" value={defaultIntake.accessories_received ?? ""} onChange={(v) => setIntake({ ...defaultIntake, accessories_received: v })}/><Field label="Missing items" value={defaultIntake.missing_items ?? ""} onChange={(v) => setIntake({ ...defaultIntake, missing_items: v })}/></div>
      <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={defaultIntake.customer_acknowledged} onChange={(e) => setIntake({ ...defaultIntake, customer_acknowledged: e.target.checked })}/>Customer acknowledged intake condition</label><Button onClick={saveIntake} disabled={busy}>{busy ? "Saving..." : "Save intake"}</Button></div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 font-heading text-lg"><FileCheck2 className="size-5 text-teal-700"/>03 · Work & approval</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]"><Input id="repair-quote-amount" type="number" min="0" step="0.01" defaultValue={quote?.amount ?? ""} placeholder="Quote amount"/><Input id="repair-quote-notes" defaultValue={quote?.notes ?? ""} placeholder="Notes / estimate details"/><Button onClick={sendQuote} disabled={busy}>Send quote</Button></div>{quote && <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">₦{Number(quote.amount).toLocaleString("en-NG")}</p><p className="text-sm text-slate-500">Status: {quote.status}</p></div>{quote.status === "sent" && <div className="flex gap-2"><Button variant="outline" onClick={() => respondQuote("rejected")} disabled={busy}>Reject</Button><Button onClick={() => respondQuote("approved")} disabled={busy}>Approve</Button></div>}</div>}{history.length > 0 && <div className="space-y-2 border-t border-slate-100 pt-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><History className="size-4"/>Approval history</div>{history.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{item.action}</span><span className="text-slate-500">{new Date(item.acted_at).toLocaleString("en-NG")}</span></div>)}</div>}</CardContent></Card>

    <RepairInvoiceWorkflow repairId={repairId} customerId={customerId} repairTotal={repairTotal}/>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 font-heading text-lg"><XCircle className="size-5 text-teal-700"/>06 · Completion & warranty</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><p className="font-semibold text-slate-900">Completion is controlled by the repair status workflow.</p><p className="mt-1 text-slate-600">Finish testing/work first. The existing <code>complete_repair</code> action remains the authoritative completion path.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => recordOutcome("repaired")} disabled={busy}>Repaired</Button><Button variant="outline" onClick={() => recordOutcome("no_fix")} disabled={busy}>No fix</Button><Button variant="outline" onClick={() => recordOutcome("failed_repair")} disabled={busy}>Failed repair</Button><Button variant="outline" onClick={() => recordOutcome("returned_unrepaired")} disabled={busy}>Returned unrepaired</Button><Button variant="outline" onClick={() => recordOutcome("cancelled")} disabled={busy}>Cancelled</Button></div>{outcome && <div className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{outcome.outcome}</strong>{outcome.reason && <p className="mt-1 text-slate-600">{outcome.reason}</p>}</div>}<div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">Warranty</p>{warranty ? <p className="text-sm text-slate-500">{warranty.warranty_days} days · expires {new Date(warranty.expires_at).toLocaleDateString("en-NG")} · {warranty.status}</p> : <p className="text-sm text-slate-500">No warranty recorded.</p>}</div>{status === "Completed" && <Button onClick={createWarranty} disabled={busy}><ShieldCheck className="mr-2 size-4"/>{warranty ? "Update warranty" : "Issue warranty"}</Button>}</div></CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 font-heading text-lg"><HandCoins className="size-5 text-teal-700"/>08 · Collection & handover</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">Device handover</p>{handover ? <p className="text-sm text-slate-500">Collected by {handover.recipient_name} · {new Date(handover.handed_over_at).toLocaleString("en-NG")}</p> : <p className="text-sm text-slate-500">Customer confirmation is required before collection.</p>}</div>{["Completed", "Ready for Collection", "Collected"].includes(status) && <Button onClick={collect} disabled={busy}>{handover ? "Update handover" : "Collect device"}</Button>}</div><RepeatLinkForm repairId={repairId} warrantyId={warranty?.id ?? null} existing={repeatLinks} busy={busy} reload={load}/></CardContent></Card>

    <div className="sr-only">{customerId}{completed ? " completed" : " in progress"}</div>
  </section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}<Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 text-sm font-normal normal-case tracking-normal"/></label>;
}

function RepeatLinkForm({ repairId, warrantyId, existing, busy, reload }: { repairId: string; warrantyId: string | null; existing: RepairRepeatLink[]; busy: boolean; reload: () => Promise<void> }) {
  const [repeatId, setRepeatId] = useState("");
  const [reason, setReason] = useState("");
  async function link() {
    if (!repeatId.trim()) return toast.error("Enter the repeat repair ID.");
    const { error } = await repairOperationsService.linkRepeatRepair(repairId, repeatId.trim(), warrantyId, reason || null);
    if (error) return toast.error(error.message);
    toast.success("Repeat repair linked.");
    setRepeatId(""); setReason(""); await reload();
  }
  return <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input value={repeatId} onChange={(e) => setRepeatId(e.target.value)} placeholder="Repeat repair ID"/><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason"/><Button variant="outline" onClick={link} disabled={busy}>Link repeat repair</Button></div>{existing.length > 0 && <div className="space-y-2">{existing.map((link) => <div key={link.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-medium">{link.original_repair_id === repairId ? "Repeat:" : "Original:"}</span> {link.original_repair_id === repairId ? link.repeat_repair_id : link.original_repair_id}{link.reason ? <span className="text-slate-500"> · {link.reason}</span> : null}</div>)}</div>}</div>;
}
