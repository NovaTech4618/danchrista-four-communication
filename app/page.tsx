import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HandCoins, Package, ShoppingCart, Wrench } from "lucide-react";
import { DanchristaLogo } from "@/components/brand/DanchristaLogo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://danchrista-four-communication.vercel.app";

export const metadata: Metadata = {
  title: "Danchrista Four Communication | Phone Repairs, Parts & Shop Management",
  description:
    "Danchrista Four Communication keeps phone repairs, phone parts, accessories, sales and daily business records organized in one place.",
  keywords: [
    "Danchrista Four Communication",
    "phone repair",
    "phone parts",
    "phone accessories",
    "phone repairs",
    "shop management",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Danchrista Four Communication",
    description:
      "Phone repairs, phone parts, accessories, sales and organized daily shop records.",
    url: "/",
    siteName: "Danchrista Four Communication",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Danchrista Four Communication",
    description:
      "Phone repairs, phone parts, accessories, sales and organized daily shop records.",
  },
};

const modules = [
  ["Sales", "Fast walk-in sales."],
  ["Inventory", "Accessories and phone parts."],
  ["Repairs", "Phones received and repaired."],
  ["Debit", "People who owe Danchrista."],
  ["Credit", "People Danchrista owes."],
  ["Owner view", "The shop picture at a glance."],
] as const;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Danchrista Four Communication",
  url: siteUrl,
  description:
    "Phone repairs, phone parts, accessories, sales and organized daily business records.",
};

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <nav className="border-b border-white/10 bg-[#0b1512]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7">
          <Link href="/" aria-label="Danchrista home">
            <DanchristaLogo />
          </Link>
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/phone-repairs" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Repairs</Link>
            <Link href="/phone-parts" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Parts</Link>
            <Link href="/accessories" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Accessories</Link>
            <Link href="/services" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Services</Link>
            <Link href="/contact" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Contact</Link>
          </div>
          <Link href="/login" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]">Sign in</Link>
        </div>
      </nav>

      <section className="px-5 pb-20 pt-16 sm:px-7 sm:pt-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">
              Phone repairs · Parts · Accessories · Shop records
            </p>
            <h1 className="mt-4 max-w-2xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
              Danchrista should not have to remember everything.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#93a69c] sm:text-lg">
              One clean place for phone repairs, phone parts, accessories, sales, stock,
              debit, credit and daily shop records.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-6 py-3.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]"
            >
              Enter Danchrista <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101f1a] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7b784]">
              Daily shop picture
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Preview icon={ShoppingCart} title="Sales" text="Record what was sold" />
              <Preview icon={Package} title="Stock" text="See what is low" />
              <Preview icon={Wrench} title="Repairs" text="Know what is happening" />
              <Preview icon={HandCoins} title="Accounts" text="Know who owes whom" />
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-[#6b7d74]">The owner should be able to answer:</p>
              <p className="mt-2 font-heading text-lg font-bold text-[#f4f1ea]">
                What sold · What is low · Who owes us · Who we owe
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101f1a] px-5 py-20 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7b784]">
            The shop records
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Everything stays simple.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(([title, text]) => (
              <article key={title} className="bg-[#101f1a] p-6 transition hover:bg-[#14251f]">
                <h3 className="font-heading text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#93a69c]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-7">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[#c98a4f]/15 bg-[#101f1a] px-7 py-12 sm:px-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7b784]">Danchrista</p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Simple for the worker. Clear for the owner.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#93a69c]">
            Record what happened in the shop. Keep the business picture in one place.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-6 py-3.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]"
          >
            Sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-10 sm:px-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><span className="font-semibold text-[#f4f1ea]">Danchrista Four Communication</span><span className="ml-3 text-xs text-[#5c6b64]">Phone repairs · Parts · Accessories</span></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6b7d74]">
            <Link href="/about" className="hover:text-[#e7b784]">About</Link><Link href="/services" className="hover:text-[#e7b784]">Services</Link><Link href="/contact" className="hover:text-[#e7b784]">Contact</Link><Link href="/login" className="hover:text-[#e7b784]">Staff sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Preview({ icon: Icon, title, text }: { icon: typeof ShoppingCart; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <Icon className="size-5 text-[#e7b784]" />
      <p className="mt-4 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-[#6b7d74]">{text}</p>
    </div>
  );
}
