import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin, MessageCircle, Phone } from "lucide-react";

const mapsUrl = "https://maps.app.goo.gl/9w9zwbcZ5SJWKxwr5";

export const metadata: Metadata = {
  title: "Phone Repair Checklist for Kubwa Customers | Amezing Limited",
  description:
    "A practical phone-repair checklist for customers in Kubwa, Abuja: what to prepare, what to ask before approving work and what to test when collecting your phone.",
  alternates: { canonical: "/phone-repair-guide" },
  robots: { index: true, follow: true },
};

const beforeVisit = [
  "Confirm the phone brand and exact model if you can.",
  "Write down the problem and when it started. Mention any drop, liquid exposure or previous repair.",
  "Back up important data while the phone still works and you can do so safely.",
  "Remove your SIM and memory card if practical. Do not share banking PINs, one-time passcodes or account passwords.",
];

const beforeApproval = [
  "Ask what the diagnosis suggests and whether more checking is needed.",
  "Ask what part or work is proposed, and whether the part is new, used or refurbished where that distinction applies.",
  "Agree on the expected price and timeline before authorizing the work.",
  "Ask what warranty or after-service support applies, if any, and request the terms clearly.",
];

const atCollection = [
  "Test the original fault where possible, such as charging, display response, speaker, microphone or buttons.",
  "Check any related function that matters to you before leaving the shop.",
  "Collect a receipt or written record showing the device, work carried out, amount paid and any agreed after-service terms.",
  "Ask for your SIM, memory card and any personal items back. Ask whether replaced parts can be returned where appropriate.",
];

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#c4d0c9]">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#e7b784]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PhoneRepairGuidePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex min-h-[72px] max-w-5xl items-center justify-between gap-4 px-5 sm:px-7">
          <Link href="/" className="font-heading text-lg font-bold tracking-tight">AMEZING</Link>
          <Link href="/contact" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]">
            Contact the shop
          </Link>
        </div>
      </header>

      <article className="px-5 py-14 sm:px-7 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#93a69c] hover:text-[#f4f1ea]">
            <ArrowLeft className="size-4" /> Back to Amezing
          </Link>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">
            Customer guide · Kubwa, Abuja
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Before you hand over your phone for repair
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-[#b4c2ba] sm:text-lg">
            Whether your phone will not charge, has a broken screen, drains quickly or has a software
            problem, a little preparation can make the repair conversation clearer. Use this checklist
            with any repair shop, including Amezing Limited at Central Market, Kubwa.
          </p>

          <section className="mt-10 rounded-2xl border border-white/10 bg-[#101f1a] p-6 sm:p-8">
            <p className="font-mono text-xs text-[#e7b784]">01 / BEFORE YOU VISIT</p>
            <h2 className="mt-3 font-heading text-2xl font-bold">Prepare the useful details</h2>
            <Checklist items={beforeVisit} />
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-[#101f1a] p-6 sm:p-8">
            <p className="font-mono text-xs text-[#e7b784]">02 / BEFORE YOU APPROVE WORK</p>
            <h2 className="mt-3 font-heading text-2xl font-bold">Understand what you are agreeing to</h2>
            <Checklist items={beforeApproval} />
            <p className="mt-5 text-sm leading-6 text-[#93a69c]">
              A symptom is not always the final diagnosis. For example, a phone that will not charge
              may have a cable, port, battery or board-related problem. Ask the technician to explain
              what has actually been checked instead of assuming a part must be replaced.
            </p>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-[#101f1a] p-6 sm:p-8">
            <p className="font-mono text-xs text-[#e7b784]">03 / WHEN YOU COLLECT IT</p>
            <h2 className="mt-3 font-heading text-2xl font-bold">Check the result and keep the record</h2>
            <Checklist items={atCollection} />
          </section>

          <section className="mt-5 rounded-2xl border border-[#c98a4f]/20 bg-[#101f1a] p-6 sm:p-8">
            <p className="font-mono text-xs text-[#e7b784]">NEED A LOCAL SHOP?</p>
            <h2 className="mt-3 font-heading text-2xl font-bold">Talk to Amezing Limited in Kubwa</h2>
            <p className="mt-3 text-sm leading-6 text-[#b4c2ba]">
              We are at Block A1, Shop 18, Central Market, Kubwa, Abuja. Message the exact phone
              model and describe the fault, or ask about a part before travelling so availability can
              be checked. Diagnosis, stock and repair timing depend on the device and the issue.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/2348035902087?text=Hello%20Amezing%20Limited%2C%20I%20need%20help%20with%20a%20phone%20repair.%20My%20phone%20model%20is%3A%20____.%20The%20problem%20is%3A%20____."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]"
              >
                <MessageCircle className="size-4" /> Describe your repair on WhatsApp
              </a>
              <a
                href="tel:+2348035902087"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold"
              >
                <Phone className="size-4" /> Call 0803 590 2087
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold"
              >
                <MapPin className="size-4" /> Directions
              </a>
            </div>
          </section>
        </div>
      </article>
          <FloatingWhatsApp />
    </main>
  );
}
