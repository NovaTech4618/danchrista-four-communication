"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { workspaceGroups } from "@/lib/workspaceSections";

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
      <main className="mx-auto max-w-7xl space-y-8 pb-8">
        <header className="rounded-3xl border border-[#dfe6df] bg-white px-5 py-7 text-center shadow-sm sm:px-8 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d6a54]">Amezing Limited</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#182a28] sm:text-4xl">Shop workspace</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#65766f]">
            Choose the section that matches the job. Each card explains what it records and when to use it. Finish a task, then use Home to return here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-[#52675e]">
            <span className="rounded-full border border-[#dfe6df] px-3 py-1.5">Real shop records only</span>
            <span className="rounded-full border border-[#dfe6df] px-3 py-1.5">Stock and money remain traceable</span>
            <Link href="/help" className="rounded-full border border-[#dfe6df] px-3 py-1.5 font-semibold text-[#1d6a54] hover:bg-[#f5f8f5]">Read the section guide →</Link>
          </div>
        </header>

        {role === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading workspace" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-[#e5ebe6] bg-white" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {workspaceGroups.map((group) => {
              const items = group.items.filter((item) => hasPermission(role, item.permission));
              if (!items.length) return null;
              const headingId = group.title.replaceAll(" ", "-").toLowerCase();
              return (
                <section key={group.title} aria-labelledby={headingId}>
                  <header className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <h2 id={headingId} className="font-heading text-xl font-bold text-[#182a28] sm:text-2xl">{group.title}</h2>
                    <p className="text-sm text-[#74837e]">{group.description}</p>
                  </header>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map(({ title, href, description, icon: Icon }) => (
                      <Link
                        key={title}
                        href={href}
                        className="group flex min-h-36 min-w-0 gap-3 rounded-2xl border border-[#e3e9e4] bg-white p-4 shadow-[0_2px_6px_rgba(24,42,40,0.04)] transition hover:-translate-y-0.5 hover:border-[#bfd2c8] hover:shadow-[0_8px_18px_rgba(18,59,52,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54] sm:p-5"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#d7a95a]">
                          <Icon className="size-5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-[#263a35] sm:text-base">{title}</span>
                          <span className="mt-1.5 block text-xs leading-5 text-[#74837e] sm:text-sm sm:leading-5">{description}</span>
                          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]">Open section <span aria-hidden="true">→</span></span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs leading-5 text-[#89958f]">
          Only sections allowed for your account are shown. If a task does not match these descriptions, stop and check the guide before entering the same transaction in a different book.
        </p>
      </main>
    </AppLayout>
  );
}
