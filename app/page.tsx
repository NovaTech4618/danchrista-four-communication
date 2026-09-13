import type { Metadata } from "next";
import Link from "next/link";
import RepairStoryVideo from "@/components/marketing/RepairStoryVideo";
import { NovatechLogo } from "@/components/brand/NovatechLogo";

export const metadata: Metadata = {
  title: "NOVATECH Repair Suite | Run Every Repair From Intake to Profit",
  description:
    "NOVATECH is repair shop management software connecting customers, devices, repairs, engineers, parts, invoices, payments, inventory and business intelligence in one workspace.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "NOVATECH Repair Suite — Run Every Repair From Intake to Profit",
    description:
      "One connected workspace for repair shops: repairs, engineers, parts, invoices, payments, inventory, reporting and Premium Intelligence.",
    type: "website",
    siteName: "NOVATECH Repair Suite",
  },
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "NOVATECH Repair Suite",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Repair shop management software covering customers, devices, repairs, inventory, engineers, invoices, payments, reporting and business intelligence.",
  url: "https://novatech-repair-suite-piiy.vercel.app",
  offers: { "@type": "Offer", category: "SaaS subscription" },
};

const lifecycle = [
  ["01", "Intake", "Customer, device, fault and condition captured once."],
  ["02", "Diagnose", "Record the diagnosis, estimate and work required."],
  ["03", "Assign", "Put the job with the right engineer and keep ownership clear."],
  ["04", "Parts", "Track parts used, stock movement and engineer accountability."],
  ["05", "Invoice", "Turn the repair into a clear customer invoice."],
  ["06", "Payment", "Connect payment, outstanding balance and financial records."],
  ["07", "Handover", "Complete the job and record collection with confidence."],
  ["08", "Intelligence", "Understand revenue, profit, delays, stock and accountability."],
] as const;

const modules = [
  ["Repairs", "Run every job from intake to completion", "Create the repair, capture diagnosis, assign an engineer, track status, parts, costs, payments and collection.", "/repairs"],
  ["Inventory", "Know what you have and where it went", "Track stock, purchases, movements, low-stock signals and parts used on real repairs.", "/inventory"],
  ["Engineers", "Accountability without guesswork", "Keep engineer workload, parts out, parts in, payments and outstanding balances connected.", "/technical-services"],
  ["Invoices & payments", "Make every repair financially clear", "Link invoices to repairs and customers, record payments, update balances and keep finance aligned.", "/invoices"],
  ["Reports", "See the business beyond today's queue", "Understand sales, repairs, inventory, profit, debts and operational performance in one place.", "/reports"],
  ["Premium Intelligence", "Ask the business what is happening", "Investigate low sales, delayed repairs, stock pressure, engineer balances and unusual records using the data already in NOVATECH.", "/assistant"],
] as const;

const audiences = [
  ["Owner / manager", "See the operation, money and accountability without chasing staff for updates."],
  ["Front desk", "Create customers and repairs quickly, keep status clear and communicate confidently."],
  ["Engineer / technician", "Know the jobs, diagnosis and parts assigned to you—and keep your ledger clear."],
  ["Growing repair business", "Replace scattered notebooks, chats and spreadsheets with one connected system."],
] as const;

function ProductWindow({
  label,
  title,
  rows,
}: {
  label: string;
  title: string;
  rows: readonly [string, string, string][];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-teal-400" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        </div>
        <span className="text-xs font-medium text-slate-400">NOVATECH</span>
      </div>
      <div className="p-5 sm:p-7">
        <h3 className="font-heading text-xl font-bold text-slate-950 sm:text-2xl">{title}</h3>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {rows.map(([a, b, c], index) => (
            <div key={`${a}-${index}`} className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 px-4 py-3.5 last:border-b-0 sm:grid-cols-[1fr_auto_auto]">
              <span className="truncate text-sm font-semibold text-slate-800">{a}</span>
              <span className="text-xs font-medium text-slate-500">{b}</span>
              <span className="hidden rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 sm:inline-flex">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9f8] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />

      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f9f8]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="NOVATECH home" className="shrink-0"><NovatechLogo /></Link>
          <div className="flex items-center gap-2 sm:gap-6">
            <Link href="#product" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block">Product</Link>
            <Link href="#workflow" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block">How it works</Link>
            <Link href="#intelligence" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 md:block">Intelligence</Link>
            <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg">Sign in</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute -right-40 -top-40 size-[34rem] rounded-full bg-teal-300/15 blur-3xl" />
        <div className="absolute -left-40 bottom-0 size-80 rounded-full bg-cyan-200/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
            <div className="nova-fade-up max-w-2xl">
              <div className="nova-gradient-border inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-700 shadow-sm">Repair shop management software</div>
              <h1 className="mt-7 max-w-3xl font-heading text-[3.25rem] font-bold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Run every repair <span className="nova-gradient-text">from intake to profit.</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">NOVATECH connects customers, devices, diagnosis, engineers, parts, invoices, payments, inventory and business intelligence in one operational workspace.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="nova-lift inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800">Start with NOVATECH</Link>
                <Link href="#workflow" className="nova-lift inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50/50">See the repair lifecycle</Link>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-3 text-sm font-medium text-slate-500 sm:flex sm:flex-wrap sm:gap-x-6">
                <span>✓ Repairs</span><span>✓ Inventory</span><span>✓ Engineers</span><span>✓ Invoices</span><span>✓ Payments</span><span>✓ Intelligence</span>
              </div>
            </div>
            <div className="nova-fade-up nova-delay-2 lg:pl-2">
              <RepairStoryVideo />
              <p className="mt-4 text-center text-xs font-medium text-slate-400">One connected story—from the customer's device to the owner's numbers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["01", "One repair record", "Customer, device, engineer, parts, invoice and payment stay connected."],
              ["02", "One operational picture", "Front desk, workshop and management work from the same records."],
              ["03", "One place to ask why", "Premium Intelligence helps explain what the business data is saying."],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-6">
                <span className="font-data text-xs font-bold text-teal-700">{number}</span>
                <h2 className="mt-3 font-heading text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(20,184,166,0.08),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">The repair lifecycle</p>
            <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.035em] sm:text-5xl">One repair. One connected record.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">NOVATECH follows the job all the way through—not just until the technician says “done.”</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {lifecycle.map(([number, title, text]) => (
              <div key={number} className="bg-white p-6 transition hover:bg-[#f8faf9] sm:p-7">
                <div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-full bg-slate-950 font-data text-xs font-bold text-white">{number}</span><span className="text-xs font-bold text-slate-300">NOVATECH</span></div>
                <h3 className="mt-6 font-heading text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">The workspace</p>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Everything the shop needs. Connected.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">Not six separate tools. Not a notebook beside WhatsApp. A single system where operational records can feed financial records and business decisions.</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {modules.map(([title, subtitle, description, href], index) => (
            <Link href={href} key={title} className="nova-lift group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">0{index + 1}</span>
                  <h3 className="mt-3 font-heading text-2xl font-bold">{title}</h3>
                  <p className="mt-2 font-semibold text-slate-800">{subtitle}</p>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-teal-300 group-hover:text-teal-700">↗</span>
              </div>
              <div className="mt-7 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/3 rounded-full bg-teal-400 transition-all duration-500 group-hover:w-full" /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">See the product story</p>
              <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.035em] sm:text-5xl">The records stay connected as the repair moves.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">A part used on a repair should not disappear into a separate notebook. A payment should not live somewhere else. The owner should be able to trace the job from customer to money.</p>
              <div className="mt-8 space-y-4">
                {[
                  "Repair → engineer → parts used",
                  "Repair → invoice → payment → outstanding",
                  "Repair → cost → revenue → profit",
                ].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><span className="grid size-7 place-items-center rounded-full bg-teal-50 text-teal-700">✓</span>{item}</div>)}
              </div>
            </div>
            <ProductWindow label="Repair detail" title="Samsung Galaxy A54 · Screen replacement" rows={[["Assigned engineer", "Destiny", "Owner"], ["Parts used", "OLED screen", "Tracked"], ["Repair invoice", "₦17,000", "Issued"], ["Customer payment", "₦17,000", "Paid"]]} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductWindow label="Inventory + engineers" title="Parts accountability without guesswork" rows={[["Laptop × 7", "₦490,000", "Parts out"], ["Handfan × 1", "₦20,000", "Parts out"], ["Earpiece × 1", "₦2,000", "Parts out"], ["Engineer balance", "₦502,900", "Outstanding"]]} />
          <ProductWindow label="Management view" title="Numbers with context" rows={[["Today's sales", "₦2,000", "1 sale"], ["Open repairs", "Active", "Monitor"], ["Low stock", "Alerts", "Review"], ["Premium Intelligence", "Ask why", "Ready"]]} />
        </div>
      </section>

      <section id="intelligence" className="relative overflow-hidden border-y border-slate-200 bg-slate-950 text-white">
        <div className="absolute -right-40 top-1/2 size-[32rem] -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">Premium Intelligence</p>
              <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Don't just see the numbers. Ask why.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-400">Premium Intelligence works from the operational records already in NOVATECH. It can investigate patterns, compare periods, connect related records and clearly separate facts from assumptions.</p>
              <Link href="/assistant" className="mt-8 inline-flex rounded-xl bg-teal-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-teal-300">Explore Intelligence</Link>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:p-7">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Owner asks</p>
                <p className="mt-3 text-lg font-semibold">“Why are sales low today?”</p>
                <div className="mt-5 border-l border-teal-400/50 pl-4 text-sm leading-7 text-slate-300">
                  <p><span className="font-semibold text-white">Evidence:</span> today's recorded sales are ₦2,000 from 1 sale.</p>
                  <p className="mt-2"><span className="font-semibold text-white">Context:</span> the recent data contains several zero-sales days and one unusually large transaction that distorts simple averages.</p>
                  <p className="mt-2"><span className="font-semibold text-white">Conclusion:</span> sales are currently quiet, but the records do not prove a single cause yet.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><span className="text-xs text-slate-500">Revenue</span><strong className="mt-1 block text-sm">Connected</strong></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><span className="text-xs text-slate-500">Repairs</span><strong className="mt-1 block text-sm">Connected</strong></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><span className="text-xs text-slate-500">Accountability</span><strong className="mt-1 block text-sm">Connected</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Built for the people inside the shop</p>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Everyone sees the part of the operation they own.</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(([title, text]) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-heading text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></div>)}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#eef8f6]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Ready when your shop is</p><h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Stop asking where the record went. Start knowing what happened.</h2><p className="mt-3 text-base leading-7 text-slate-600">Bring repairs, stock, engineers, invoices, payments and management intelligence into one system.</p></div>
            <Link href="/login" className="nova-lift inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-7 py-4 text-sm font-bold text-white transition hover:bg-slate-800">Get started with NOVATECH →</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-5 py-10 text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div><Link href="/" aria-label="NOVATECH home"><NovatechLogo dark /></Link><p className="mt-3 max-w-sm text-xs leading-5 text-slate-500">Repair shop management software for the operation behind every repair.</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-3"><Link href="/login" className="hover:text-white">Sign in</Link><Link href="/help" className="hover:text-white">Help & Support</Link><Link href="/settings/subscription" className="hover:text-white">Subscription</Link></div>
        </div>
      </footer>
    </main>
  );
}
