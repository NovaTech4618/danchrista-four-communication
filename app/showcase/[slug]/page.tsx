"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NovatechLogo } from "@/components/brand/NovatechLogo";

type Company = {
  name: string;
  logo_url: string | null;
  showcase_description: string | null;
  showcase_phone: string | null;
  showcase_address: string | null;
  showcase_services: string[];
};

export default function ShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void params.then(({ slug }) => {
      supabase.rpc("get_public_company_showcase", { p_slug: slug }).maybeSingle().then(({ data }) => {
        if (!active) return;
        setCompany((data as Company | null) ?? null);
        setLoading(false);
      });
    });
    return () => { active = false; };
  }, [params]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-300">Loading business page…</div>;
  if (!company) return <div className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-300"><div><h1 className="font-heading text-3xl font-bold text-white">Business page unavailable</h1><p className="mt-2 text-sm">This showcase is private or does not exist.</p></div></div>;

  const initial = company.name.charAt(0).toUpperCase();
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-4"><div className="flex items-center gap-2 text-slate-400"><NovatechLogo dark compact /><span className="text-xs">Danchrista Four Communication</span></div></header>
        <section className="flex flex-1 items-center py-16 sm:py-24"><div className="w-full">
          <div className="grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-center">
            <div>
              <div className="grid size-20 place-items-center overflow-hidden rounded-3xl bg-teal-400 text-3xl font-bold text-slate-950 shadow-2xl shadow-teal-950/30">{company.logo_url ? <img src={company.logo_url} alt={`${company.name} logo`} className="size-full object-cover" /> : initial}</div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Official business page</p>
              <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-6xl">{company.name}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{company.showcase_description || "Professional repair and technical services for your devices."}</p>
              <div className="mt-7 flex flex-wrap gap-3">{company.showcase_phone && <a href={`tel:${company.showcase_phone}`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"><Phone className="size-4" />Call business</a>}{company.showcase_address && <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300"><MapPin className="size-4 text-teal-300" />{company.showcase_address}</div>}</div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-teal-400/10 text-teal-300"><Wrench className="size-5" /></div><div><p className="font-semibold">Services</p><p className="text-xs text-slate-500">What this business offers</p></div></div><div className="mt-5 flex flex-wrap gap-2">{(company.showcase_services || []).map((service) => <span key={service} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300">{service}</span>)}{company.showcase_services?.length === 0 && <p className="text-sm text-slate-500">Services will appear here.</p>}</div></div>
          </div>
        </div></section>
        <footer className="border-t border-slate-800 pt-5 text-xs text-slate-500">Business information published by {company.name}. Danchrista Four Communication.</footer>
      </div>
    </main>
  );
}
