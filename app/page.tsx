import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NovatechLogo } from "@/components/brand/NovatechLogo";

export const metadata: Metadata = {
  title: "Danchrista Four Communication | Business, connected.",
  description:
    "The internal business system for Danchrista Four Communication: sales, phone parts, repairs, engineers, payments and daily closing, kept in one record.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

const modules = [
  ["Sales", "Record phones, gadgets and accessories sold, and how the customer paid."],
  ["Parts & stock", "Track downboards, charging flexes, cables and glass from purchase to sale or engineer use."],
  ["Engineers", "See what each engineer has taken, what they've paid back, and what's still owed."],
  ["Repairs", "Follow a phone from intake through technician work, parts used, payment and collection."],
  ["Money", "Keep sales, cash, expenses, customer credit and engineer debt as separate, legible totals."],
  ["Daily closing", "One end-of-day picture: what sold, what came in, what's owed, what went out."],
] as const;

const steps = [
  ["Record once", "Whoever does the work enters the transaction a single time."],
  ["Connects automatically", "Stock, jobs, money, credit and profit stay tied to that one record."],
  ["Close with confidence", "Daily closing shows sales, cash, debts, expenses and profit — reconciled."],
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
      <nav className="sticky top-0 z-50 border-b border-[#c98a4f]/15 bg-[#0b1512]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7">
          <Link href="/" aria-label="Danchrista home">
            <span className="hidden sm:inline-flex">
              <NovatechLogo dark />
            </span>
            <span className="sm:hidden">
              <NovatechLogo dark compact />
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="#modules" className="hidden text-sm font-medium text-[#93a69c] hover:text-[#f4f1ea] sm:block">
              Modules
            </Link>
            <Link href="#how" className="hidden text-sm font-medium text-[#93a69c] hover:text-[#f4f1ea] sm:block">
              How it works
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-[#c98a4f]/40 bg-[#c98a4f]/10 px-4 py-2 text-sm font-semibold text-[#e7b784] transition hover:bg-[#c98a4f]/20"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pt-16 sm:px-7 sm:pt-24 lg:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-[-8rem] size-[36rem] -translate-x-1/2 rounded-full bg-[#12b76a]/[0.07] blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-[#c98a4f]/25 bg-[#c98a4f]/[0.06] px-3 py-1.5 font-mono text-[11px] text-[#e7b784]">
              Ticket No. 000001 — Danchrista Four Communication
            </span>
            <h1 className="mt-7 font-heading text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-[4.2rem]">
              Run the shop.
              <br />
              Know the numbers.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#93a69c] sm:text-lg">
              A workspace built for Danchrista Four Communication — sales, phone parts, repairs, engineers, payments and
              daily closing, kept as one connected record instead of six notebooks.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c98a4f] px-6 py-3.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]"
              >
                Sign in to Danchrista <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#modules"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 px-6 py-3.5 text-sm font-semibold text-[#f4f1ea] transition hover:border-white/25"
              >
                See what&apos;s inside
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="relative rounded-t-lg bg-[#f3efe3] px-6 pb-8 pt-6 text-[#16231d] shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]">
              <p className="font-mono text-[11px] uppercase tracking-wide text-[#6b5c48]">Danchrista Four Communication</p>
              <p className="mt-0.5 font-mono text-[11px] text-[#6b5c48]">Daily closing — today</p>
              <div className="mt-4 space-y-2 border-t border-dashed border-[#c9bfa8] pt-4 font-mono text-[13px] text-[#3d3527]">
                <Row label="Sales" value="486,200" />
                <Row label="Cash received" value="512,000" />
                <Row label="Parts used" value="14" />
                <Row label="Engineer debt" value="38,500" />
                <Row label="Outstanding" value="61,000" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#c9bfa8] pt-4 font-mono text-[13px] font-bold text-[#16231d]">
                <span>Profit</span>
                <span>118,340</span>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-[#12793f]">Status: reconciled</p>
            </div>
            <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="block h-4 w-full" aria-hidden="true">
              <path
                d="M0,0 L0,10 L10,20 L20,10 L30,20 L40,10 L50,20 L60,10 L70,20 L80,10 L90,20 L100,10 L110,20 L120,10 L130,20 L140,10 L150,20 L160,10 L170,20 L180,10 L190,20 L200,10 L210,20 L220,10 L230,20 L240,10 L250,20 L260,10 L270,20 L280,10 L290,20 L300,10 L300,0 Z"
                fill="#f3efe3"
              />
            </svg>
          </div>
        </div>
      </section>

      <section id="modules" className="px-5 py-24 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              Six parts of the shop, one business picture.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#93a69c]">
              Danchrista is built around the records that matter every day, not software terminology.
            </p>
          </div>
          <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {modules.map(([title, text]) => (
              <div key={title} className="grid gap-2 py-6 sm:grid-cols-[220px_1fr] sm:gap-8">
                <h3 className="font-heading text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-[#93a69c]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-5 py-20 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Less writing. More knowing.</h2>
            <p className="mt-4 text-base leading-7 text-[#93a69c]">
              The system connects the work as it happens, so nobody has to search a notebook to understand the shop.
            </p>
          </div>
          <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-[18px] hidden h-px bg-white/10 sm:block" />
            {steps.map(([title, text], i) => (
              <div key={title} className="relative">
                <div className="relative z-10 grid size-9 place-items-center rounded-full border border-[#c98a4f]/50 bg-[#0b1512] font-mono text-xs text-[#e7b784]">
                  {i + 1}
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#93a69c]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-7">
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#c98a4f]/20 bg-gradient-to-br from-[#12211c] to-[#0b1512] px-7 py-14 sm:px-12 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              The shop shouldn&apos;t have to remember everything.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#93a69c]">Let the system keep the record. Sign in to see today&apos;s numbers.</p>
          </div>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-6 py-3.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]"
          >
            Open Danchrista <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-[#93a69c] sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <span>Danchrista Four Communication</span>
        <span>Internal business system</span>
      </footer>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
