import type { Metadata } from "next";
import Link from "next/link";
import ScrollExpand from "@/components/marketing/ScrollExpand";

export const metadata: Metadata = {
  title: "Danchrista Four Communication | Business, connected.",
  description:
    "A simple business management system for Danchrista Four Communication—sales, repairs, parts, stock, engineers, payments and daily closing in one place.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

const pillars = [
  ["01", "Sales", "Gadgets, phones and accessories recorded without losing the numbers."],
  ["02", "Parts & stock", "Know what came in, what went out and what needs attention."],
  ["03", "Engineers", "Parts, service, payments and outstanding credit stay accountable."],
  ["04", "Repairs", "Follow every device from intake to completion and collection."],
  ["05", "Money", "Separate revenue, cash, expenses, debt and real profit."],
  ["06", "Daily closing", "End the day with one clear picture of the shop."],
] as const;

export default function HomePage() {
  return (
    <main className="neo-page min-h-screen overflow-x-hidden text-slate-950">
      <nav className="sticky top-0 z-50 border-b border-white/70 bg-[#e9efec]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-7 lg:px-8">
          <Link href="/" aria-label="Danchrista home" className="flex items-center gap-3">
            <span className="neo-card grid size-11 place-items-center rounded-[15px] text-lg font-black text-teal-700">D</span>
            <span className="leading-none"><span className="block font-heading text-[17px] font-extrabold tracking-[-0.03em]">DANCHRISTA</span><span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.25em] text-slate-500">Four Communication</span></span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="#system" className="hidden text-sm font-bold text-slate-600 hover:text-slate-950 sm:block">System</Link>
            <Link href="#how" className="hidden text-sm font-bold text-slate-600 hover:text-slate-950 sm:block">How it works</Link>
            <Link href="/login" className="neo-button rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition sm:px-5">Open system</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-0 pt-16 sm:px-7 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="pointer-events-none absolute left-[-12rem] top-[-12rem] size-[34rem] rounded-full bg-teal-300/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10rem] top-[12rem] size-[28rem] rounded-full bg-white/80 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="neo-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-teal-800 sm:text-[11px]">
            <span className="size-1.5 rounded-full bg-teal-500" /> Built for Danchrista
          </div>
          <h1 className="mt-8 font-heading text-[3.4rem] font-extrabold leading-[0.88] tracking-[-0.075em] sm:text-7xl lg:text-[6.8rem]">
            Run the shop.<br /><span className="text-teal-700">Know the numbers.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
            One calm workspace for sales, repairs, parts, stock, engineers, payments and closing—without chasing notebooks or memory.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login" className="neo-button inline-flex items-center justify-center rounded-2xl bg-slate-950 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-900">Enter Danchrista ↗</Link>
            <Link href="#system" className="neo-button inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-sm font-bold text-slate-700 transition">Explore the system ↓</Link>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-[1500px] sm:mt-20">
          <ScrollExpand
            src="/hero.svg"
            alt="Danchrista business management workspace"
            title="Everything important. In one view."
            scrollHint="Scroll to open the workspace"
            useWindowScroll
            startWidth={38}
            startHeight={54}
            startRadius={32}
            endRadius={0}
            mediaZoom={1.18}
            scrollDistance={1.35}
            holdDistance={0.55}
            smoothing={0.075}
            overlayScrim={0.3}
            enabled
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-teal-200">The business, connected</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl lg:text-6xl">From the counter to closing time.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">Record it once. Let Danchrista connect the stock, money, jobs and accountability behind the action.</p>
          </ScrollExpand>
        </div>
      </section>

      <section id="system" className="relative px-5 py-20 sm:px-7 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-700">The operating system</p>
            <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-0.055em] sm:text-6xl">Six records.<br />One business picture.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">The design stays quiet so the numbers can be loud. Every section below represents a real part of the shop.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map(([number, title, text]) => (
              <article key={number} className="neo-card neo-lift rounded-[28px] p-7 sm:p-8">
                <div className="flex items-center justify-between"><span className="neo-pill grid size-10 place-items-center rounded-xl font-data text-[10px] font-bold text-teal-700">{number}</span><span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Danchrista</span></div>
                <h3 className="mt-8 font-heading text-2xl font-extrabold tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                <div className="neo-card-inset mt-7 h-2 rounded-full"><div className="h-full w-1/3 rounded-full bg-teal-400" /></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-5 pb-20 sm:px-7 lg:px-8 lg:pb-28">
        <div className="neo-card mx-auto max-w-7xl rounded-[36px] p-7 sm:p-12 lg:p-16">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-700">The idea</p>
              <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl">Less writing.<br />More knowing.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">A sale should update the business. A part should leave stock. A payment should change a balance. The owner should see the result.</p>
            </div>
            <div className="space-y-5">
              {["Record once", "Connect automatically", "Close with confidence"].map((title, i) => (
                <div key={title} className="neo-card-inset flex items-center gap-5 rounded-3xl p-5 sm:p-6">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 font-data text-xs font-bold text-white shadow-lg">0{i + 1}</span>
                  <div><h3 className="font-heading text-lg font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{i === 0 ? "The person doing the work enters the transaction once." : i === 1 ? "Stock, jobs, cash, credit and profit stay tied to the right record." : "Daily closing shows what sold, what was received, what is owed and what happened to stock."}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-7 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-slate-950 px-7 py-16 text-white shadow-[18px_22px_60px_rgba(15,23,42,.18)] sm:px-12 lg:px-16 lg:py-20">
          <div className="max-w-3xl"><p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-300">Danchrista Four Communication</p><h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-0.055em] sm:text-6xl">The shop should not have to remember everything.</h2><p className="mt-5 text-base leading-7 text-slate-400">Let the system keep the record. Let the owner focus on the business.</p></div>
          <Link href="/login" className="neo-button mt-9 inline-flex rounded-2xl bg-white px-7 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-teal-50">Open Danchrista ↗</Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8"><span>Danchrista Four Communication</span><span>Business, connected.</span></footer>
    </main>
  );
}
