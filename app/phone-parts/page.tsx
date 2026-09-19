import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, Package, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Phone Parts | Amezing Limited",
  description: "Phone parts and replacement components from Amezing Limited, including charging flexes, downboards, back glass and other repair parts.",
  alternates: { canonical: "/phone-parts" },
  robots: { index: true, follow: true },
};

const categories = [
  ["Downboards", "Replacement charging and lower-board components for supported phone models."],
  ["Charging Flex", "Charging flexes and related replacement components."],
  ["Power Flex", "Power and button-related flex components where available."],
  ["Earpiece Flex", "Earpiece and upper-flex replacement parts for supported models."],
  ["Back Glass", "Replacement back-glass components for selected phones."],
  ["Other Phone Parts", "Additional repair components stocked according to customer and technician demand."],
];

export default function PhonePartsPage() {
  return <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
    <header className="border-b border-white/10"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7"><Link href="/" className="font-heading text-lg font-bold">DANCHRISTA</Link><Link href="/login" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]">Sign in</Link></div></header>
    <section className="px-5 py-16 sm:px-7 sm:py-24"><div className="mx-auto max-w-6xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">Phone parts</p>
      <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">The repair part matters as much as the repair.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[#93a69c] sm:text-lg">Amezing keeps phone replacement parts organized by type and model so technicians can find what they need and customers can get repairs moving.</p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(([title, text]) => <article key={title} className="rounded-2xl border border-white/10 bg-[#101f1a] p-6"><Package className="size-6 text-[#e7b784]" /><h2 className="mt-5 font-heading text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">{text}</p></article>)}
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#101f1a] p-7"><Search className="size-6 text-[#e7b784]" /><h2 className="mt-4 font-heading text-2xl font-bold">Find the right model</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">Parts are most useful when the phone model is clear. Tell us the exact model or bring the phone in for identification.</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#101f1a] p-7"><Cpu className="size-6 text-[#e7b784]" /><h2 className="mt-4 font-heading text-2xl font-bold">Parts for repair work</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">Stock can support common Android brands and iPhone-related repair parts, subject to current availability.</p></div>
      </div>
      <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]">Ask about a part <ArrowRight className="size-4" /></Link>
    </div></section>
  </main>;
}
