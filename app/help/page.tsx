"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, LockKeyhole } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { workspaceGroups } from "@/lib/workspaceSections";

export default function HelpPage() {
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
        <header className="rounded-3xl border border-[#dfe6df] bg-white p-5 shadow-sm sm:p-7">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1d6a54]"><BookOpen className="size-4" /> Guide to the workspace</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#182a28]">What each section does</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#65766f]">
            This is the map of Amezing Limited. Sections are grouped by the work they support. Open a section from the home screen or use the link below; return Home when you finish.
          </p>
        </header>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 sm:p-6">
          <h2 className="font-heading text-xl font-bold text-[#182a28]">How the main workflows fit together</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#e4e9e5] p-4">
              <p className="text-sm font-bold text-[#1d6a54]">1. Repair a customer's phone</p>
              <p className="mt-2 text-sm leading-6 text-[#65766f]">Save the person in Customers, identify the device in Devices, then use Repairs to record the fault and move the job through its real status. Technical Services holds the workshop's labour/service catalogue.</p>
            </div>
            <div className="rounded-xl border border-[#e4e9e5] p-4">
              <p className="text-sm font-bold text-[#1d6a54]">2. Keep engineer parts accountable</p>
              <p className="mt-2 text-sm leading-6 text-[#65766f]">Phone Parts is the source stock. Daily Parts Collection records date-based issue/return/use activity. Engineers holds the person's wider account and payments. Engineer Daily Report summarises that date. Technician Parts Ledger is for parts tied to a specific repair.</p>
            </div>
            <div className="rounded-xl border border-[#e4e9e5] p-4">
              <p className="text-sm font-bold text-[#1d6a54]">3. Sell goods and follow balances</p>
              <p className="mt-2 text-sm leading-6 text-[#65766f]">Use Sales for a normal stocked-goods sale, or Invoices & Receipts for a customer invoice and full/partial payment. Owed & Owing is a follow-up overview; the separate debit/credit books support their specific manual entry workflows. Do not record the same event in two books.</p>
            </div>
            <div className="rounded-xl border border-[#e4e9e5] p-4">
              <p className="text-sm font-bold text-[#1d6a54]">4. Record shop costs and check money</p>
              <p className="mt-2 text-sm leading-6 text-[#65766f]">Daily Expenses & Closing records shop expenses and reconciles the day's cash. Money Movement shows the financial ledger. Accounts tracks balances by cash/bank/POS/mobile-money account and transfers between accounts. These screens answer different questions.</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-[#f7f8f5] px-4 py-3 text-sm leading-6 text-[#53635d]">
            **Important:** record each real transaction in its correct workflow. Never create example transactions to make a report look complete. If two sections appear to describe the same event, check this guide before entering it twice.
          </p>
        </section>

        <div className="space-y-8">
          {workspaceGroups.map((group) => (
            <section key={group.title} aria-labelledby={group.title.replaceAll(" ", "-").toLowerCase()}>
              <header className="mb-3">
                <h2 id={group.title.replaceAll(" ", "-").toLowerCase()} className="font-heading text-xl font-bold text-[#182a28] sm:text-2xl">{group.title}</h2>
                <p className="mt-1 text-sm text-[#74837e]">{group.description}</p>
              </header>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map(({ title, href, description, permission, icon: Icon }) => {
                  const available = role !== null && hasPermission(role, permission);
                  const cardContent = (
                    <>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${available ? "bg-[#eef4f1] text-[#1d6a54]" : "bg-slate-100 text-slate-500"}`}>
                        <Icon className="size-5" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#263a35]">{title}</span>
                        <span className="mt-1.5 block text-xs leading-5 text-[#74837e] sm:text-sm">{description}</span>
                        <span className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${available ? "text-[#1d6a54]" : "text-slate-500"}`}>
                          {available ? <>Open section <ArrowRight className="size-3.5" /></> : <><LockKeyhole className="size-3.5" /> Owner / permission required</>}
                        </span>
                      </span>
                    </>
                  );

                  return available ? (
                    <Link key={title} href={href} className="group flex min-h-32 gap-3 rounded-2xl border border-[#e3e9e4] bg-white p-4 transition hover:border-[#bfd2c8] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">
                      {cardContent}
                    </Link>
                  ) : (
                    <div key={title} className="flex min-h-32 gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe6df] bg-white p-4">
          <p className="text-sm text-[#65766f]">Need to get back to the task menu?</p>
          <Link href="/workspace" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white hover:bg-[#1d6a54]">Return to Home <ArrowRight className="size-4" /></Link>
        </div>
      </main>
    </AppLayout>
  );
}
