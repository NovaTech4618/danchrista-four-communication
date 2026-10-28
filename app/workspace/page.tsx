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

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then((result) => {
      if (active && result.data) setRole(result.data);
    });
    return () => { active = false; };
  }, []);

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

        {role === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Loading" aria-busy="true">
            {Array.from({ length: 10 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-[#e5ebe6] bg-white" />)}
          </div>
        ) : (
          <div className="space-y-7">
            {workspaceGroups.map((group) => {
              const items = group.items.filter((item) => item.showOnHome !== false && hasPermission(role, item.permission));
              if (!items.length) return null;
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
