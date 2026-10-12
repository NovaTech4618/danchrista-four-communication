"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Package, Search as SearchIcon, UserRound, Wallet, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { engineerService } from "@/services/engineerService";
import { supabase } from "@/lib/supabase";
import type { Engineer } from "@/types/engineer";

type PhonePart = {
  id: string;
  item_name: string;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  compatible_models: string | null;
  sku: string | null;
  quantity: number;
};
type AccountActivity = {
  id: string;
  engineer_id: string;
  transaction_type: string;
  description: string;
  transaction_date: string;
  debit: number;
  credit: number;
  notes: string | null;
};
type Result = { id: string; group: "engineers" | "parts" | "activity"; title: string; subtitle: string; href: string; searchText: string };

const money = (value: number) => "₦" + Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [parts, setParts] = useState<PhonePart[]>([]);
  const [activity, setActivity] = useState<AccountActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSearchData() {
      setLoading(true);
      setLoadError("");
      try {
        const [engineerResult, partResult, activityResult] = await Promise.all([
          engineerService.getEngineers(),
          supabase.from("inventory")
            .select("id,item_name,category,subcategory,brand,compatible_models,sku,quantity")
            .eq("is_active", true)
            .eq("category", "Phone Parts")
            .order("item_name", { ascending: true })
            .limit(1000),
          supabase.from("engineer_transactions")
            .select("id,engineer_id,transaction_type,description,transaction_date,debit,credit,notes")
            .order("transaction_date", { ascending: false })
            .limit(300),
        ]);
        if (!active) return;
        const warnings: string[] = [];
        if (engineerResult.error) warnings.push("Engineer records could not be loaded.");
        if (partResult.error) warnings.push("Phone parts could not be loaded.");
        if (activityResult.error) warnings.push("Engineer account activity could not be loaded.");
        setLoadError(warnings.join(" "));
        setEngineers((engineerResult.data ?? []) as Engineer[]);
        setParts((partResult.data ?? []) as PhonePart[]);
        setActivity((activityResult.data ?? []) as AccountActivity[]);
      } catch {
        if (active) setLoadError("Search data could not be loaded. Check your connection and refresh.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadSearchData();
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [] as Result[];
    const engineerNames = new Map(engineers.map((engineer) => [engineer.id, engineer.name]));
    const engineerResults: Result[] = engineers
      .filter((engineer) => [engineer.name, engineer.phone, engineer.business_name, engineer.address, engineer.notes].filter(Boolean).join(" ").toLowerCase().includes(term))
      .map((engineer) => ({
        id: engineer.id,
        group: "engineers",
        title: engineer.name,
        subtitle: [engineer.phone, engineer.business_name, engineer.status].filter(Boolean).join(" · "),
        href: "/engineers?search=" + encodeURIComponent(engineer.name) + "&engineer_id=" + encodeURIComponent(engineer.id),
        searchText: [engineer.name, engineer.phone, engineer.business_name].filter(Boolean).join(" "),
      }));
    const partResults: Result[] = parts
      .filter((part) => [part.item_name, part.brand, part.subcategory, part.compatible_models, part.sku].filter(Boolean).join(" ").toLowerCase().includes(term))
      .map((part) => ({
        id: part.id,
        group: "parts",
        title: part.item_name,
        subtitle: [part.brand, part.subcategory, part.compatible_models, "Available: " + Number(part.quantity || 0)].filter(Boolean).join(" · "),
        href: "/inventory?search=" + encodeURIComponent(part.sku || part.item_name),
        searchText: [part.item_name, part.brand, part.subcategory, part.compatible_models, part.sku].filter(Boolean).join(" "),
      }));
    const activityResults: Result[] = activity
      .filter((item) => {
        const engineerName = engineerNames.get(item.engineer_id) || "";
        return [engineerName, item.description, item.transaction_type, item.notes].filter(Boolean).join(" ").toLowerCase().includes(term);
      })
      .map((item) => {
        const engineerName = engineerNames.get(item.engineer_id) || "Engineer";
        const amount = Number(item.debit) > 0 ? "Debit " + money(Number(item.debit)) : "Credit " + money(Number(item.credit));
        const date = new Date(item.transaction_date).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
        return {
          id: item.id,
          group: "activity" as const,
          title: engineerName + " — " + item.description,
          subtitle: date + " · " + item.transaction_type.replace(/_/g, " ") + " · " + amount,
          href: "/engineers?search=" + encodeURIComponent(engineerName) + "&engineer_id=" + encodeURIComponent(item.engineer_id),
          searchText: [engineerName, item.description, item.transaction_type, item.notes].filter(Boolean).join(" "),
        };
      });
    return [...engineerResults, ...partResults, ...activityResults].slice(0, 100);
  }, [query, engineers, parts, activity]);

  const groups = useMemo(() => {
    const order: Result["group"][] = ["engineers", "parts", "activity"];
    return order.map((group) => ({ group, items: results.filter((result) => result.group === group) })).filter((entry) => entry.items.length > 0);
  }, [results]);

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1d6a54]">Engineer and phone-parts records</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Search Amezing Limited</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">Find an engineer, a phone part or a recorded engineer account entry.</p>
        </header>

        <div className="sticky top-[72px] z-20 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-3.5 size-5 text-slate-400" aria-hidden="true" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }} placeholder="Engineer name, phone, business, part, model, SKU or account entry…" aria-label="Search engineers, phone parts and engineer account activity" className="h-12 w-full rounded-lg border-0 bg-slate-50 pl-11 pr-11 text-sm outline-none ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#1d6a54]" />
            {query && <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear search"><X className="size-4" /></button>}
          </div>
          <div className="hidden px-2 pt-2 text-[11px] text-slate-400 sm:flex sm:justify-between"><span>Search is limited to engineers, phone parts and engineer account activity.</span><span>Esc to clear</span></div>
        </div>

        {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><span className="size-2 animate-pulse rounded-full bg-[#1d6a54]" />Loading engineer and parts records…</div>}
        {loadError && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{loadError} Results may be incomplete.</div>}
        {!loading && query.trim() && <p className="text-sm text-slate-500">{results.length} result{results.length === 1 ? "" : "s"} for <span className="font-semibold text-slate-800">“{query.trim()}”</span></p>}

        {!query.trim() ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center sm:p-14">
            <SearchIcon className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">Search workshop records</p>
            <p className="mt-1 text-sm text-slate-500">Start typing an engineer's name, phone number, phone-part model, SKU or account description.</p>
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 text-left">
              <Tip icon="engineer" title="Engineers" text={String(engineers.length) + " records"} />
              <Tip icon="parts" title="Phone parts" text={String(parts.length) + " records"} />
              <Tip icon="activity" title="Account activity" text={String(activity.length) + " recent entries"} />
            </div>
          </div>
        ) : !loading && results.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><p className="font-semibold text-slate-800">No matching records found</p><p className="mt-1 text-sm text-slate-500">Try fewer words or search by engineer phone, part model or SKU.</p></div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ group, items }) => {
              const title = group === "engineers" ? "Engineers" : group === "parts" ? "Phone Parts" : "Engineer Account Activity";
              const Icon = group === "engineers" ? UserRound : group === "parts" ? Package : Wallet;
              return <section key={group} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</span><span className="text-xs font-semibold text-slate-400">{items.length}</span></div>
                <div className="divide-y divide-slate-100">{items.map((item) => <Link key={group + "-" + item.id} href={item.href} className="flex min-h-16 items-center gap-3 p-4 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1d6a54]"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="size-4" aria-hidden="true" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.title}</p><p className="truncate text-xs text-slate-500">{item.subtitle}</p></div><span className="hidden shrink-0 text-xs font-semibold text-[#1d6a54] sm:block">Open →</span></Link>)}</div>
              </section>;
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

function Tip({ icon, title, text }: { icon: "engineer" | "parts" | "activity"; title: string; text: string }) {
  const Icon = icon === "engineer" ? UserRound : icon === "parts" ? Package : ClipboardList;
  return <div className="rounded-xl border border-slate-200 p-3"><Icon className="size-4 text-[#1d6a54]" /><p className="mt-2 text-xs font-semibold text-slate-800">{title}</p><p className="mt-1 text-[11px] text-slate-500">{text}</p></div>;
}
