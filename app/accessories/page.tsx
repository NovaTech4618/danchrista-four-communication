import type { Metadata } from "next";
import Link from "next/link";
import { BatteryCharging, Cable, Headphones, MapPin, MessageCircle, Package, ShieldCheck, Speaker } from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

export const metadata: Metadata = {
  title: "Phone Accessories in Kubwa, Abuja",
  description: "Ask Amezing Limited about phone chargers, cables, earphones, screen protectors, power banks and speakers at Central Market, Kubwa. Availability depends on current stock.",
  alternates: { canonical: "/accessories" },
  robots: { index: true, follow: true },
};
const items = [
  { title: "Chargers", text: "Charging accessories for compatible devices.", Icon: BatteryCharging },
  { title: "Cables", text: "Charging and data cables in common connector types.", Icon: Cable },
  { title: "Earphones and headsets", text: "Audio accessories for calls, music and everyday use.", Icon: Headphones },
  { title: "Screen protectors", text: "Protective accessories for phone displays.", Icon: ShieldCheck },
  { title: "Power banks", text: "Portable power for phones and compatible devices.", Icon: Package },
  { title: "Speakers", text: "Portable audio accessories for everyday listening.", Icon: Speaker },
];
const whatsapp = "https://wa.me/2348035902087";
const maps = "https://www.google.com/maps/search/?api=1&query=Block+A1+Shop+18+Central+Market+Kubwa+Abuja";

export default function AccessoriesPage() {
 return <main id="main-content" className="min-h-screen bg-[#0b1114] text-[#e7eef0]">
  <div className="bg-[#14252b] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">Amezing Limited · Central Market, Kubwa · Open daily, 9am–10pm</div>
  <header className="border-b border-[#e7eef0]/10"><nav aria-label="Main navigation" className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><div className="hidden items-center gap-6 lg:flex"><Link href="/phone-repairs" className="text-sm text-[#a0b0b5] hover:text-[#14252b]">Repairs</Link><Link href="/phone-parts" className="text-sm text-[#a0b0b5] hover:text-[#14252b]">Phone parts</Link><Link href="/accessories" className="text-sm font-semibold text-[#14252b]">Accessories</Link><Link href="/about" className="text-sm text-[#a0b0b5] hover:text-[#14252b]">About</Link><Link href="/contact" className="text-sm text-[#a0b0b5] hover:text-[#14252b]">Contact</Link></div><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#14252b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#243b40]"><MessageCircle className="size-4" /> Ask about stock</a></nav></header>
  <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b7a17a]">Phone accessories</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#14252b] sm:text-6xl">Everyday accessories for your phone.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-[#a3b2b7] sm:text-lg">Looking for a charger, cable or audio accessory? Ask the shop about the item you need and confirm current availability before visiting.</p>
   <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(({title,text,Icon})=><article key={title} className="rounded-3xl border border-[#14252b]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="grid size-12 place-items-center rounded-2xl bg-[#18282d] text-[#8aa8a2]"><Icon className="size-5" /></div><h2 className="mt-5 text-xl font-semibold text-[#14252b]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#94a4aa]">{text}</p></article>)}</div>
   <div className="mt-10 rounded-[2rem] bg-[#14252b] p-7 text-white sm:p-10"><h2 className="text-2xl font-semibold sm:text-3xl">Check availability before you visit.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#b4c1c5]">Tell us what you are looking for and, where relevant, your phone model. Selection depends on current stock.</p><div className="mt-6 flex flex-wrap gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#8aa8a2] px-6 py-3 text-sm font-bold text-[#173c2e]"><MessageCircle className="size-4" /> WhatsApp 0803 590 2087</a><a href={maps} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white"><MapPin className="size-4" /> Find the shop</a></div></div>
  </div></section><SiteFooter />
 </main>;
}
function SiteFooter() { return <footer className="border-t border-[#14252b]/10 bg-[#10191d] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><p className="mt-2 text-xs text-[#94a4aa]">Block A1, Shop 18, Central Market, Kubwa, Abuja</p></div><div className="flex flex-wrap gap-4 text-sm text-[#a3b2b7]"><Link href="/phone-repairs">Repairs</Link><Link href="/phone-parts">Phone parts</Link><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div></div><p className="mx-auto mt-6 max-w-7xl border-t border-[#14252b]/10 pt-4 text-xs text-[#84949a]">© {new Date().getFullYear()} Amezing Limited · Open daily, 9am–10pm</p></footer>; }
