"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CircleAlert, Search, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { workspaceGroups } from "@/lib/workspaceSections";

const QUICK_TASKS = [
  { href: "/repairs", title: "Receive a repair", description: "Register a customer's phone and record the problem.", action: "Open repairs" },
  { href: "/sales", title: "Make a sale", description: "Sell a phone part, accessory or other stocked item.", action: "Open sales" },
  { href: "/inventory", title: "Find or add stock", description: "Look up repair parts and check available quantities.", action: "Open phone parts" },
  { href: "/customers", title: "Find a customer", description: "Look up a customer or save a new customer record.", action: "Open customers" },
  { href: "/parts-collection", title: "Issue parts to an engineer", description: "Record parts given out, returned or still outstanding.", action: "Open parts collection" },
  { href: "/reports/daily-closing", title: "Record expenses and close the day", description: "Enter shop expenses and review the day's closing figures.", action: "Open daily closing" },
] as const;

type LoadState = "loading" | "ready" | "error";

export default function WorkspacePage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [search, setSearch] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const loadRole = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await staffService.getMyRole();
      if (result.error || !result.data) {
        setRole(null);
        setLoadState("error");
        return;
      }
      setRole(result.data);
      setLoadState("ready");
    } catch {
      setRole(null);
      setLoadState("error");
    }
  }, []);

  useEffect(() => { void loadRole(); }, [loadRole]);

  const allowedGroups = useMemo(
    () => workspaceGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(role, item.permission)),
    })).filter((group) => group.items.length > 0),
    [role],
  );

  const quickTasks = useMemo(
    () => QUICK_TASKS.map((task) => {
      const section = workspaceGroups.flatMap((group) => group.items).find((item) => item.href === task.href);
      return section && hasPermission(role, section.permission) ? { ...task, icon: section.icon } : null;
    }).filter((task): task is NonNullable<typeof task> => task !== null),
    [role],
  );

  const query = search.trim().toLowerCase();
  const searchResults = useMemo(
    () => allowedGroups.flatMap((group) => group.items)
      .filter((item) => !QUICK_TASKS.some((task) => task.href === item.href))
      .filter((item) => query && `${item.title} ${item.description}`.toLowerCase().includes(query)),
    [allowedGroups, query],
  );

  return (
    <AppLayout>
      <main className="mx-auto max-w-7xl space-y-7 pb-10">
        <section className="overflow-hidden rounded-3xl border border-[#dfe6df] bg-white shadow-sm">
          <div className="relative px-5 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-[#eef4f1]" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-2 top-20 size-32 rounded-full border-[18px] border-[#f6f1e9]" aria-hidden="true" />
            <div className="relative max-w-3xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]"><Sparkles className="size-4" aria-hidden="true" /> Amezing Limited</p>
              <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[#182a28] sm:text-4xl">What do you need to do?</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65766f] sm:text-base">Choose a job below to get started. Your work is saved in the right shop record, so the team can follow it up.</p>
            </div>
          </div>
          <div className="border-t border-[#edf0eb] bg-[#fbfcfa] px-5 py-4 sm:px-8">
            <label htmlFor="workspace-search" className="sr-only">Search shop tools</label>
            <div className="relative max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#74837e]" aria-hidden="true" />
              <input id="workspace-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search repairs, customers, stock, reports..." className="h-12 w-full rounded-xl border border-[#dfe6df] bg-white pl-11 pr-4 text-sm text-[#182a28] outline-none transition placeholder:text-[#89958f] focus:border-[#1d6a54] focus:ring-4 focus:ring-[#1d6a54]/10" />
            </div>
            {query && <div className="mt-3 max-w-2xl rounded-xl border border-[#e3e9e4] bg-white p-3" aria-live="polite">
              <p className="mb-2 text-xs font-semibold text-[#74837e]">{searchResults.length} matching {searchResults.length === 1 ? "tool" : "tools"}</p>
              {searchResults.length ? <div className="grid gap-1 sm:grid-cols-2">{searchResults.map(({ title, href, description, icon: Icon }) => (
                <Link key={href} href={href} className="flex min-w-0 items-center gap-3 rounded-lg p-2.5 hover:bg-[#f3f7f4] focus-visible:outline-2 focus-visible:outline-[#1d6a54]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-4" aria-hidden="true" /></span>
                  <span className="min-w-0"><span className="block text-sm font-semibold text-[#263a35]">{title}</span><span className="block truncate text-xs text-[#74837e]">{description}</span></span>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-[#1d6a54]" aria-hidden="true" />
                </Link>
              ))}</div> : <p className="text-sm text-[#74837e]">No matching tool found in the sections available to your account.</p>}
            </div>}
          </div>
        </section>

        {loadState === "loading" && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading your workspace" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl border border-[#e5ebe6] bg-white" />)}</section>}

        {loadState === "error" && <section className="flex flex-col gap-3 rounded-2xl border border-[#ead7b6] bg-[#fffaf0] p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 size-5 shrink-0 text-[#9a6a1c]" aria-hidden="true" /><div><h2 className="text-sm font-bold text-[#5f451e]">We couldn’t load your shop access.</h2><p className="mt-1 text-sm leading-5 text-[#786748]">Check your connection and try again. Your records have not been changed.</p></div></div>
          <button type="button" onClick={() => void loadRole()} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white hover:bg-[#1d6a54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">Try again</button>
        </section>}

        {loadState === "ready" && <>
          {!query && <section aria-labelledby="quick-tasks-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 id="quick-tasks-heading" className="font-heading text-xl font-bold text-[#182a28] sm:text-2xl">Common jobs</h2><p className="mt-1 text-sm text-[#74837e]">The things workers do most often.</p></div><span className="text-xs font-medium text-[#74837e]">Tap a job to begin</span></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickTasks.map(({ href, title, description, action, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-32 min-w-0 items-start gap-3 rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-[0_2px_6px_rgba(24,42,40,0.04)] transition hover:-translate-y-0.5 hover:border-[#bfd2c8] hover:shadow-[0_8px_18px_rgba(18,59,52,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54] sm:p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#d7a95a]"><Icon className="size-5" strokeWidth={1.8} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#263a35] sm:text-base">{title}</span><span className="mt-1.5 block text-xs leading-5 text-[#74837e] sm:text-sm">{description}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]">{action}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span></span>
              </Link>)}
            </div>
          </section>}

          <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-xl font-bold text-[#182a28]">More shop tools</h2><p className="mt-1 text-sm text-[#74837e]">Other records and management tools for your role.</p></div>
              <button type="button" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen} aria-controls="workspace-tools-list" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe6df] px-3 text-sm font-semibold text-[#285c4d] hover:bg-[#f3f7f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">{moreOpen ? "Hide tools" : "Show tools"} <span aria-hidden="true">{moreOpen ? "−" : "+"}</span></button>
            </div>
            {moreOpen && <div id="workspace-tools-list" className="mt-5 space-y-6">{allowedGroups.map((group) => {
              const items = group.items.filter((item) => !QUICK_TASKS.some((task) => task.href === item.href));
              if (!items.length) return null;
              return <section key={group.title} aria-labelledby={`tools-${group.title.replaceAll(" ", "-").toLowerCase()}`}>
                <h3 id={`tools-${group.title.replaceAll(" ", "-").toLowerCase()}`} className="mb-2 text-sm font-bold text-[#52675e]">{group.title}</h3>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{items.map(({ title, href, description, icon: Icon }) => <Link key={href} href={href} className="group flex min-w-0 items-start gap-3 rounded-xl border border-[#edf0eb] p-3 transition hover:border-[#bfd2c8] hover:bg-[#fbfcfa] focus-visible:outline-2 focus-visible:outline-[#1d6a54]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f1f4f0] text-[#527467]"><Icon className="size-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#263a35]">{title}</span><span className="mt-1 block text-xs leading-5 text-[#74837e]">{description}</span></span><ArrowRight className="mt-1 size-4 shrink-0 text-[#8a9992] transition group-hover:translate-x-0.5 group-hover:text-[#1d6a54]" aria-hidden="true" />
                </Link>)}</div>
              </section>;
            })}</div>}
          </section>

          <div className="flex flex-col gap-3 rounded-2xl border border-[#e3e9e4] bg-[#f8faf7] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3"><BookOpen className="mt-0.5 size-5 shrink-0 text-[#1d6a54]" aria-hidden="true" /><div><p className="text-sm font-semibold text-[#263a35]">Not sure which tool to use?</p><p className="mt-1 text-xs leading-5 text-[#74837e]">Open the simple guide to understand where each shop record belongs.</p></div></div>
            <Link href="/help" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-bold text-[#285c4d] hover:bg-[#eef4f1]">Read the guide <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </>}
      </main>
    </AppLayout>
  );
}
