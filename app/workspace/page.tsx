"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { workspaceGroups } from "@/lib/workspaceSections";
import { HandCoins, Package, ShoppingCart, Wrench, ClipboardList, Users, Search, ChevronDown } from "lucide-react";

const mainTasks = [
  { title: "Repair a phone", hint: "Take in a phone and follow the repair", href: "/repairs", permission: "repairs" as const, icon: Wrench },
  { title: "Sell something", hint: "Sell an item and collect payment", href: "/sales", permission: "sales" as const, icon: ShoppingCart },
  { title: "Find or add stock", hint: "Check parts, accessories and quantities", href: "/inventory", permission: "inventory" as const, icon: Package },
  { title: "Money people owe", hint: "See who has not paid and record payments", href: "/owed-owing", permission: "outstanding" as const, icon: HandCoins },
  { title: "Close today's shop", hint: "Enter expenses and check today's totals", href: "/reports/daily-closing", permission: "daily_closing" as const, icon: ClipboardList },
  { title: "Find a customer", hint: "Look up a name or phone number", href: "/customers", permission: "customers" as const, icon: Users },
];

export default function WorkspacePage() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then((result) => { if (active && result.data) setRole(result.data); });
    return () => { active = false; };
  }, []);

  const extraGroups = workspaceGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.showOnHome !== false && hasPermission(role, item.permission) && !mainTasks.some((task) => task.href === item.href)),
  })).filter((group) => group.items.length > 0);

  return (
    <AppLayout>
      <main className="mx-auto max-w-5xl space-y-6 pb-10">
        <header className="space-y-2 px-1 pt-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Amezing Limited</p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#182a28] sm:text-4xl">What do you want to do?</h1>
          <p className="text-sm text-[#65766f]">Choose a job to get started. We’ll guide you from there.</p>
        </header>

        {role === null ? (
          <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading shop actions" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-[#e5ebe6] bg-white" />)}
          </div>
        ) : (
          <>
            <section aria-label="Common shop jobs" className="grid gap-3 sm:grid-cols-2">
              {mainTasks.filter((task) => hasPermission(role, task.permission)).map(({ title, hint, href, icon: Icon }) => (
                <Link key={href} href={href} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-[#dfe7e1] bg-white p-4 shadow-sm transition hover:border-[#a9c6b8] hover:bg-[#f8fbf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54] sm:min-h-32 sm:p-5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#eaf3ee] text-[#1d6a54] group-hover:bg-[#123b34] group-hover:text-white"><Icon className="size-7" strokeWidth={2} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-lg font-bold text-[#203a31]">{title}</span><span className="mt-1 block text-sm leading-5 text-[#718078]">{hint}</span></span>
                  <span className="text-2xl font-semibold text-[#8aa397]" aria-hidden="true">›</span>
                </Link>
              ))}
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#dfe7e1] bg-white">
              <button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore} className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#1d6a54] sm:px-5">
                <span><span className="block font-bold text-[#203a31]">More shop tools</span><span className="mt-1 block text-xs text-[#718078]">Engineers, reports, suppliers and settings</span></span>
                <ChevronDown className={`size-5 text-[#557468] transition-transform ${showMore ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {showMore && <div className="space-y-5 border-t border-[#e8eee9] p-4 sm:p-5">
                {extraGroups.map((group) => <section key={group.title} aria-label={group.title}>
                  <h2 className="mb-2 text-sm font-bold text-[#52675e]">{group.title}</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.items.map(({ title, href, icon: Icon }) => <Link key={href} href={href} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e8eee9] px-3 py-2.5 text-sm font-semibold text-[#30483e] hover:bg-[#f5f8f5] focus-visible:outline-2 focus-visible:outline-[#1d6a54]">
                      <Icon className="size-4 shrink-0 text-[#1d6a54]" aria-hidden="true" /><span>{title}</span><span className="ml-auto text-lg text-[#8aa397]" aria-hidden="true">›</span>
                    </Link>)}
                  </div>
                </section>)}
                {hasPermission(role, "search") && <Link href="/search" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#eef4f1] px-4 text-sm font-bold text-[#1d6a54] hover:bg-[#e1eee7]"><Search className="size-4" aria-hidden="true" /> Search all records</Link>}
              </div>}
            </section>
          </>
        )}
        <p className="px-2 text-center text-xs leading-5 text-[#89958f]">Only the jobs your account can do are shown. If you are unsure, ask the shop manager before saving a record.</p>
      </main>
    </AppLayout>
  );
}
