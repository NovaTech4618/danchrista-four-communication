import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, MessageCircle, Phone, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Amezing Limited | Kubwa, Abuja",
  description:
    "Contact Amezing Limited in Central Market, Kubwa, Abuja for phone repairs, phone parts, accessories and software services.",
  alternates: { canonical: "/contact" },
  keywords: [
      "Amezing Limited",
      "Amezing Limited Kubwa",
      "contact phone repair Kubwa",
      "phone repair Kubwa",
      "phone parts Kubwa",
      "phone accessories Kubwa",
      "Central Market Kubwa"
  ],
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-5 px-5 sm:px-7">
          <Link href="/" className="font-heading text-lg font-bold">AMEZING</Link>
          <Link href="/services" className="text-sm text-[#93a69c] hover:text-[#f4f1ea]">Services</Link>
        </div>
      </header>

      <section className="px-5 py-16 sm:px-7 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">Contact</p>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Need a repair, part or accessory?
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#93a69c] sm:text-lg">
            Message or call before you visit. For phone parts, send the exact model and part name so current stock can be checked.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <a
              href="https://wa.me/2348035902087"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-[#c98a4f]/20 bg-[#101f1a] p-7 transition hover:bg-[#14251f]"
            >
              <MessageCircle className="size-6 text-[#e7b784]" />
              <h2 className="mt-4 font-heading text-2xl font-bold">WhatsApp</h2>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">0803 590 2087</p>
              <p className="mt-4 text-xs font-semibold text-[#e7b784]">Start a chat →</p>
            </a>

            <a
              href="tel:+2348035902087"
              className="rounded-2xl border border-white/10 bg-[#101f1a] p-7 transition hover:bg-[#14251f]"
            >
              <Phone className="size-6 text-[#e7b784]" />
              <h2 className="mt-4 font-heading text-2xl font-bold">Call</h2>
              <p className="mt-2 text-sm leading-6 text-[#93a69c]">0803 590 2087</p>
              <p className="mt-4 text-xs font-semibold text-[#e7b784]">Call the shop →</p>
            </a>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Central+Market+Kubwa+Abuja"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-[#101f1a] p-6 transition hover:bg-[#14251f]"
            >
              <MapPin className="size-5 text-[#e7b784]" />
              <h2 className="mt-4 text-sm font-bold">Location</h2>
              <p className="mt-1 text-sm leading-6 text-[#93a69c]">Central Market, Kubwa, Abuja</p>
              <p className="mt-3 text-xs text-[#e7b784]">Open in Maps →</p>
            </a>

            <div className="rounded-xl border border-white/10 bg-[#101f1a] p-6">
              <Clock3 className="size-5 text-[#e7b784]" />
              <h2 className="mt-4 text-sm font-bold">Opening hours</h2>
              <p className="mt-1 text-sm leading-6 text-[#93a69c]">Every day · 9am to 10pm</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#101f1a] p-6">
              <Wrench className="size-5 text-[#e7b784]" />
              <h2 className="mt-4 text-sm font-bold">For repair enquiries</h2>
              <p className="mt-1 text-sm leading-6 text-[#93a69c]">Send the phone model and describe the problem.</p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-[#101f1a] p-7">
            <h2 className="font-heading text-2xl font-bold">For phone parts</h2>
            <p className="mt-3 text-sm leading-6 text-[#93a69c]">
              Send the exact phone model and the part you need. Examples: “Tecno Spark 10 charging flex” or “iPhone 11 earpiece flex.” Availability depends on current stock.
            </p>
            <a
              href="https://wa.me/2348035902087"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]"
            >
              <MessageCircle className="size-4" /> Send a WhatsApp enquiry
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold text-[#e7b784]">
              <ArrowLeft className="size-4" /> Back home
            </Link>
            <Link href="/phone-parts" className="font-semibold text-[#e7b784]">Browse phone parts →</Link>
            <Link href="/phone-repairs" className="font-semibold text-[#e7b784]">Browse repairs →</Link>
          </div>

          <p className="mt-10 text-xs leading-5 text-[#5c6b64]">
            Social-media pages are not listed yet because no official account details have been provided.
          </p>
        </div>
      </section>
    </main>
  );
}
