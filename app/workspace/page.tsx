import Link from "next/link";
import {
  ArrowRight, ArrowLeftRight, BarChart3, Boxes, ClipboardList, HandCoins,
  Landmark, Package, Search, Settings, ShoppingCart, UserRound, Users, Wrench
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const hubs = [
  { title: "Phone Parts", description: "See what is available and find an exact model quickly.", href: "/inventory", icon: Package, permission: "inventory" as const },
  { title: "Parts Movement", description: "Record parts given out, used, returned and collected.", href: "/parts-collection", icon: ArrowLeftRight, permission: "inventory" as const },
  { title: "Engineers", description: "Open an engineer to see parts, balances and history.", href: "/engineers", icon: UserRound, permission: "engineers" as const },
  { title: "Money & Balances", description: "Sales, debit, credit and account movement.", href: "/accounts", icon: Landmark, permission: "profit" as const },
  { title: "Reports", description: "Owner answers, daily closing and business summaries.", href: "/reports", icon: BarChart3, permission: "profit" as const },
  { title: "Settings", description: "Control the workspace and system configuration.", href: "/settings", icon: Settings, permission: "settings" as const },
];

const secondary = [
  { title: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales" as const },
  { title: "Repairs", href: "/repairs", icon: Wrench, permission: "repairs" as const },
  { title: "Owed & Owing", href: "/owed-owing", icon: HandCoins, permission: "outstanding" as const },
  { title: "Daily Closing", href: "/reports/daily-closing", icon: ClipboardList, permission: "daily_closing" as const },
  { title: "Alerts", href: "/alerts", icon: Boxes, permission: "profit" as const },
  { title: "Staff", href: "/staff", icon: Users, permission: "staff" as const },
  { title: "Search", href: "/search", icon: Search, permission: "search" as const },
];

export default function WorkspacePage() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[28px] bg-[#123b34] px-5 py-7 text-white shadow-[0_24px_60px_rgba(18,59,52,0.16)] sm:px-8 sm:py-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7a95a]">Amezing workspace</p>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-bold tracking-[-0.035em] sm:text-4xl">What do you want to do?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c7d8d2]">
            Choose one area, do the work, then use Back to return here. No giant page to scroll through.
          </p>
        </header>

        <section aria-labelledby="main-hubs">
          <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Main workspace</p><h2 id="main-hubs" className="mt-1 font-heading text-2xl font-bold text-[#182a28]">Go straight to the record you need.</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map(({ title, description, href, icon: Icon }) => (
              <Link key={title} href={href} className="group rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_8px_24px_rgba(18,59,52,0.05)] transition hover:-translate-y-1 hover:border-[#1d6a54]/40 hover:shadow-[0_16px_34px_rgba(18,59,52,0.10)]">
                <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Icon className="size-5" /></span><ArrowRight className="size-5 text-[#9aa9a4] transition group-hover:translate-x-1 group-hover:text-[#1d6a54]" /></div>
                <h3 className="mt-5 text-base font-bold text-[#182a28]">{title}</h3>
                <p className="mt-1.5 text-sm leading-5 text-[#74837e]">{description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_8px_24px_rgba(18,59,52,0.05)]">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">More tools</p><h2 className="mt-1 text-lg font-bold text-[#182a28]">Less-used areas stay here.</h2></div></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {secondary.map(({ title, href, icon: Icon }) => (
              <Link key={title} href={href} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#edf0ed] bg-[#f8faf8] px-3 text-sm font-semibold text-[#285c4d] transition hover:border-[#1d6a54]/30 hover:bg-[#eef4f1]">
                <Icon className="size-4" /><span>{title}</span><ArrowRight className="ml-auto size-4 text-[#a1afa9]" />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
