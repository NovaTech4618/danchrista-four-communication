"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ClipboardList, Clock3, Hash, MonitorSmartphone, Plus,
  Search, Smartphone, UserRound, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentSession } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { deviceService } from "@/services/deviceService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DeviceRow = {
  id: string;
  brand: string;
  model: string;
  problem: string | null;
  device_type?: string | null;
  imei?: string | null;
  serial_number?: string | null;
  color?: string | null;
  storage?: string | null;
  condition?: string | null;
  physical_condition?: string | null;
  created_at?: string | null;
  customers: { full_name: string; phone?: string | null } | null;
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { void fetchDevices(); }, []);

  async function fetchDevices() {
    setLoading(true);
    setLoadError(false);
    await getCurrentSession();
    const { data, error } = await deviceService.getAllDevices();
    setLoading(false);
    if (error) {
      setLoadError(true);
      toast.error("Could not load phone records. Please try again.");
      return;
    }
    setDevices((data as unknown as DeviceRow[]) || []);
  }

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return devices;
    return devices.filter((device) =>
      [device.brand, device.model, device.problem, device.device_type,
        device.imei, device.serial_number, device.customers?.full_name,
        device.customers?.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [devices, search]);

  const withIdentifiers = devices.filter((device) => device.imei || device.serial_number).length;
  const withReportedIssue = devices.filter((device) => device.problem?.trim()).length;

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1440px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Amezing workspace</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Phone records & diagnostics</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Find a phone by customer, model, IMEI or serial number. Open its record to continue the repair history.</p>
          </div>
          <Link href="/repairs/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#065a34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            <Plus className="size-4" /> Log a phone / new repair
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Phone record summary">
          <SummaryCard icon={Smartphone} label="Phone records" value={loading ? "—" : devices.length.toLocaleString()} detail="Records currently available" />
          <SummaryCard icon={Hash} label="With IMEI / serial" value={loading ? "—" : withIdentifiers.toLocaleString()} detail="Identifiable devices" />
          <SummaryCard icon={ClipboardList} label="Reported issues" value={loading ? "—" : withReportedIssue.toLocaleString()} detail="Records with a fault note" />
        </section>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="font-heading text-base font-bold text-slate-950">All phone records</h2>
                <p className="mt-0.5 text-xs text-slate-500">{loading ? "Loading records…" : `${filteredDevices.length} of ${devices.length} records`}</p>
              </div>
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input aria-label="Search phone records" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search IMEI, serial, customer or model…" className="h-11 rounded-xl border-slate-200 pl-9 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading phone records">
                {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : loadError ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-800">Records could not be loaded</p>
                <p className="mt-1 text-sm text-slate-500">Your existing records have not been changed.</p>
                <button onClick={() => void fetchDevices()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Try again</button>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><MonitorSmartphone className="size-6" /></div>
                <h3 className="mt-4 font-semibold text-slate-900">{search ? "No matching phone records" : "No phone records yet"}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{search ? "Try another customer name, phone number, model, IMEI or serial number." : "Phone records are currently created through the repair intake workflow. Start an intake to register a customer's phone."}</p>
                {!search && <Link href="/repairs/new" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#087443] px-4 py-2 text-sm font-semibold text-white"><Plus className="size-4" /> Start phone intake</Link>}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredDevices.map((device) => (
                  <Link key={device.id} href={`/devices/${device.id}`} className="group flex flex-col gap-3 p-4 transition hover:bg-slate-50/80 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-emerald-600 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700"><Smartphone className="size-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950 group-hover:text-emerald-800">{device.brand} {device.model}</h3>
                        {device.condition && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{device.condition}</span>}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">{device.problem || "No fault note recorded"}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><UserRound className="size-3.5" />{device.customers?.full_name || "Customer not linked"}</span>
                        {(device.imei || device.serial_number) && <span className="inline-flex items-center gap-1"><Hash className="size-3.5" />{device.imei ? `IMEI: ${device.imei}` : `Serial: ${device.serial_number}`}</span>}
                        {device.created_at && <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{new Date(device.created_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="text-xs text-slate-400">{[device.storage, device.color].filter(Boolean).join(" · ") || device.device_type || "Phone record"}</span>
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition group-hover:border-emerald-200 group-hover:bg-white group-hover:text-emerald-700"><ArrowRight className="size-4" /></span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
          <Wrench className="mt-0.5 size-4 shrink-0" />
          <p><span className="font-semibold">Connected workflow.</span> A phone record opens its existing device profile and repair history. Sales ownership, swap history, diagnostic attachments and standalone issue logs still need dedicated data connections; they are not being shown as if they already exist.</p>
        </div>
      </main>
    </AppLayout>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof Smartphone; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-4" /></span>
      </div>
      <p className="mt-3 font-heading text-2xl font-bold tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
