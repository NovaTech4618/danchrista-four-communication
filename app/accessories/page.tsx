import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BatteryCharging, Cable, Headphones, Package, ShieldCheck, Speaker } from "lucide-react";

export const metadata: Metadata = {
  title: "Phone Accessories | Amezing Limited",
  description: "Phone accessories from Amezing Limited, including chargers, cables, earphones, screen protectors, power banks and speakers.",
  alternates: { canonical: "/accessories" },
  robots: { index: true, follow: true },
};

const items = [
  ["Chargers", "Everyday charging accessories for compatible devices.", BatteryCharging],
  ["Cables", "Charging and data cables in common connector types.", Cable],
  ["Earphones & Headsets", "Audio accessories for calls, music and everyday use.", Headphones],
  ["Screen Protectors", "Protective accessories for phone displays.", ShieldCheck],
  ["Power Banks", "Portable power for phones and other compatible devices.", Package],
  ["Speakers", "Portable audio accessories for home and everyday use.", Speaker],
];

export default function AccessoriesPage() {
  return <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
    <header className="border-b border-white/10"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7"><Link href="/" className="font-heading text-lg font-bold">AMEZING</Link><Link href="/login" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]">Sign in</Link></div></header>
    <section className="px-5 py-16 sm:px-7 sm:py-24"><div className="mx-auto max-w-6xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">Accessories</p>
      <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Useful accessories for everyday phone use.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[#93a69c] sm:text-lg">From charging essentials to audio and protection, Amezing offers practical phone accessories based on current stock.</p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(([title,text,Icon]) => <article key={title as string} className="rounded-2xl border border-white/10 bg-[#101f1a] p-6"><Icon className="size-6 text-[#e7b784]" /><h2 className="mt-5 font-heading text-xl font-bold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[#93a69c]">{text as string}</p></article>)}</div>
      <Link href="/contact" className="mt-10 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]">Ask about availability <ArrowRight className="size-4" /></Link>
    </div></section>
  </main>;
}
