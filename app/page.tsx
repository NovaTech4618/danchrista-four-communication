import type { Metadata } from "next";
import Link from "next/link";
import ScrollExpand from "@/components/marketing/ScrollExpand";
import { NovatechLogo } from "@/components/brand/NovatechLogo";

export const metadata: Metadata = {
  title: "Danchrista Four Communication | Business, connected.",
  description:
    "A simple business management system for Danchrista Four Communication—sales, repairs, parts, stock, engineers, payments and daily closing in one place.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

const pillars = [
  ["01", "Sales", "Record gadgets, phones and accessories without losing the numbers."],
  ["02", "Parts & stock", "Know what came in, what went out and what is running low."],
  ["03", "Engineers", "Track parts, service, payments and outstanding credit clearly."],
  ["04", "Repairs", "Follow a device from job intake to completion and collection."],
  ["05", "Money", "Separate revenue, cash received, expenses, debt and profit."],
  ["06", "Daily closing", "End the day with one picture of what actually happened."],
] as const;

const workflow = [
  ["Record", "One action creates the right business records."],
  ["Track", "Stock, jobs, payments and credit stay connected."],
  ["Understand", "The owner sees what needs attention before closing."],
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9f8] text-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f7f9f8]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Danchrista home" className="shrink-0">
            <NovatechLogo />
          </Link>
          <div className="flex items-center gap-3 sm:gap-7">
            <Link href="#system" className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:block">The system</Link>
            <Link href="#workflow" className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:block">How it works</Link>
            <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800">Open system</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute -left-48 -top-48 size-[36rem] rounded-full bg-teal-300/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-56 -right-40 size-[32rem] rounded-full bg-cyan-200/15 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-700 shadow-sm">
              <span className="size-1.5 rounded-full bg-teal-500 motion-safe:animate-pulse" /> Danchrista Four Communication
            </div>
            <h1 className="mt-7 font-heading text-[3.35rem] font-bold leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-[5.9rem]">
              Run the shop.<br /><span className="nova-gradient-text">Know the numbers.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              One simple system for sales, repairs, phone parts, stock, engineers, payments and daily closing—built around how Danchrista actually works.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/login" className="nova-lift inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800">Enter Danchrista</Link>
              <Link href="#system" className="nova-lift inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50/50">See what it tracks</Link>
            </div>
          </div>
        </div>

        <ScrollExpand
          src="/hero.svg"
          alt="Danchrista business management dashboard showing sales, repairs, engineer credit and shop activity"
          title="Everything important. In one view."
          scrollHint="Keep scrolling"
          useWindowScroll
          startWidth={42}
          startHeight={58}
          startRadius={24}
          endRadius={0}
          mediaZoom={1.35}
          scrollDistance={1.2}
          holdDistance={0.35}
          smoothing={0.1}
          overlayScrim={0.45}
          enabled
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-200">Built around the real shop</p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-5xl">From the counter to closing time.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">Sales, repairs, parts, engineer credit, cash and stock are not separate stories. Danchrista keeps them connected.</p>
        </ScrollExpand>
      </section>

      <section id="system" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">The system</p>
            <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.045em] sm:text-5xl">Six parts of the business.<br />One connected record.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">The goal is not to add more software. It is to remove the confusion between the books, WhatsApp, memory and the actual business.</p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map(([number, title, text]) => (
              <div key={number} className="group bg-[#f9fbfa] p-7 transition hover:bg-white sm:p-8">
                <span className="font-data text-xs font-bold text-teal-700">{number}</span>
                <h3 className="mt-5 font-heading text-2xl font-bold tracking-[-0.025em]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                <div className="mt-7 h-px w-12 bg-teal-300 transition-all duration-500 group-hover:w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.09),transparent_42%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">The philosophy</p>
              <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.045em] sm:text-5xl">Less writing.<br />More knowing.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">The person recording the transaction should not have to maintain five different records. The system should do the connecting.</p>
            </div>
            <div className="grid gap-4">
              {workflow.map(([title, text], index) => (
                <div key={title} className="flex gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-950 font-data text-xs font-bold text-white">0{index + 1}</span>
                  <div><h3 className="font-heading text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">Danchrista</p>
              <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.045em] sm:text-5xl">The shop should not have to remember everything.</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">Let the system keep the record. Let the owner focus on the business.</p>
            </div>
            <Link href="/login" className="inline-flex shrink-0 items-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-teal-50">Open the system ↗</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-5 pb-8 text-sm text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span>Danchrista Four Communication</span><span>Business, connected.</span>
        </div>
      </footer>
    </main>
  );
}
