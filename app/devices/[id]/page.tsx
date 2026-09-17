"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Hash, Palette, ShieldCheck, UserRound, Wrench, Pencil } from "lucide-react";

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
    await getCurrentSession();
    const { data, error } = await deviceService.getDeviceById(params.id);
    setLoading(false);
    if (error || !data) { setNotFound(true); return; }
    setData(data);
  }

  if (loading) return <AppLayout><div className="p-6 text-sm text-slate-500">Loading device...</div></AppLayout>;
  if (notFound || !data) return <AppLayout><div className="p-6 text-sm text-slate-500">Device not found.</div></AppLayout>;

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1200px] space-y-5 p-5 sm:p-6 lg:p-8">
        <Link href="/devices" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="size-4" /> Back to devices</Link>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4"><div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Wrench className="size-6" /></div><div><p className="text-xs font-medium uppercase tracking-wider text-teal-700">Device profile</p><h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950">{data.brand} {data.model}</h1><p className="mt-1 text-sm text-slate-500">{data.problem || "No problem recorded"}</p></div></div>
            <div className="flex items-center gap-2">{data.customers?.full_name && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[11px] uppercase tracking-wider text-slate-400">Customer</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><UserRound className="size-4 text-slate-400" />{data.customers.full_name}</p></div>}<Link href={`/devices/${data.id}/edit`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil className="size-4" /> Edit</Link></div>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Info icon={Hash} label="Serial / IMEI" value={data.serial_number || "—"} /><Info icon={Palette} label="Color" value={data.color || "—"} /><Info icon={ShieldCheck} label="Condition" value={data.condition || "—"} /><Info icon={ClipboardList} label="Accessories" value={data.accessories || "—"} /></div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-heading text-base font-semibold text-slate-950">Repair history</h2><p className="mt-0.5 text-xs text-slate-500">Every repair connected to this device.</p></div><div className="p-4 sm:p-6"><DeviceRepairs deviceId={data.id} /></div></section>
      </main>
    </AppLayout>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3"><div className="flex items-center gap-2 text-slate-400"><Icon className="size-3.5" /><span className="text-[11px] uppercase tracking-wider">{label}</span></div><p className="mt-1.5 truncate text-sm font-medium text-slate-800">{value}</p></div>;
}
