import Link from "next/link";
import { Activity, ArrowRight, BarChart3, Bot, Boxes, CircleHelp, CreditCard, MessageCircle, ShieldCheck, Users, Wrench } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const topics = [
  { title: "Getting started", description: "Set up your business, branches and team, then start your first repair workflow.", href: "/settings", icon: CircleHelp },
  { title: "Repairs", description: "Create intake records, assign engineers, track progress, quote work and complete handover.", href: "/repairs", icon: Wrench },
  { title: "Activity history", description: "See important repair, stock and money events in one operational timeline.", href: "/activity", icon: Activity },
  { title: "Inventory", description: "Manage stock, purchases, transfers, low-stock alerts and technician parts accountability.", href: "/inventory", icon: Boxes },
  { title: "Billing & money", description: "Use sales, invoices, payments, outstanding balances and finance together.", href: "/finance", icon: CreditCard },
  { title: "WhatsApp", description: "Send fast customer updates and payment reminders from the communication workspace.", href: "/whatsapp", icon: MessageCircle },
  { title: "Staff & branches", description: "Owners and branch managers can manage staff access, roles and branch assignments.", href: "/staff", icon: Users },
];

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Support</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Help & Support</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">Start with the area you are trying to use. Danchrista keeps the workflow inside the workspace so you do not have to hunt for separate tools.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map(({ title, description, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4"><div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon className="size-5" /></div><ArrowRight className="mt-1 size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-600" /></div>
              <h2 className="mt-6 font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Link href="/assistant" className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm transition hover:border-teal-700 lg:col-span-2">
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-teal-500/15 text-teal-300"><Bot className="size-5" /></div><div><p className="font-semibold">Ask Danchrista Assistant</p><p className="text-xs text-slate-400">Get help understanding the records in your workspace.</p></div></div>
          </Link>
          <Link href="/tickets" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:bg-slate-50">
            <div className="flex items-center gap-3"><CircleHelp className="size-5 text-teal-700" /><div><p className="font-semibold text-slate-950">Need support?</p><p className="text-xs text-slate-500">Open a ticket for a problem that needs follow-up.</p></div></div>
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link href="/api/health" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200">
            <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-teal-700" /><div><p className="font-semibold text-slate-950">System status</p><p className="text-xs text-slate-500">Check if Danchrista is running normally.</p></div></div>
          </Link>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-start gap-4"><BarChart3 className="mt-0.5 size-5 text-slate-500" /><div><h2 className="font-semibold text-slate-950">Daily reporting</h2><p className="mt-1 text-sm leading-6 text-slate-600">Your daily numbers live inside <Link href="/reports" className="font-semibold text-teal-700 hover:underline">Reports</Link> — open it for today's profit trend and the wider business analytics.</p></div></div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
