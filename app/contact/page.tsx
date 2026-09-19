import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Danchrista Four Communication",
  description: "Contact Danchrista Four Communication about phone repairs, phone parts, accessories and service availability.",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
    <header className="border-b border-white/10"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7"><Link href="/" className="font-heading text-lg font-bold">DANCHRISTA</Link><Link href="/login" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]">Sign in</Link></div></header>
    <section className="px-5 py-16 sm:px-7 sm:py-24"><div className="mx-auto max-w-4xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">Contact</p>
      <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Tell us what you need.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[#93a69c] sm:text-lg">For a repair, part or accessory enquiry, send the phone model and what you need. We can confirm the next step and current availability.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#101f1a] p-7"><MessageCircle className="size-6 text-[#e7b784]" /><h2 className="mt-4 font-heading text-2xl font-bold">Ask about a repair</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">Share the device model and the problem it is having.</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#101f1a] p-7"><Wrench className="size-6 text-[#e7b784]" /><h2 className="mt-4 font-heading text-2xl font-bold">Ask about a part</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">Share the exact model and part name. Availability depends on current stock.</p></div>
      </div>
      <div className="mt-10 rounded-2xl border border-[#c98a4f]/20 bg-[#101f1a] p-7">
        <h2 className="font-heading text-2xl font-bold">Shop details</h2>
        <p className="mt-3 text-sm leading-6 text-[#93a69c]">Contact details, location and opening hours should be confirmed with Danchrista before they are published here. We do not publish unverified business information.</p>
      </div>
      <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#e7b784]"><ArrowLeft className="size-4" /> Back home</Link>
    </div></section>
  </main>;
}
