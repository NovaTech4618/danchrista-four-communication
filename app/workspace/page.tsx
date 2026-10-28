"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { workspaceGroups } from "@/lib/workspaceSections";
import WorkspaceOverview from "@/components/workspace/WorkspaceOverview";

export default function WorkspacePage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [pageSearch, setPageSearch] = useState("");

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then((result) => {
      if (active && result.data) setRole(result.data);
    });
    return () => { active = false; };
  }, []);

  const query = pageSearch.trim().toLowerCase();
  const visibleGroups = role === null ? [] : workspaceGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === "/inventory/accessories" || !hasPermission(role, item.permission)) return false;
        if (!query || group.title.toLowerCase().includes(query)) return true;
        return (item.title + " " + item.description + " " + item.href).toLowerCase().includes(query);
      }),
    }))
    .filter((group) => group.items.length > 0);
  const visiblePageCount = visibleGroups.reduce((count, group) => count + group.items.length, 0);

  return (
    <AppLayout>
      <main className="mx-auto max-w-7xl space-y-7 pb-8">
        <header className="flex items-center justify-between rounded-2xl border border-[#dfe6df] bg-white px-5 py-4 shadow-sm sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Amezing Limited</p>
            <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-[#182a28]">Home</h1>
          </div>
          <Link href="/search" aria-label="Search" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#dfe6df] text-[#285c4d] hover:bg-[#f5f8f5]">
            <Search className="size-4" />
          </Link>
        </header>

        {role !== null && <WorkspaceOverview role={role} />}

        {role !== null && (
          <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm sm:p-5" aria-label="Find a page">
            <label htmlFor="page-search" className="mb-2 block text-sm font-bold text-[#263a35]">Find a page</label>
            <div className="flex items-center gap-2 rounded-xl border border-[#dfe6df] bg-[#fbfcfa] px-3 focus-within:border-[#1d6a54] focus-within:ring-2 focus-within:ring-[#1d6a54]/10">
              <Search className="size-4 shrink-0 text-[#74837e]" aria-hidden="true" />
              <input
                id="page-search"
                type="search"
                value={pageSearch}
                onChange={(event) => setPageSearch(event.target.value)}
                placeholder="Try: debt, stock, engineer, sales…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#263a35] outline-none placeholder:text-[#98a49f]"
              />
            </div>
            <p className="mt-2 text-xs text-[#74837e]">All pages you can access are listed below. Choose a page to open it.</p>
          </section>
        )}

        {role === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Loading" aria-busy="true">
            {Array.from({ length: 10 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-[#e5ebe6] bg-white" />)}
          </div>
        ) : (
          <div className="space-y-7">
            {query && visiblePageCount > 0 && (
              <p role="status" className="text-sm text-[#53635d]">Found {visiblePageCount} page{visiblePageCount === 1 ? "" : "s"} for “{pageSearch.trim()}”.</p>
            )}
            {query && visiblePageCount === 0 ? (
              <section className="rounded-2xl border border-dashed border-[#dfe6df] bg-white p-6 text-center">
                <h2 className="font-heading text-lg font-bold text-[#263a35]">No pages found</h2>
                <p className="mt-1 text-sm text-[#74837e]">Try a shorter word, or clear your search to see all pages.</p>
                <button type="button" onClick={() => setPageSearch("")} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white hover:bg-[#1d6a54]">Show all pages</button>
              </section>
            ) : visibleGroups.map((group) => {
              const items = group.items;
              const headingId = group.title.replaceAll(" ", "-").toLowerCase();
              return (
                <section key={group.title} aria-labelledby={headingId}>
                  <h2 id={headingId} className="mb-3 font-heading text-base font-bold text-[#263a35]">{group.title}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {items.map(({ title, href, description, icon: Icon }) => (
                      <Link
                        key={title}
                        href={href}
                        className="group flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-[#e3e9e4] bg-white px-3 py-4 text-center shadow-[0_2px_6px_rgba(24,42,40,0.03)] transition hover:-translate-y-0.5 hover:border-[#bfd2c8] hover:shadow-[0_8px_18px_rgba(18,59,52,0.07)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]"
                      >
                        <span className="grid size-11 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#d7a95a]">
                          <Icon className="size-5" strokeWidth={1.8} />
                        </span>
                        <span className="text-sm font-bold text-[#263a35]">{title}</span>
                        <span className="line-clamp-2 max-w-44 text-[11px] leading-4 text-[#74837e]">{description}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
