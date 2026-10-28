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

  const basics = [
    { title: "Repairs", text: "Log phones and faults.", href: "/repairs" },
    { title: "Parts", text: "Track parts out and back.", href: "/parts-collection" },
    { title: "Sales", text: "Record sales and payments.", href: "/sales" },
    { title: "Money", text: "Log costs and close the day.", href: "/reports/daily-closing" },
  ];

  return (
    <AppLayout>
      <main className="mx-auto max-w-7xl space-y-6 pb-8">
        <header className="flex items-center gap-3 rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm sm:p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><BookOpen className="size-5" /></span>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#182a28]">Help</h1>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Main guides">
          {basics.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-2xl border border-[#dfe6df] bg-white p-4 transition hover:border-[#bfd2c8] hover:bg-[#f7faf7]">
              <h2 className="text-sm font-bold text-[#263a35]">{item.title}</h2>
              <p className="mt-1 text-xs leading-5 text-[#74837e]">{item.text}</p>
            </Link>
          ))}
        </section>

        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Record each transaction once.
        </p>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm sm:p-5" aria-labelledby="device-help-title">
          <h2 id="device-help-title" className="font-heading text-lg font-bold text-[#182a28]">Use Amezing on any device</h2>
          <p className="mt-1 text-sm leading-6 text-[#74837e]">Use the same website on a phone, tablet, or computer. You can install it for quicker access, but installation is optional.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e3e9e4] bg-[#fbfcfa] p-3">
              <h3 className="text-sm font-bold text-[#263a35]">Android</h3>
              <p className="mt-1 text-xs leading-5 text-[#74837e]">Open Amezing in Chrome. Open the browser menu and choose “Install app” or “Add to Home screen” if shown.</p>
            </div>
            <div className="rounded-xl border border-[#e3e9e4] bg-[#fbfcfa] p-3">
              <h3 className="text-sm font-bold text-[#263a35]">iPhone or iPad</h3>
              <p className="mt-1 text-xs leading-5 text-[#74837e]">Open Amezing in Safari, tap Share, then choose “Add to Home Screen”.</p>
            </div>
            <div className="rounded-xl border border-[#e3e9e4] bg-[#fbfcfa] p-3">
              <h3 className="text-sm font-bold text-[#263a35]">Computer</h3>
              <p className="mt-1 text-xs leading-5 text-[#74837e]">Use Chrome, Edge, or another supported browser. If an install icon is available in the address bar, use it to add Amezing.</p>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-[#f4f8f5] px-3 py-2.5 text-xs leading-5 text-[#40534d]">Internet is required to load and save live shop records. If Amezing shows “You are offline”, reconnect before recording sales, payments, repairs, or stock movements.</p>
        </section>

        <div className="space-y-6">
          {workspaceGroups.map((group) => (
            <section key={group.title} aria-labelledby={group.title.replaceAll(" ", "-").toLowerCase()}>
              <h2 id={group.title.replaceAll(" ", "-").toLowerCase()} className="mb-3 font-heading text-lg font-bold text-[#263a35]">{group.title}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {group.items.filter((item) => item.href !== "/inventory/accessories").map(({ title, href, description, permission, icon: Icon }) => {
                  const available = role !== null && hasPermission(role, permission);
                  const cardClass = `flex min-h-24 items-center gap-3 rounded-2xl border p-3 transition ${available ? "border-[#e3e9e4] bg-white hover:border-[#bfd2c8] hover:bg-[#f7faf7]" : "border-dashed border-slate-200 bg-slate-50/70"}`;
                  const card = (
                    <>
                      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${available ? "bg-[#eef4f1] text-[#1d6a54]" : "bg-slate-100 text-slate-500"}`}>
                        <Icon className="size-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#263a35]">{title}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-[#74837e]">{description}</span>
                        <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold ${available ? "text-[#1d6a54]" : "text-slate-500"}`}>
                          {available ? <>Open <ArrowRight className="size-3" /></> : <><LockKeyhole className="size-3" /> Locked</>}
                        </span>
                      </span>
                    </>
                  );

                  return available ? (
                    <Link key={title} href={href} className={cardClass}>{card}</Link>
                  ) : (
                    <div key={title} className={cardClass}>{card}</div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="flex justify-end">
          <Link href="/workspace" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white hover:bg-[#1d6a54]">Home <ArrowRight className="size-4" /></Link>
        </div>
      </main>
    </AppLayout>
  );
}
