"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Smartphone, UserRound, Wrench } from "lucide-react";

import { getCurrentSession } from "@/lib/supabase";
import { customerService } from "@/services/customerService";
import AppLayout from "@/components/layout/AppLayout";
import CustomerDevices from "@/components/devices/CustomerDevices";
import CustomerLedger from "@/components/customers/CustomerLedger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/types/customer";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { void fetchCustomer(); }, [params.id]);

  async function fetchCustomer() {
    setLoading(true);
    await getCurrentSession();
    const { data: customer, error } = await customerService.getCustomerById(params.id);
    setLoading(false);
    if (error || !customer) { setNotFound(true); return; }
    setData(customer);
  }

  const initials = useMemo(() => {
    if (!data?.full_name) return "CU";
    return data.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }, [data?.full_name]);

  if (loading) return <AppLayout><main className="mx-auto max-w-[1500px] space-y-5 p-5 sm:p-6 lg:p-8"><div className="h-8 w-48 animate-pulse rounded bg-slate-100" /><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></main></AppLayout>;

  if (notFound || !data) return <AppLayout><main className="mx-auto max-w-[1500px] p-5 sm:p-6 lg:p-8"><Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><UserRound className="size-8 text-slate-400" /><h1 className="mt-4 font-heading text-xl font-semibold">Customer not found</h1><p className="mt-1 text-sm text-slate-500">This customer may have been removed or the link is invalid.</p><Link href="/customers" className="mt-5 text-sm font-semibold text-teal-700 hover:underline">Back to customers</Link></CardContent></Card></main></AppLayout>;

  return <AppLayout><main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
    <Link href="/customers" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-700"><ArrowLeft className="size-4" />Back to customers</Link>
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-teal-50/80 to-transparent" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-center gap-4 sm:gap-5"><div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50 font-heading text-xl font-bold text-teal-700 ring-1 ring-teal-100 sm:size-20 sm:text-2xl">{initials}</div><div className="min-w-0"><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-700">Customer profile</p><h1 className="mt-1 truncate font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">{data.full_name}</h1><p className="mt-1 text-sm text-slate-500">Customer record and workshop relationship</p></div></div><Link href="/repairs" className="relative inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"><Wrench className="size-4" />View repairs</Link></div></section>
    <section className="grid gap-4 md:grid-cols-3"><InfoCard icon={<Phone className="size-4" />} label="Phone" value={data.phone} /><InfoCard icon={<Mail className="size-4" />} label="Email" value={data.email || "Not provided"} /><InfoCard icon={<MapPin className="size-4" />} label="Address" value={data.address || "Not provided"} /></section>
    <CustomerLedger customerId={data.id} />
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-6 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700"><Smartphone className="size-5" /></div><div><h2 className="font-heading text-lg font-semibold text-slate-950">Devices</h2><p className="mt-1 text-sm text-slate-500">Devices registered to this customer.</p></div></div><CustomerDevices customerId={data.id} /></section>
    <Card><CardHeader><CardTitle className="font-heading text-lg">Customer activity</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500"><Wrench className="size-4 shrink-0" />Repair history and financial activity are now connected to this customer account.</div></CardContent></Card>
  </main></AppLayout>;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">{icon}</div><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p></div></div></CardContent></Card>; }
