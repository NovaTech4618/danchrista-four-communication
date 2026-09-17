import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, FileText, Package, Plus, Receipt, Smartphone, Users, WalletCards, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import OwnerControlPanel from "@/components/dashboard/OwnerControlPanel";
import ManagementInsights from "@/components/dashboard/ManagementInsights";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";
import QuickSale from "@/components/dashboard/QuickSale";

const actions = [
  { title: "Record Sale", description: "Sell gadgets and accessories.", href: "/sales", icon: CreditCard },
  { title: "Add Job Work", description: "Take in a repair job.", href: "/repairs", icon: Wrench },
  { title: "Mobile Sale", description: "Record a phone/device sale.", href: "/sales/mobile", icon: Smartphone },
  { title: "Give Part", description: "Issue stock to an engineer.", href: "/engineer-workflow", icon: Package },
  { title: "Receive Payment", description: "Collect customer or engineer money.", href: "/finance", icon: WalletCards },
  { title: "Add Stock", description: "Receive purchased stock.", href: "/inventory", icon: Plus },
];

const areas = [
  { title: "Repairs", description: "Add job work, my jobs and job status.", href: "/repairs", icon: Wrench },
  { title: "Sales", description: "Everything the shop sells.", href: "/sales", icon: CreditCard },
  { title: "Invoices", description: "Create and track customer invoices.", href: "/invoices", icon: FileText },
  { title: "Expenses", description: "Record money going out of the business.", href: "/expenses", icon: Receipt },
];

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a]";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1500px] space-y-6 p-0">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#087443]">Danchrista Four Communication</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Today&apos;s shop</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">The owner view: what was sold, what was received, what is owed, what needs work and what needs attention.</p>
          </div>
          <Link href="/sales" className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#087443] ${focusRing}`}><Plus className="size-4" aria-hidden="true" /> Record sale</Link>
        </header>

        <OwnerControlPanel />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087443]">Shop actions</p><h2 className="mt-1 font-heading text-xl font-bold tracking-tight text-slate-950">What do you want to do?</h2></div><ArrowRight className="hidden size-5 text-slate-400 sm:block" aria-hidden="true" /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{actions.map((action) => { const Icon = action.icon; return <Link key={action.title} href={action.href} className={`group rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-[#12b76a]/40 hover:bg-white ${focusRing}`}><div className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200 group-hover:bg-[#eaf8f1] group-hover:text-[#087443]"><Icon className="size-4" aria-hidden="true" /></div><p className="mt-3 text-sm font-bold text-slate-900">{action.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p></Link>; })}</div>
        </section>

        <QuickSale />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-heading text-base font-semibold text-slate-950">Business trend</h2><p className="mt-0.5 text-xs text-slate-500">Revenue, costs and profit for the selected period.</p></div><Link href="/reports" className={`inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#087443] hover:bg-[#eaf8f1] ${focusRing}`}>View reports <BarChart3 className="size-3.5" /></Link></div><div className="p-4 sm:p-5"><ManagementInsights /></div></div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Package className="size-4" aria-hidden="true" /></div><div><h2 className="font-heading text-base font-semibold text-slate-950">Stock attention</h2><p className="text-xs text-slate-500">Items running low or needing review.</p></div></div><div className="p-4 sm:p-5"><LowStock /></div></div>
        </section>

        <section><div className="mb-3"><h2 className="font-heading text-base font-semibold text-slate-950">Operations</h2><p className="mt-0.5 text-xs text-slate-500">The main work of Danchrista.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{areas.map((area) => { const Icon = area.icon; return <Link key={area.title} href={area.href} className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#12b76a]/40 ${focusRing}`}><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Icon className="size-4" /></div><div><p className="text-sm font-bold text-slate-900">{area.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{area.description}</p></div></Link>; })}</div></section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-heading text-base font-semibold text-slate-950">Recent workshop activity</h2><p className="mt-0.5 text-xs text-slate-500">The latest repairs entered in the system.</p></div><Users className="size-4 text-slate-400" aria-hidden="true" /></div><div className="p-4 sm:p-5"><RecentActivity /></div></section>
      </div>
    </AppLayout>
  );
}
