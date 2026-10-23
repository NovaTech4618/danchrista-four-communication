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
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://danchrista-four-communication.vercel.app";

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
    <main id="main-content" className="min-h-screen overflow-hidden bg-[#0B0D10] text-[#F0F3F7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />

      <div className="bg-[#1A2029] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Find us at Central Market, Kubwa <span className="mx-2 text-[#d7b76b]">•</span>
        Open daily, 9am–10pm
      </div>

      <header className="relative z-10 border-b border-[#F0F3F7]/10 bg-[#0B0D10]">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"
        >
          <Link href="/" aria-label="Amezing Limited home" className="shrink-0">
            <AmezingLogo />
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <Link href="/phone-repairs" className="text-sm font-medium text-[#A7B0BD] transition hover:text-[#1A2029]">Repairs</Link>
            <Link href="/phone-parts" className="text-sm font-medium text-[#A7B0BD] transition hover:text-[#1A2029]">Phone parts</Link>
            <Link href="/accessories" className="text-sm font-medium text-[#A7B0BD] transition hover:text-[#1A2029]">Accessories</Link>
            <Link href="/about" className="text-sm font-medium text-[#A7B0BD] transition hover:text-[#1A2029]">About</Link>
            <Link href="/contact" className="text-sm font-medium text-[#A7B0BD] transition hover:text-[#1A2029]">Contact</Link>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#8DAEFF] px-4 py-2.5 text-sm font-bold text-[#0B0D10] transition hover:bg-[#c0b092] sm:px-5"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>Chat with us</span>
          </a>
        </nav>
      </header>

      <section className="relative px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="pointer-events-none absolute -right-36 -top-28 h-[30rem] w-[30rem] rounded-full bg-[#23373b]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-36 bottom-0 h-72 w-72 rounded-full bg-[#1a3436]/45 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1A2029]/15 bg-[#15191F] px-3.5 py-2 text-xs font-semibold tracking-wide text-[#C8D0DA] shadow-sm">
              <span className="size-2 rounded-full bg-[#8DAEFF]" />
              PHONE REPAIRS · PARTS · ACCESSORIES
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#1A2029] sm:text-6xl lg:text-[4.25rem]">
              Phone trouble?
              <span className="mt-1 block text-[#8DAEFF]">Start with a real conversation.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#A7B0BD] sm:text-lg sm:leading-8">
              Whether your phone needs attention or you are looking for a particular part,
              Amezing Limited is here in Kubwa. Tell us what you need and we will help you
              work out the next step.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-[#1A2029] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#1A2029]/15 transition hover:-translate-y-0.5 hover:bg-[#2D3746]"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
                Ask about your phone
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#1A2029]/20 bg-[#15191F] px-7 py-4 text-sm font-bold text-[#1A2029] transition hover:bg-[#15191F]"
              >
                <MapPin className="size-4" aria-hidden="true" />
                Get directions
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#A7B0BD]">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#8DAEFF]" aria-hidden="true" />
                A physical shop in Kubwa
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 text-[#8DAEFF]" aria-hidden="true" />
                Open 9am–10pm daily
              </span>
            </div>
          </div>

          <div className="relative mx-auto min-h-[470px] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A2029] shadow-2xl shadow-[#1A2029]/20 sm:min-h-[560px]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2EILqoULTkdkQfG491ramrfzlPHRKmiA4ErLfnHsdAA&s=10')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080A0D]/95 via-[#080A0D]/75 to-[#080A0D]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0D]/65 via-transparent to-[#080A0D]/10" />

            <div className="relative flex min-h-[470px] flex-col justify-between p-6 sm:min-h-[560px] sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-xs">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8BEFF]">Find us in Kubwa</p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                    Right here at Central Market.
                  </h2>
                </div>
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-black/25 text-[#A8BEFF] backdrop-blur-sm">
                  <MapPin className="size-6" aria-hidden="true" />
                </div>
              </div>

              <div className="max-w-sm rounded-2xl border border-white/15 bg-[#080A0D]/70 p-5 backdrop-blur-md sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8BEFF]">Amezing Limited</p>
                <p className="mt-3 text-xl font-semibold leading-snug text-white sm:text-2xl">
                  Phone repairs, parts and accessories — close to the people we serve.
                </p>
                <p className="mt-3 text-sm leading-6 text-white/80">
                  Block A1, Shop 18, Central Market, Kubwa, Abuja.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#A8BEFF] px-5 py-3 text-sm font-bold text-[#0B0D10] transition hover:bg-[#A8BEFF]"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Chat with us
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15191F]/10"
                  >
                    <MapPin className="size-4" aria-hidden="true" />
                    Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#1A2029]/10 bg-[#15191F] px-5 py-6 sm:px-8">
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8DAEFF]">How can we help?</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#1A2029] sm:text-5xl">
                Start with what you need.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#A7B0BD]">
                Choose a service to learn more, or message us if you are not sure which category fits your issue.
              </p>
            </div>
            <Link href="/services" className="inline-flex items-center gap-2 text-sm font-bold text-[#8DAEFF] transition hover:gap-3">
              View all services <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {services.map(({ icon: Icon, number, title, text, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[250px] flex-col rounded-3xl border border-[#1A2029]/10 bg-[#15191F] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#8caf98] hover:shadow-xl hover:shadow-[#1A2029]/8 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-12 place-items-center rounded-2xl bg-[#1B222B] text-[#8DAEFF] transition group-hover:bg-[#1A2029] group-hover:text-white">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs text-[#8DAEFF]">{number}</span>
                </div>
                <h3 className="mt-7 text-xl font-semibold tracking-tight text-[#1A2029]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#A7B0BD]">{text}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[#8DAEFF]">
                  Explore service <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#12161C] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8DAEFF]">Simple next steps</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#1A2029] sm:text-5xl">
              Know what to do before you make the trip.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#A7B0BD]">
              A few details can help us understand your enquiry. For parts, the exact model matters because stock can change.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1A2029] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2D3746]"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Message Amezing
            </a>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4 rounded-2xl border border-[#1A2029]/10 bg-[#15191F]/80 p-5 sm:gap-6 sm:p-6">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1A2029] font-mono text-sm font-bold text-[#e8d39b]">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A2029] sm:text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#A7B0BD]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-[#1A2029] text-white shadow-xl shadow-[#1A2029]/10">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-14">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8DAEFF]">Ready to ask?</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
                  Tell us what is happening with your phone.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#b4c1c5] sm:text-base">
                  Send your phone model, describe the issue, and ask about the next step before visiting the shop.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#8DAEFF] px-6 py-3 text-sm font-bold text-[#0B0D10] transition hover:bg-[#e7cd8e]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp 0803 590 2087
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-[#15191F]/10"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  Find the shop
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1A2029]/10 bg-[#101318] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-block" aria-label="Amezing Limited home">
              <AmezingLogo />
            </Link>
            <p className="mt-3 max-w-md text-xs leading-5 text-[#A7B0BD]">
              Phone repairs, phone parts, accessories and software services in Kubwa, Abuja.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#A7B0BD]">
            <Link href="/phone-repairs" className="hover:text-[#1A2029]">Repairs</Link>
            <Link href="/phone-parts" className="hover:text-[#1A2029]">Parts</Link>
            <Link href="/accessories" className="hover:text-[#1A2029]">Accessories</Link>
            <Link href="/about" className="hover:text-[#1A2029]">About</Link>
            <Link href="/contact" className="hover:text-[#1A2029]">Contact</Link>
            <Link href="/login" className="hover:text-[#1A2029]">Staff sign in</Link>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-[#1A2029]/10 pt-5 text-xs text-[#8C96A5] sm:flex-row sm:items-center sm:justify-between">
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
      <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#dce9dc] text-[#8DAEFF]">
        <CheckCircle2 className="size-4" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-[#1A2029]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#A7B0BD]">{text}</p>
      </div>
    </div>
  );
}
