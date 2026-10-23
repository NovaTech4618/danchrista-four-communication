import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Cable,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Smartphone,
  Wrench,
} from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://amezing-limited.vercel.app";

const phoneNumber = "+2348035902087";
const whatsappUrl = "https://wa.me/2348035902087";
const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=Block+A1+Shop+18+Central+Market+Kubwa+Abuja";

export const metadata: Metadata = {
  title: "Amezing Limited | Phone Repairs in Kubwa, Abuja",
  description:
    "Need phone repair, a phone part or an accessory in Kubwa, Abuja? Contact Amezing Limited at Block A1, Shop 18, Central Market. Open daily, 9am–10pm.",
  keywords: [
    "Amezing Limited",
    "phone repair Kubwa",
    "phone repair Abuja",
    "phone parts Kubwa",
    "phone accessories Kubwa",
    "phone software service Abuja",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Amezing Limited | Phone Repairs in Kubwa, Abuja",
    description:
      "Phone repairs, parts, accessories and software services at Central Market, Kubwa. Contact us before you visit.",
    url: "/",
    siteName: "Amezing Limited",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amezing Limited | Kubwa, Abuja",
    description:
      "Phone repairs, parts, accessories and software services at Central Market, Kubwa.",
  },
};

const businessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Amezing Limited",
  url: siteUrl,
  telephone: phoneNumber,
  description:
    "Phone repairs, phone parts, accessories and software services at Block A1, Shop 18, Central Market, Kubwa, Abuja.",
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
    number: "01",
    title: "Phone repairs",
    text: "Tell us what is wrong with your phone and we can discuss the next step.",
    href: "/phone-repairs",
  },
  {
    icon: Smartphone,
    number: "02",
    title: "Phone parts",
    text: "Ask about parts for your exact phone model. Availability depends on current stock.",
    href: "/phone-parts",
  },
  {
    icon: Cable,
    number: "03",
    title: "Accessories",
    text: "Find everyday phone accessories, including cables, chargers and earphones.",
    href: "/accessories",
  },
  {
    icon: BatteryCharging,
    number: "04",
    title: "Software services",
    text: "Contact the shop with your software-related phone issue to find out what support is available.",
    href: "/services",
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us about your phone",
    text: "Send your phone model and describe the fault or part you need on WhatsApp.",
  },
  {
    number: "02",
    title: "Check the next step",
    text: "We can discuss your enquiry and check whether a requested part is available before you travel.",
  },
  {
    number: "03",
    title: "Visit the shop",
    text: "Come to Amezing Limited at Central Market, Kubwa, Abuja, during opening hours.",
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen overflow-hidden bg-[#f7f6f0] text-[#142c25]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />

      <div className="bg-[#123c30] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Find us at Central Market, Kubwa <span className="mx-2 text-[#d7b76b]">•</span>
        Open daily, 9am–10pm
      </div>

      <header className="relative z-10 border-b border-[#142c25]/10 bg-[#f7f6f0]">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"
        >
          <Link href="/" aria-label="Amezing Limited home" className="shrink-0">
            <AmezingLogo />
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <Link href="/phone-repairs" className="text-sm font-medium text-[#50655d] transition hover:text-[#123c30]">Repairs</Link>
            <Link href="/phone-parts" className="text-sm font-medium text-[#50655d] transition hover:text-[#123c30]">Phone parts</Link>
            <Link href="/accessories" className="text-sm font-medium text-[#50655d] transition hover:text-[#123c30]">Accessories</Link>
            <Link href="/about" className="text-sm font-medium text-[#50655d] transition hover:text-[#123c30]">About</Link>
            <Link href="/contact" className="text-sm font-medium text-[#50655d] transition hover:text-[#123c30]">Contact</Link>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#c9a45a] px-4 py-2.5 text-sm font-bold text-[#172a21] transition hover:bg-[#dbba75] sm:px-5"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>Chat with us</span>
          </a>
        </nav>
      </header>

      <section className="relative px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="pointer-events-none absolute -right-36 -top-28 h-[30rem] w-[30rem] rounded-full bg-[#e7d8b8]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-36 bottom-0 h-72 w-72 rounded-full bg-[#c9ded0]/45 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#123c30]/15 bg-white/70 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#31594a] shadow-sm">
              <span className="size-2 rounded-full bg-[#c9a45a]" />
              PHONE REPAIRS · PARTS · ACCESSORIES
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#123c30] sm:text-6xl lg:text-[4.25rem]">
              Phone trouble?
              <span className="mt-1 block text-[#9a7133]">Start with a real conversation.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#53675e] sm:text-lg sm:leading-8">
              Whether your phone needs attention or you are looking for a particular part,
              Amezing Limited is here in Kubwa. Tell us what you need and we will help you
              work out the next step.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-[#123c30] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#123c30]/15 transition hover:-translate-y-0.5 hover:bg-[#1b5140]"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
                Ask about your phone
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#123c30]/20 bg-white/70 px-7 py-4 text-sm font-bold text-[#123c30] transition hover:bg-white"
              >
                <MapPin className="size-4" aria-hidden="true" />
                Get directions
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#53675e]">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#387b5c]" aria-hidden="true" />
                A physical shop in Kubwa
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 text-[#387b5c]" aria-hidden="true" />
                Open 9am–10pm daily
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[550px]">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-[#d9e5d9] rotate-[-4deg]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#123c30] p-5 shadow-2xl shadow-[#123c30]/15 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8bc7c]">Amezing Limited</p>
                  <h2 className="mt-2 max-w-xs text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                    Let&apos;s figure out what your phone needs.
                  </h2>
                </div>
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#e5c982]">
                  <Smartphone className="size-6" aria-hidden="true" />
                </div>
              </div>

              <div className="relative mx-auto mt-7 max-w-[340px]">
                <div className="relative mx-auto h-[285px] w-[158px] rounded-[2rem] border-[5px] border-[#d8d8cd] bg-[#1c2924] p-2 shadow-[0_24px_45px_rgba(0,0,0,0.25)] rotate-[5deg]">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-[#d6b66e] via-[#8eb6a0] to-[#386b56] p-3">
                    <div className="mx-auto h-4 w-14 rounded-full bg-[#182b24]" />
                    <div className="mt-7 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#173c2e]/80">Device support</div>
                    <div className="mt-2 text-2xl font-semibold leading-[1.05] tracking-tight text-[#123c30]">Help for your everyday phone.</div>
                    <div className="mt-auto flex items-center justify-between rounded-xl border border-white/40 bg-white/35 p-2">
                      <Wrench className="size-4 text-[#123c30]" aria-hidden="true" />
                      <span className="text-[8px] font-bold text-[#123c30]">AMEZING LIMITED</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -left-6 bottom-5 flex items-center gap-3 rounded-2xl border border-white/70 bg-[#fbfaf5] p-3.5 shadow-xl sm:-left-10">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#e3eee3] text-[#245c43]">
                    <MapPin className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#183d30]">Visit our shop</p>
                    <p className="mt-0.5 text-[11px] text-[#66776e]">Central Market, Kubwa</p>
                  </div>
                </div>
                <div className="absolute -right-1 top-16 grid size-12 place-items-center rounded-2xl bg-[#d9b76a] text-[#183d30] shadow-lg sm:-right-4">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/15 pt-5">
                <div>
                  <p className="text-sm font-semibold text-white">Not sure where to start?</p>
                  <p className="mt-1 text-xs leading-5 text-[#c1d0c6]">Send your model and describe the problem.</p>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Ask Amezing Limited on WhatsApp"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-[#d5b86d] text-[#173c2e] transition hover:bg-[#e7cd8e]"
                >
                  <ArrowUpRight className="size-5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#123c30]/10 bg-white/70 px-5 py-6 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3 sm:gap-8">
          <TrustPoint title="A clear place to find us" text="Block A1, Shop 18, Central Market, Kubwa, Abuja." />
          <TrustPoint title="Ask before you travel" text="Message us with your phone model or part enquiry first." />
          <TrustPoint title="Talk to the shop directly" text="Call or WhatsApp 0803 590 2087 during opening hours." />
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7133]">How can we help?</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#123c30] sm:text-5xl">
                Start with what you need.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#53675e]">
                Choose a service to learn more, or message us if you are not sure which category fits your issue.
              </p>
            </div>
            <Link href="/services" className="inline-flex items-center gap-2 text-sm font-bold text-[#245c43] transition hover:gap-3">
              View all services <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {services.map(({ icon: Icon, number, title, text, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[250px] flex-col rounded-3xl border border-[#123c30]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#8caf98] hover:shadow-xl hover:shadow-[#123c30]/8 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-12 place-items-center rounded-2xl bg-[#eaf1e8] text-[#245c43] transition group-hover:bg-[#123c30] group-hover:text-white">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs text-[#9a7133]">{number}</span>
                </div>
                <h3 className="mt-7 text-xl font-semibold tracking-tight text-[#123c30]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#617168]">{text}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[#245c43]">
                  Explore service <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eaf0e8] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7133]">Simple next steps</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#123c30] sm:text-5xl">
              Know what to do before you make the trip.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#53675e]">
              A few details can help us understand your enquiry. For parts, the exact model matters because stock can change.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#123c30] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1b5140]"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Message Amezing
            </a>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4 rounded-2xl border border-[#123c30]/10 bg-white/80 p-5 sm:gap-6 sm:p-6">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#123c30] font-mono text-sm font-bold text-[#e8d39b]">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#123c30] sm:text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#617168]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-[#123c30] text-white shadow-xl shadow-[#123c30]/10">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-14">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8bc7c]">Ready to ask?</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
                  Tell us what is happening with your phone.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#c1d0c6] sm:text-base">
                  Send your phone model, describe the issue, and ask about the next step before visiting the shop.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d5b86d] px-6 py-3 text-sm font-bold text-[#173c2e] transition hover:bg-[#e7cd8e]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp 0803 590 2087
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  Find the shop
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#123c30]/10 bg-[#f0f0e8] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-block" aria-label="Amezing Limited home">
              <AmezingLogo />
            </Link>
            <p className="mt-3 max-w-md text-xs leading-5 text-[#617168]">
              Phone repairs, phone parts, accessories and software services in Kubwa, Abuja.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#53675e]">
            <Link href="/phone-repairs" className="hover:text-[#123c30]">Repairs</Link>
            <Link href="/phone-parts" className="hover:text-[#123c30]">Parts</Link>
            <Link href="/accessories" className="hover:text-[#123c30]">Accessories</Link>
            <Link href="/about" className="hover:text-[#123c30]">About</Link>
            <Link href="/contact" className="hover:text-[#123c30]">Contact</Link>
            <Link href="/login" className="hover:text-[#123c30]">Staff sign in</Link>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-[#123c30]/10 pt-5 text-xs text-[#758178] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Amezing Limited</span>
          <span>Block A1, Shop 18, Central Market, Kubwa, Abuja</span>
        </div>
      </footer>
    </main>
  );
}

function TrustPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#dce9dc] text-[#245c43]">
        <CheckCircle2 className="size-4" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-[#123c30]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#617168]">{text}</p>
      </div>
    </div>
  );
}
