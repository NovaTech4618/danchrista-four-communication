import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, Handshake, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Danchrista Four Communication",
  description: "Learn about Danchrista Four Communication and its focus on phone repairs, parts, accessories and organized business service.",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
    <header className="border-b border-white/10"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7"><Link href="/" className="font-heading text-lg font-bold">DANCHRISTA</Link><Link href="/login" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]">Sign in</Link></div></header>
    <section className="px-5 py-16 sm:px-7 sm:py-24"><div className="mx-auto max-w-4xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">About Danchrista</p>
      <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">A phone business built around practical service.</h1>
      <p className="mt-6 text-base leading-7 text-[#93a69c] sm:text-lg">Danchrista Four Communication combines phone repair work, phone parts, accessories and organized daily business records. The goal is straightforward: make it easier to serve customers and easier to know what is happening in the shop.</p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[["Clear records","Work, sales and stock should be recorded so important details do not depend on memory.",ClipboardList],["Customer service","Good service starts with understanding the customer's device and the problem.",Handshake],["Responsible operations","The business system is designed to keep financial and stock records organized.",ShieldCheck]].map(([title,text,Icon]) => <article key={title as string} className="rounded-2xl border border-white/10 bg-[#101f1a] p-6"><Icon className="size-6 text-[#e7b784]" /><h2 className="mt-5 font-heading text-xl font-bold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">{text as string}</p></article>)}
      </div>
      <Link href="/services" className="mt-10 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]">Explore services <ArrowRight className="size-4" /></Link>
    </div></section>
  </main>;
}
