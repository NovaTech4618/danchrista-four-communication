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
 return <main id="main-content" className="min-h-screen bg-[#FAF5EE] text-[#30231F]">
  <div className="bg-[#3B2825] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">Amezing Limited · Central Market, Kubwa · Open daily, 9am–10pm</div>
  <header className="border-b border-[#30231F]/10"><nav aria-label="Main navigation" className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><div className="hidden items-center gap-6 lg:flex"><Link href="/shop" className="text-sm text-[#766761] hover:text-[#C65D3A]">Shop</Link><Link href="/phone-repairs" className="text-sm text-[#766761] hover:text-[#C65D3A]">Repairs</Link><Link href="/phone-parts" className="text-sm text-[#766761] hover:text-[#C65D3A]">Phone parts</Link><Link href="/accessories" className="text-sm font-semibold text-[#30231F]">Accessories</Link><Link href="/about" className="text-sm text-[#766761] hover:text-[#C65D3A]">About</Link><Link href="/contact" className="text-sm text-[#766761] hover:text-[#C65D3A]">Contact</Link></div><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3B2825] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#754333]"><MessageCircle className="size-4" /> Ask about stock</a></nav></header>
  <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C65D3A]">Phone accessories</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#30231F] sm:text-6xl">Everyday accessories for your phone.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-[#766761] sm:text-lg">Looking for a charger, cable or audio accessory? Ask the shop about the item you need and confirm current availability before visiting.</p>
   <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(({title,text,Icon})=><article key={title} className="rounded-3xl border border-[#766761]/10 bg-[#FFFFFF] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="grid size-12 place-items-center rounded-2xl bg-[#F5EDE5] text-[#C65D3A]"><Icon className="size-5" /></div><h2 className="mt-5 text-xl font-semibold text-[#30231F]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#766761]">{text}</p></article>)}</div>
   <div className="mt-10 rounded-[2rem] bg-[#3B2825] p-7 text-white sm:p-10"><h2 className="text-2xl font-semibold sm:text-3xl">Check availability before you visit.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#F2D8C8]">Tell us what you are looking for and, where relevant, your phone model. Selection depends on current stock.</p><div className="mt-6 flex flex-wrap gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C65D3A] px-6 py-3 text-sm font-bold text-[#FAF5EE]"><MessageCircle className="size-4" /> WhatsApp 0803 590 2087</a><a href={maps} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white"><MapPin className="size-4" /> Find the shop</a></div></div>
  </div></section><SiteFooter />
 </main>;
}
function SiteFooter() { return <footer className="border-t border-[#766761]/10 bg-[#F1E6DA] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><p className="mt-2 text-xs text-[#766761]">Block A1, Shop 18, Central Market, Kubwa, Abuja</p></div><div className="flex flex-wrap gap-4 text-sm text-[#766761]"><Link href="/phone-repairs">Repairs</Link><Link href="/phone-parts">Phone parts</Link><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div></div><p className="mx-auto mt-6 max-w-7xl border-t border-[#766761]/10 pt-4 text-xs text-[#8D7A72]">© {new Date().getFullYear()} Amezing Limited · Open daily, 9am–10pm</p></footer>; }
