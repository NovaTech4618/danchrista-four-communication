import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, Package, Plus, Users, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import OwnerControlPanel from "@/components/dashboard/OwnerControlPanel";
import ManagementInsights from "@/components/dashboard/ManagementInsights";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";

const actions = [
  { title: "Record a sale", description: "Gadgets, accessories and everyday shop sales.", href: "/sales", icon: CreditCard, tone: "dark" },
  { title: "Take in a repair", description: "Create a job and keep its progress visible.", href: "/repairs", icon: Wrench, tone: "light" },
  { title: "Issue a part", description: "Record stock given to an engineer.", href: "/engineer-workflow", icon: Package, tone: "light" },
  { title: "Receive stock", description: "Add newly purchased items to inventory.", href: "/inventory", icon: Plus, tone: "light" },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[28px] bg-[#123b34] px-5 py-7 text-white shadow-[0_24px_60px_rgba(18,59,52,0.18)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[42px] border-[#d7a95a]/10" />
          <div className="pointer-events-none absolute -bottom-28 right-24 size-64 rounded-full border-[28px] border-white/5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d7a95a]">
                <span className="size-1.5 rounded-full bg-[#d7a95a]" /> Danchrista Four Communication
              </div>
              <h1 className="mt-4 font-heading text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Run the shop with clarity.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#c7d8d2] sm:text-base">Sales, repairs, stock, engineer accounts and cash movement — brought together in one working view.</p>
            </div>
            <Link href="/sales" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d7a95a] px-5 py-3 text-sm font-bold text-[#123b34] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#e5bc75] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d7a95a]"><Plus className="size-4" /> Record sale</Link>
          </div>
        </section>

        <OwnerControlPanel />

        <section aria-labelledby="quick-actions" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Quick actions</p><h2 id="quick-actions" className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#182a28]">What are you doing now?</h2></div>
            <ArrowRight className="hidden size-5 text-[#9aa9a4] sm:block" aria-hidden="true" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => { const Icon = action.icon; const dark = action.tone === "dark"; return <Link key={action.title} href={action.href} className={`group relative overflow-hidden rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54] ${dark ? "border-[#123b34] bg-[#123b34] text-white shadow-[0_16px_34px_rgba(18,59,52,0.14)]" : "border-[#dfe6df] bg-white text-[#182a28] shadow-[0_10px_28px_rgba(18,59,52,0.06)] hover:border-[#1d6a54]/30 hover:shadow-[0_18px_36px_rgba(18,59,52,0.10)]"}`}>
                <span className={`flex size-10 items-center justify-center rounded-xl ${dark ? "bg-[#d7a95a] text-[#123b34]" : "bg-[#eef4f1] text-[#1d6a54]"}`}><Icon className="size-4" /></span>
                <p className="mt-5 text-sm font-bold">{action.title}</p><p className={`mt-1.5 text-xs leading-5 ${dark ? "text-[#c7d8d2]" : "text-[#687974]"}`}>{action.description}</p>
                <ArrowRight className={`absolute right-5 top-5 size-4 transition-transform group-hover:translate-x-1 ${dark ? "text-[#d7a95a]" : "text-[#9aa9a4]"}`} />
              </Link>; })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
          <div className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#edf0ed] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Performance</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Business trend</h2><p className="mt-0.5 text-xs text-[#74837e]">Revenue, costs and profit for the selected period.</p></div><Link href="/reports" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#1d6a54] hover:bg-[#eef4f1]">View reports <BarChart3 className="size-3.5" /></Link></div>
            <div className="p-4 sm:p-6"><ManagementInsights /></div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-[#fbfaf7] shadow-[0_10px_28px_rgba(18,59,52,0.06)]"><div className="flex items-center gap-3 border-b border-[#e8e4da] px-5 py-4 sm:px-6"><div className="flex size-9 items-center justify-center rounded-xl bg-[#f2d8a5]/50 text-[#8a641d]"><Package className="size-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a641d]">Inventory</p><h2 className="mt-1 font-heading text-base font-bold text-[#182a28]">Stock attention</h2></div></div><div className="p-4 sm:p-5"><LowStock /></div></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]"><div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Workshop</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Recent activity</h2><p className="mt-0.5 text-xs text-[#74837e]">The latest repairs entered in the system.</p></div><Users className="size-4 text-[#9aa9a4]" aria-hidden="true" /></div><div className="p-4 sm:p-6"><RecentActivity /></div></section>
      </div>
    </AppLayout>
  );
}
