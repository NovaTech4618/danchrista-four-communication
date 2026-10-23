import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, Handshake, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

export const metadata: Metadata = {
  title: "About Amezing Limited | Kubwa, Abuja",
  description: "Learn about Amezing Limited, a phone repair, phone parts and accessories business at Central Market, Kubwa, Abuja.",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
};
const values = [
 { title: "Clear communication", text: "Understanding the phone, the problem and the requested part is the first step.", Icon: Handshake },
 { title: "Organized service", text: "Clear details help customers and the shop follow what has been requested.", Icon: ClipboardList },
 { title: "Practical guidance", text: "Customers can ask questions and discuss the next step before deciding how to proceed.", Icon: ShieldCheck },
];
const whatsapp = "https://wa.me/2348035902087";
const maps = "https://www.google.com/maps/search/?api=1&query=Block+A1+Shop+18+Central+Market+Kubwa+Abuja";

export default function AboutPage() {
 return <main id="main-content" className="min-h-screen bg-[#f7f6f0] text-[#142c25]">
  <div className="bg-[#123c30] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">Amezing Limited · Central Market, Kubwa · Open daily, 9am–10pm</div>
  <header className="border-b border-[#142c25]/10"><nav aria-label="Main navigation" className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><div className="hidden items-center gap-6 lg:flex"><Link href="/phone-repairs" className="text-sm text-[#50655d] hover:text-[#123c30]">Repairs</Link><Link href="/phone-parts" className="text-sm text-[#50655d] hover:text-[#123c30]">Phone parts</Link><Link href="/accessories" className="text-sm text-[#50655d] hover:text-[#123c30]">Accessories</Link><Link href="/about" className="text-sm font-semibold text-[#123c30]">About</Link><Link href="/contact" className="text-sm text-[#50655d] hover:text-[#123c30]">Contact</Link></div><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#123c30] px-4 py-2.5 text-sm font-bold text-white"><MessageCircle className="size-4" /> Talk to us</a></nav></header>
  <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7133]">About Amezing</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#123c30] sm:text-6xl">A local phone shop in Kubwa, Abuja.</h1><p className="mt-6 max-w-3xl text-base leading-7 text-[#53675e] sm:text-lg">Amezing Limited brings together phone repair enquiries, replacement phone parts and everyday accessories at Central Market, Kubwa. We aim to make it straightforward to ask about a device, find out whether a part may be available and understand the next step before visiting.</p>
   <div className="mt-10 grid gap-4 md:grid-cols-3">{values.map(({title,text,Icon})=><article key={title} className="rounded-3xl border border-[#123c30]/10 bg-white p-6 shadow-sm"><div className="grid size-12 place-items-center rounded-2xl bg-[#eaf1e8] text-[#245c43]"><Icon className="size-5" /></div><h2 className="mt-5 text-xl font-semibold text-[#123c30]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#617168]">{text}</p></article>)}</div>
   <div className="mt-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-center rounded-[2rem] bg-[#123c30] p-7 text-white sm:p-10"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8bc7c]">Visit the shop</p><h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Central Market, Kubwa</h2><p className="mt-3 text-sm leading-6 text-[#c1d0c6]">Block A1, Shop 18, Central Market, Kubwa, Abuja · Open daily, 9am–10pm.</p></div><div className="flex flex-wrap gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#d5b86d] px-5 py-3 text-sm font-bold text-[#173c2e]"><MessageCircle className="size-4" /> WhatsApp</a><a href={maps} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white"><MapPin className="size-4" /> Directions</a></div></div>
   <Link href="/services" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#245c43]">Explore our services <ArrowRight className="size-4" /></Link>
  </div></section><SiteFooter />
 </main>;
}
function SiteFooter() { return <footer className="border-t border-[#123c30]/10 bg-[#f0f0e8] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><p className="mt-2 text-xs text-[#617168]">Block A1, Shop 18, Central Market, Kubwa, Abuja</p></div><div className="flex flex-wrap gap-4 text-sm text-[#53675e]"><Link href="/phone-repairs">Repairs</Link><Link href="/phone-parts">Phone parts</Link><Link href="/accessories">Accessories</Link><Link href="/services">Services</Link><Link href="/contact">Contact</Link></div></div><p className="mx-auto mt-6 max-w-7xl border-t border-[#123c30]/10 pt-4 text-xs text-[#758178]">© {new Date().getFullYear()} Amezing Limited</p></footer>; }
