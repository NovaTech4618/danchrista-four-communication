"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { repairService } from "@/services/repairService";
import { MANUAL_REPAIR_STATUSES, REPAIR_PRIORITIES } from "@/types/repair";

type RepairForm = {
  technician: string;
  issue: string;
  diagnosis: string;
  repair_notes: string;
  solution: string;
  priority: string;
  deposit: string;
  expected_completion_date: string;
  estimated_cost: string;
  final_cost: string;
  status: string;
};

const input = "h-11 rounded-xl border-slate-200 bg-white";
const select = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function EditRepairPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<RepairForm | null>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, [params.id]);

  async function load() {
    const { data, error } = await repairService.getRepairById(params.id);
    setLoading(false);
    if (error || !data) {
      toast.error(error?.message || "Repair not found.");
      return;
    }

    setSummary(`${data.devices?.brand ?? "Device"} ${data.devices?.model ?? ""}`.trim());
    setForm({
      technician: data.technician ?? "",
      issue: data.issue ?? "",
      diagnosis: data.diagnosis ?? "",
      repair_notes: data.repair_notes ?? "",
      solution: data.solution ?? "",
      priority: data.priority ?? "Normal",
      deposit: data.deposit == null ? "" : String(data.deposit),
      expected_completion_date: data.expected_completion_date ?? "",
      estimated_cost: data.estimated_cost == null ? "" : String(data.estimated_cost),
      final_cost: data.final_cost == null ? "" : String(data.final_cost),
      status: data.status ?? "Received",
    });
  }

  function update<K extends keyof RepairForm>(key: K, value: RepairForm[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (!form.issue.trim()) return void toast.error("The repair problem is required.");

    const numeric = ["deposit", "estimated_cost", "final_cost"] as const;
    for (const key of numeric) {
      if (form[key] && (!Number.isFinite(Number(form[key])) || Number(form[key]) < 0)) {
        return void toast.error(`${key.replaceAll("_", " ")} is invalid.`);
      }
    }

    const estimated = form.estimated_cost ? Number(form.estimated_cost) : null;
    const finalCost = form.final_cost ? Number(form.final_cost) : null;
    const deposit = form.deposit ? Number(form.deposit) : 0;
    if (estimated !== null && deposit > estimated && finalCost === null) {
      return void toast.error("Deposit cannot be greater than the estimated cost.");
    }

    setSaving(true);
    const { error } = await repairService.updateRepair(params.id, {
      technician: form.technician.trim() || null,
      issue: form.issue.trim(),
      diagnosis: form.diagnosis.trim() || null,
      repair_notes: form.repair_notes.trim() || null,
      solution: form.solution.trim() || null,
      priority: form.priority,
      deposit,
      expected_completion_date: form.expected_completion_date || null,
      estimated_cost: estimated,
      final_cost: finalCost,
      status: form.status,
    });
    setSaving(false);

    if (error) return toast.error(error.message);
    toast.success("Repair updated.");
    router.push(`/repairs/${params.id}`);
  }

  if (loading) return <AppLayout><main className="mx-auto w-full max-w-4xl p-5 sm:p-6 lg:p-8"><div className="h-8 w-48 animate-pulse rounded bg-slate-100" /><div className="mt-5 h-96 animate-pulse rounded-2xl bg-slate-100" /></main></AppLayout>;
  if (!form) return <AppLayout><main className="mx-auto w-full max-w-4xl p-5 sm:p-6 lg:p-8"><Card><CardContent className="flex min-h-48 items-center justify-center text-sm text-slate-500">Repair could not be loaded.</CardContent></Card></main></AppLayout>;

  return <AppLayout>
    <main className="mx-auto w-full max-w-4xl space-y-5 p-5 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Link href={`/repairs/${params.id}`} className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft className="size-4" /></Link>
        <div className="min-w-0"><p className="text-sm font-medium text-teal-700">Repair desk</p><h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Edit repair</h1><p className="mt-1 text-sm text-slate-500">{summary || "Repair job"}</p></div>
      </div>

      <form onSubmit={save} className="space-y-5">
        <Card><CardHeader><CardTitle className="text-base">Job details</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Customer complaint / problem</label><textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={form.issue} onChange={(e) => update("issue", e.target.value)} required /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Technician</label><Input className={input} value={form.technician} onChange={(e) => update("technician", e.target.value)} /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Expected completion</label><Input className={input} type="date" value={form.expected_completion_date} onChange={(e) => update("expected_completion_date", e.target.value)} /></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label><select className={select} value={form.priority} onChange={(e) => update("priority", e.target.value)}>{REPAIR_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label><select className={select} value={form.status} onChange={(e) => update("status", e.target.value)}>{MANUAL_REPAIR_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></div></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Diagnosis & work</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Diagnosis</label><textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={form.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Solution / work performed</label><textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={form.solution} onChange={(e) => update("solution", e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Repair notes</label><textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={form.repair_notes} onChange={(e) => update("repair_notes", e.target.value)} /></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Money</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3">
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Estimated cost</label><Input className={input} type="number" min="0" step="0.01" value={form.estimated_cost} onChange={(e) => update("estimated_cost", e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Final cost</label><Input className={input} type="number" min="0" step="0.01" value={form.final_cost} onChange={(e) => update("final_cost", e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Deposit</label><Input className={input} type="number" min="0" step="0.01" value={form.deposit} onChange={(e) => update("deposit", e.target.value)} /></div>
        </CardContent></Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={`/repairs/${params.id}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700">Cancel</Link><Button type="submit" className="h-11 rounded-xl bg-slate-950 px-6 hover:bg-slate-800" disabled={saving}>{saving ? "Saving..." : "Save repair"}</Button></div>
      </form>
    </main>
  </AppLayout>;
}
