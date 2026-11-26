"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Hash, Palette, ShieldCheck, UserRound,
  Wrench, Pencil, Smartphone, HardDrive, CalendarDays, Phone,
} from "lucide-react";

import { getCurrentSession } from "@/lib/supabase";
import { deviceService } from "@/services/deviceService";
import AppLayout from "@/components/layout/AppLayout";
import DeviceRepairs from "@/components/repairs/DeviceRepairs";
import type { Device } from "@/types/device";

export default function DeviceDetailsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { void fetchDevice(); }, [params.id]);

  async function fetchDevice() {
    setLoading(true);
    setNotFound(false);
    await getCurrentSession();
    const { data, error } = await deviceService.getDeviceById(params.id);
    setLoading(false);
    if (error || !data) { setNotFound(true); return; }
    setData(data as Device);
  }

  if (loading) return <AppLayout><div className="p-6 text-sm text-slate-500">Loading phone record…</div></AppLayout>;
  if (notFound || !data) return <AppLayout><div className="space-y-3 p-6"><p className="text-sm text-slate-600">Phone record not found or you do not have access.</p><Link href="/devices" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft className="size-4" /> Back to phone records</Link></div></AppLayout>;

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1200px] space-y-5">
        <Link href="/devices" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"><ArrowLeft className="size-4" /> Phone records</Link>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10"><Smartphone className="size-6" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">Phone record</p>
                  <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{data.brand} {data.model}</h1>
                  <p className="mt-1 text-sm text-slate-300">{data.problem || "No reported issue on this record"}</p>
                </div>
              </div>
              <Link href={`/devices/${data.id}/edit`} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"><Pencil className="size-4" /> Edit record</Link>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            <Info icon={Hash} label="IMEI" value={data.imei || "Not recorded"} />
            <Info icon={Hash} label="Serial number" value={data.serial_number || "Not recorded"} />
            <Info icon={UserRound} label="Customer" value={data.customers?.full_name || "Not linked"} />
            <Info icon={Phone} label="Customer phone" value={data.customers?.phone || "Not recorded"} />
            <Info icon={HardDrive} label="Storage" value={data.storage || "Not recorded"} />
            <Info icon={Palette} label="Colour" value={data.color || "Not recorded"} />
            <Info icon={ShieldCheck} label="Condition" value={data.physical_condition || data.condition || "Not recorded"} />
            <Info icon={ClipboardList} label="Accessories received" value={data.accessories || "Not recorded"} />
            <Info icon={CalendarDays} label="Date registered" value={data.created_at ? new Date(data.created_at).toLocaleDateString() : "Not recorded"} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2"><Wrench className="size-4 text-emerald-700" /><h2 className="font-heading text-base font-bold text-slate-950">Repair history</h2></div>
            <p className="mt-1 text-xs text-slate-500">Repair jobs linked to this exact phone record.</p>
          </div>
          <div className="p-4 sm:p-6"><DeviceRepairs deviceId={data.id} /></div>
        </section>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-950">
          This profile currently shows the stored device details and linked repair history. Sale ownership, swaps/replacements, diagnostic media and general issue-log events will be connected as those workflows are implemented.
        </div>
      </main>
    </AppLayout>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
      <div className="flex items-center gap-2 text-slate-400"><Icon className="size-3.5 shrink-0" /><span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="mt-1.5 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
