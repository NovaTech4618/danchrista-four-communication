import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, Handshake, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Amezing Limited",
  description: "Learn about Amezing Limited, a phone repair, phone parts and accessories business at Central Market, Kubwa, Abuja.",
  alternates: { canonical: "/about" },
  keywords: [
      "Amezing Limited",
      "Amezing Limited Kubwa",
      "phone repair business Kubwa",
      "phone parts Kubwa",
      "phone accessories Kubwa"
  ],
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
    <header className="border-b border-white/10">
      <div className="mx-auto flex min-h-[72px] max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-7">
        <Link href="/" aria-label="Amezing Limited home" className="font-heading text-lg font-bold tracking-tight">AMEZING</Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#c0cec6]">
          <Link href="/phone-repairs" className="hover:text-white">Repairs</Link>
          <Link href="/phone-parts" className="hover:text-white">Phone parts</Link>
          <Link href="/accessories" className="hover:text-white">Accessories</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/contact" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 font-semibold text-[#1a1008] hover:bg-[#e7b784]">Contact us</Link>
        </nav>
      </div>
    </header>
    <section className="px-5 py-16 sm:px-7 sm:py-24"><div className="mx-auto max-w-4xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">About Amezing</p>
      <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">A phone business built around practical service.</h1>
      <p className="mt-6 text-base leading-7 text-[#93a69c] sm:text-lg">Amezing Limited combines phone repair work, phone parts, accessories and organized daily business records. The goal is straightforward: make it easier to serve customers and easier to know what is happening in the shop.</p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[["Clear records","Work, sales and stock should be recorded so important details do not depend on memory.",ClipboardList],["Customer service","Good service starts with understanding the customer's device and the problem.",Handshake],["Responsible operations","The business system is designed to keep financial and stock records organized.",ShieldCheck]].map(([title,text,Icon]) => <article key={title as string} className="rounded-2xl border border-white/10 bg-[#101f1a] p-6"><Icon className="size-6 text-[#e7b784]" /><h2 className="mt-5 font-heading text-xl font-bold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">{text as string}</p></article>)}
      </div>
      <Link href="/services" className="mt-10 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]">Explore services <ArrowRight className="size-4" /></Link>
    </div></section>
  </main>;
}
