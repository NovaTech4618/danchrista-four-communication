import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BatteryCharging, Cable, Clock3, MapPin, MessageCircle, Package, Smartphone, Wrench } from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://danchrista-four-communication.vercel.app";

const mapsUrl = "https://maps.app.goo.gl/9w9zwbcZ5SJWKxwr5";

const mapsUrl = "https://maps.app.goo.gl/9w9zwbcZ5SJWKxwr5";

export const metadata: Metadata = {
  title: "Amezing Limited | Phone Repairs, Parts & Accessories in Kubwa",
  description:
    "Amezing Limited in Block A1, Shop 18, Central Market, Kubwa, Abuja offers phone repairs, phone parts, accessories and software services. Open daily from 9am to 10pm.",
  keywords: [
    "Amezing Limited",
    "phone repair Kubwa",
    "phone parts Kubwa",
    "phone accessories Kubwa",
    "phone repair Abuja",
    "phone parts Abuja",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Amezing Limited | Kubwa, Abuja",
    description:
      "Phone repairs, phone parts, accessories and software services in Block A1, Shop 18, Central Market, Kubwa, Abuja.",
    url: "/",
    siteName: "Amezing Limited",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Amezing Limited | Kubwa, Abuja",
    description:
      "Phone repairs, phone parts, accessories and software services in Block A1, Shop 18, Central Market, Kubwa, Abuja.",
  },
};

const businessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Amezing Limited",
  url: siteUrl,
  telephone: "+2348035902087",
  description:
    "Phone repairs, phone parts, accessories and software services in Block A1, Shop 18, Central Market, Kubwa, Abuja.",
  serviceType: [
    "Mobile phone repair",
    "Phone parts",
    "Phone accessories",
    "Phone software service",
  ],
  hasMap: mapsUrl,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Block A1, Shop 18, Central Market",
    addressLocality: "Kubwa",
    addressRegion: "FCT",
    addressCountry: "NG",
  },
  openingHours: "Mo-Su 09:00-22:00",
  areaServed: ["Kubwa", "Abuja"],
};

const services = [
  {
    icon: Wrench,
    title: "Phone Repairs",
    text: "Screen, battery, charging and other practical phone repairs.",
    href: "/phone-repairs",
  },
  {
    icon: Smartphone,
    title: "Phone Parts",
    text: "Phone parts such as downboards, flexes and back glass, subject to stock.",
    href: "/phone-parts",
  },
  {
    icon: Cable,
    title: "Accessories",
    text: "Chargers, cables, earphones, screen protectors and more.",
    href: "/accessories",
  },
  {
    icon: BatteryCharging,
    title: "Software Services",
    text: "Software-related phone service and support.",
    href: "/services",
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />

      <nav className="border-b border-white/10 bg-[#0b1512]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-5 px-5 sm:px-7">
          <Link href="/" aria-label="Amezing home">
            <AmezingLogo />
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            <Link href="/phone-repairs" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Repairs</Link>
            <Link href="/phone-parts" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Parts</Link>
            <Link href="/accessories" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Accessories</Link>
            <Link href="/services" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Services</Link>
            <Link href="/about" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">About</Link>
            <Link href="/contact" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Contact</Link>
          </div>

          <Link href="/contact" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]">
            Contact us
          </Link>
        </div>
      </nav>

      <section className="px-5 pb-20 pt-16 sm:px-7 sm:pt-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">
              Phone repairs · Parts · Accessories · Kubwa, Abuja
            </p>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
              Your phone. Fixed, supplied and supported.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#93a69c] sm:text-lg">
              Amezing Limited serves customers from Block A1, Shop 18, Central Market, Kubwa,
              with practical phone repairs, phone parts, accessories and software services.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/2348035902087"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c98a4f] px-6 py-3.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]"
              >
                <MessageCircle className="size-4" /> WhatsApp us
              </a>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-6 py-3.5 text-sm font-semibold text-[#f4f1ea] transition hover:bg-white/5"
              >
                View services <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
              <Info icon={MapPin} text="Block A1, Shop 18, Central Market, Kubwa" />
              <Info icon={Clock3} text="9am – 10pm daily" />
              <Info icon={MessageCircle} text="0803 590 2087" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101f1a] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7b784]">
              What we do
            </p>
            <div className="mt-5 grid gap-3">
              {services.map(({ icon: Icon, title, text, href }) => (
                <Link
                  key={title}
                  href={href}
                  className="group rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08]"
                >
                  <div className="flex items-start gap-4">
                    <Icon className="mt-0.5 size-5 shrink-0 text-[#e7b784]" />
                    <div>
                      <p className="text-sm font-bold group-hover:text-[#e7b784]">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6b7d74]">{text}</p>
                    </div>
                    <ArrowRight className="ml-auto mt-1 size-4 text-[#5c6b64] transition group-hover:translate-x-1 group-hover:text-[#e7b784]" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[#c98a4f]/15 bg-[#c98a4f]/5 p-4">
              <p className="text-xs text-[#6b7d74]">Need a specific part?</p>
              <p className="mt-1 text-sm font-semibold">Send the exact phone model on WhatsApp and we can check what you need.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 px-5 py-16 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7b784]">
            A clear repair conversation
          </p>
          <h2 className="mt-2 max-w-3xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Know what to ask before approving a phone repair.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#93a69c]">
            A phone problem can have more than one cause. Share the model and symptoms, ask what needs
            to be done, and discuss the expected cost and timing before deciding how to proceed.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-white/10 bg-[#101f1a] p-5">
              <p className="font-mono text-xs text-[#e7b784]">01 / Explain</p>
              <h3 className="mt-3 font-heading text-lg font-bold">Tell us what happened</h3>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">
                Share the phone model, the fault and whether the phone was dropped, exposed to liquid or repaired before.
              </p>
            </article>
            <article className="rounded-xl border border-white/10 bg-[#101f1a] p-5">
              <p className="font-mono text-xs text-[#e7b784]">02 / Agree</p>
              <h3 className="mt-3 font-heading text-lg font-bold">Understand the job</h3>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">
                Ask about the diagnosis, part needed, expected cost and estimated timeline before approving the work.
              </p>
            </article>
            <article className="rounded-xl border border-white/10 bg-[#101f1a] p-5">
              <p className="font-mono text-xs text-[#e7b784]">03 / Check</p>
              <h3 className="mt-3 font-heading text-lg font-bold">Test before leaving</h3>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">
                When collecting the phone, check the issue that brought you in and any related functions you can safely test.
              </p>
            </article>
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[#c98a4f]/20 bg-[#101f1a] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">A simple checklist for customers</h3>
              <p className="mt-1 text-sm leading-6 text-[#93a69c]">
                Backing up data, explaining symptoms and asking the right questions can make a repair visit clearer.
              </p>
            </div>
            <Link href="/phone-repair-guide" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#e7b784] hover:text-[#f4f1ea]">
              Read the repair guide <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 px-5 py-16 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7b784]">A clear repair conversation</p>
          <h2 className="mt-2 max-w-3xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Know what to ask before approving a phone repair.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#93a69c]">
            A phone problem can have more than one cause. Share the model and symptoms, ask what needs
            to be done, and discuss the expected cost and timing before deciding how to proceed.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-white/10 bg-[#101f1a] p-5">
              <p className="font-mono text-xs text-[#e7b784]">01 / EXPLAIN</p>
              <h3 className="mt-3 font-heading text-lg font-bold">Tell us what happened</h3>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">
                Share the phone model, the fault and whether the phone was dropped, exposed to liquid or repaired before.
              </p>
            </article>
            <article className="rounded-xl border border-white/10 bg-[#101f1a] p-5">
              <p className="font-mono text-xs text-[#e7b784]">02 / AGREE</p>
              <h3 className="mt-3 font-heading text-lg font-bold">Understand the job</h3>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">
                Ask about the diagnosis, part needed, expected cost and estimated timeline before approving the work.
              </p>
            </article>
            <article className="rounded-xl border border-white/10 bg-[#101f1a] p-5">
              <p className="font-mono text-xs text-[#e7b784]">03 / CHECK</p>
              <h3 className="mt-3 font-heading text-lg font-bold">Test before leaving</h3>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">
                When collecting the phone, check the issue that brought you in and any related functions you can safely test.
              </p>
            </article>
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[#c98a4f]/20 bg-[#101f1a] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">A simple checklist for customers</h3>
              <p className="mt-1 text-sm leading-6 text-[#93a69c]">
                Backing up data, explaining symptoms and asking the right questions can make a repair visit clearer.
              </p>
            </div>
            <Link href="/phone-repair-guide" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#e7b784] hover:text-[#f4f1ea]">
              Read the repair guide <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101f1a] px-5 py-20 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7b784]">
              Visit or contact us
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Come to the shop or message before you visit.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#93a69c]">
              Stock changes, especially for phone parts. For a part enquiry, send the exact
              model and part name so availability can be checked before you make the trip.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <DetailCard title="Location" text="Block A1, Shop 18, Central Market, Kubwa, Abuja" href={mapsUrl} />
            <DetailCard title="Opening hours" text="Every day · 9am to 10pm" />
            <DetailCard title="WhatsApp / Phone" text="0803 590 2087" href="https://wa.me/2348035902087" />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-10 sm:px-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-semibold text-[#f4f1ea]">Amezing Limited</span>
            <span className="ml-3 text-xs text-[#5c6b64]">Kubwa, Abuja · Phone repairs · Parts · Accessories</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6b7d74]">
            <Link href="/about" className="hover:text-[#e7b784]">About</Link>
            <Link href="/services" className="hover:text-[#e7b784]">Services</Link>
            <Link href="/contact" className="hover:text-[#e7b784]">Contact</Link>
            <Link href="/login" className="hover:text-[#e7b784]">Staff sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Info({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[#93a69c]">
      <Icon className="size-4 shrink-0 text-[#e7b784]" />
      <span>{text}</span>
    </div>
  );
}

function DetailCard({ title, text, href }: { title: string; text: string; href?: string }) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.12em] text-[#6b7d74]">{title}</p>
      <p className="mt-2 text-sm font-semibold text-[#f4f1ea]">{text}</p>
      {href ? <p className="mt-2 text-xs text-[#e7b784]">Open link →</p> : null}
    </>
  );

  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-[#0b1512] p-5 transition hover:bg-[#14251f]">
      {content}
    </a>
  ) : (
    <div className="rounded-xl border border-white/10 bg-[#0b1512] p-5">{content}</div>
  );
}
