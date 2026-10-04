import Link from "next/link";
import { ArrowRight, Banknote, ClipboardList, Package, Plus, ShoppingCart, UserRound, Wrench } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import DailyShopMetrics from "@/components/dashboard/DailyShopMetrics";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";

const actions = [
  { title: "Sale", text: "Record something sold", href: "/sales", icon: ShoppingCart },
  { title: "Repair", text: "Receive a customer's phone", href: "/repairs/new", icon: Wrench },
  { title: "Part out", text: "Give a part to an engineer", href: "/engineers", icon: UserRound },
  { title: "Expense", text: "Record money spent", href: "/expenses", icon: Banknote },
];

export default function DashboardPage() {
  return (
    <main className="space-y-5">
      <section className="rounded-2xl border border-[#dfe6df] bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#74837e]">Today · Amezing Limited</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#182a28]">Today's shop book</h1>
            <p className="mt-1 text-sm text-[#74837e]">Record what happens. Amezing keeps the totals and stock.</p>
          </div>
          <Link href="/reports/daily-closing" className="hidden rounded-xl border border-[#dfe6df] px-4 py-2 text-xs font-bold text-[#285c4d] sm:inline-flex sm:items-center sm:gap-2">
            <ClipboardList className="size-4" /> Close day
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map(({ title, text, href, icon: Icon }) => (
          <Link key={title} href={href} className="group rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1d6a54]/30">
            <span className="grid size-11 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-5" /></span>
            <p className="mt-4 text-sm font-bold text-[#182a28]">{title}</p>
            <p className="mt-1 text-[11px] leading-4 text-[#74837e]">{text}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Quick view</p><h2 className="mt-1 text-lg font-bold text-[#182a28]">What is happening today?</h2></div>
          <Link href="/activity" className="text-xs font-bold text-[#1d6a54]">History <ArrowRight className="ml-1 inline size-3" /></Link>
        </div>
        <DailyShopMetrics />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Repair book</p><h2 className="mt-1 text-base font-bold text-[#182a28]">Recent repairs</h2></div>
            <Link href="/repairs" className="text-xs font-bold text-[#1d6a54]">All repairs</Link>
          </div>
          <div className="p-4"><RecentActivity /></div>
        </div>
        <div className="rounded-2xl border border-[#e8e4da] bg-[#fbfaf7] shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#e8e4da] px-5 py-4"><Package className="size-4 text-[#8a641d]" /><h2 className="text-base font-bold text-[#182a28]">Stock attention</h2></div>
          <div className="p-4"><LowStock /></div>
          <Link href="/inventory" className="block border-t border-[#e8e4da] px-5 py-3 text-xs font-bold text-[#8a641d]">Open inventory →</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Owner control</p><h2 className="mt-1 text-base font-bold text-[#182a28]">Need the full book?</h2><p className="mt-1 text-xs text-[#74837e]">Reports, closing, money owed and stock history stay available without filling the home screen.</p></div>
          <div className="flex gap-2"><Link href="/owed-owing" className="rounded-xl border border-[#dfe6df] px-4 py-2.5 text-xs font-bold text-[#285c4d]">Owed & owing</Link><Link href="/reports" className="rounded-xl bg-[#123b34] px-4 py-2.5 text-xs font-bold text-white">Reports</Link></div>
        </div>
      </section>
    </main>
  );
}
