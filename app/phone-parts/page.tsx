import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, MapPin, MessageCircle, Package, Search } from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

export const metadata: Metadata = {
  title: "Phone Parts in Kubwa, Abuja",
  description: "Ask Amezing Limited about replacement phone parts at Central Market, Kubwa, Abuja. Availability depends on phone model and current stock.",
  alternates: { canonical: "/phone-parts" },
  robots: { index: true, follow: true },
};
const categories = [
  ["Downboards", "Charging and lower-board components for supported phone models."],
  ["Charging flex", "Charging flexes and related replacement components."],
  ["Power flex", "Power-button and related flex components where available."],
  ["Earpiece flex", "Earpiece and upper-flex replacement parts for supported models."],
  ["Back glass", "Replacement back-glass components for selected phones."],
  ["Other repair parts", "Other components depending on model and current stock."],
];
const whatsapp = "https://wa.me/2348035902087";
const maps = "https://www.google.com/maps/search/?api=1&query=Block+A1+Shop+18+Central+Market+Kubwa+Abuja";

export default function PhonePartsPage() {
  return <main id="main-content" className="min-h-screen bg-[#f7f6f0] text-[#142c25]">
    <div className="bg-[#123c30] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">Amezing Limited · Central Market, Kubwa · Open daily, 9am–10pm</div>
    <header className="border-b border-[#142c25]/10"><nav aria-label="Main navigation" className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><div className="hidden items-center gap-6 lg:flex"><Link href="/phone-repairs" className="text-sm text-[#50655d] hover:text-[#123c30]">Repairs</Link><Link href="/phone-parts" className="text-sm font-semibold text-[#123c30]">Phone parts</Link><Link href="/accessories" className="text-sm text-[#50655d] hover:text-[#123c30]">Accessories</Link><Link href="/about" className="text-sm text-[#50655d] hover:text-[#123c30]">About</Link><Link href="/contact" className="text-sm text-[#50655d] hover:text-[#123c30]">Contact</Link></div><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#123c30] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b5140]"><MessageCircle className="size-4" /> Check availability</a></nav></header>
    <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7133]">Phone parts</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#123c30] sm:text-6xl">Looking for a specific phone part?</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[#53675e] sm:text-lg">Tell us the exact phone model and the component you need. Availability can change, so checking before you travel is the best first step.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{categories.map(([title,text]) => <article key={title} className="rounded-3xl border border-[#123c30]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="grid size-12 place-items-center rounded-2xl bg-[#eaf1e8] text-[#245c43]"><Package className="size-5" /></div><h2 className="mt-5 text-xl font-semibold text-[#123c30]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#617168]">{text}</p></article>)}</div>
      <div className="mt-10 grid gap-4 md:grid-cols-2"><article className="rounded-3xl border border-[#123c30]/10 bg-white p-7"><Search className="size-6 text-[#245c43]" /><h2 className="mt-4 text-2xl font-semibold text-[#123c30]">Help us identify the part</h2><p className="mt-3 text-sm leading-6 text-[#617168]">Send the phone brand and exact model, plus the part name or a clear photo if you have one.</p></article><article className="rounded-3xl border border-[#123c30]/10 bg-white p-7"><Cpu className="size-6 text-[#245c43]" /><h2 className="mt-4 text-2xl font-semibold text-[#123c30]">Check before visiting</h2><p className="mt-3 text-sm leading-6 text-[#617168]">Stock depends on the model and current availability. We recommend confirming with the shop first.</p></article></div>
      <div className="mt-10 rounded-[2rem] bg-[#eaf0e8] p-7 sm:p-9"><h2 className="text-2xl font-semibold text-[#123c30]">Ask about a part</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#53675e]">Message the shop with the model and part name, or visit Block A1, Shop 18, Central Market, Kubwa, Abuja.</p><div className="mt-5 flex flex-wrap gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#123c30] px-6 py-3 text-sm font-bold text-white"><MessageCircle className="size-4" /> WhatsApp 0803 590 2087</a><a href={maps} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#123c30]/20 px-6 py-3 text-sm font-bold text-[#123c30]"><MapPin className="size-4" /> Get directions</a></div></div>
    </div></section><SiteFooter />
  </main>;
}
function SiteFooter() { return <footer className="border-t border-[#123c30]/10 bg-[#f0f0e8] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><p className="mt-2 text-xs text-[#617168]">Block A1, Shop 18, Central Market, Kubwa, Abuja</p></div><div className="flex flex-wrap gap-4 text-sm text-[#53675e]"><Link href="/phone-repairs">Repairs</Link><Link href="/accessories">Accessories</Link><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div></div><p className="mx-auto mt-6 max-w-7xl border-t border-[#123c30]/10 pt-4 text-xs text-[#758178]">© {new Date().getFullYear()} Amezing Limited</p></footer>; }
