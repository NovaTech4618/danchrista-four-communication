import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDollarSign, PackageCheck, Smartphone, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Services | Amezing Limited",
  description: "Explore phone repair, software service, phone parts, accessories and shop support from Amezing Limited.",
  alternates: { canonical: "/services" },
  robots: { index: true, follow: true },
};

const services = [
  ["Phone Repair", "Assessment and repair of common phone hardware problems.", Smartphone],
  ["Software Service", "Software-related troubleshooting and phone servicing.", Wrench],
  ["Phone Parts", "Replacement parts for repair work, subject to model and current stock.", PackageCheck],
  ["Accessories", "Chargers, cables, audio accessories, protection and other useful gadgets.", CircleDollarSign],
];

export default function ServicesPage() {
  return <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
    <header className="border-b border-white/10"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7"><Link href="/" className="font-heading text-lg font-bold">DANCHRISTA</Link><Link href="/login" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]">Sign in</Link></div></header>
    <section className="px-5 py-16 sm:px-7 sm:py-24"><div className="mx-auto max-w-6xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">What Amezing does</p>
      <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Repairs, parts and accessories in one place.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[#93a69c] sm:text-lg">A straightforward service experience for customers and a clear record of work for the business.</p>
      <div className="mt-12 grid gap-4 md:grid-cols-2">{services.map(([title,text,Icon]) => <article key={title as string} className="rounded-2xl border border-white/10 bg-[#101f1a] p-7"><Icon className="size-6 text-[#e7b784]" /><h2 className="mt-5 font-heading text-2xl font-bold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">{text as string}</p></article>)}</div>
      <div className="mt-12 rounded-2xl border border-white/10 bg-[#101f1a] p-7"><h2 className="font-heading text-2xl font-bold">Need help with something specific?</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">Contact Amezing with the phone model, the problem or the item you need so availability can be checked.</p><Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]">Contact us <ArrowRight className="size-4" /></Link></div>
    </div></section>
  </main>;
}
