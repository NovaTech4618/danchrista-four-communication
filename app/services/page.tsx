import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cable, MapPin, MessageCircle, Smartphone, Wrench } from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

export const metadata: Metadata = {
  title: "Phone Services, Parts & Accessories in Kubwa",
  description: "Explore phone repair, software troubleshooting, replacement phone parts and accessories at Amezing Limited, Central Market, Kubwa, Abuja.",
  alternates: { canonical: "/services" },
  robots: { index: true, follow: true },
};
const services = [
 { title: "Phone repairs", text: "Tell us the phone model and describe the fault so the next step can be discussed.", Icon: Smartphone, href: "/phone-repairs", link: "Explore repairs" },
 { title: "Software service", text: "Ask about support for your software-related phone issue.", Icon: Wrench, href: "/phone-repairs", link: "Ask about a problem" },
 { title: "Phone parts", text: "Check for a replacement component by sharing the exact phone model and part name.", Icon: Cable, href: "/phone-parts", link: "Browse phone parts" },
 { title: "Accessories", text: "Ask about everyday accessories such as chargers, cables and audio items.", Icon: Cable, href: "/accessories", link: "Browse accessories" },
];
const whatsapp = "https://wa.me/2348035902087";
const maps = "https://www.google.com/maps/search/?api=1&query=Block+A1+Shop+18+Central+Market+Kubwa+Abuja";

export default function ServicesPage() {
 return <main id="main-content" className="min-h-screen bg-[#f7f6f0] text-[#142c25]">
  <div className="bg-[#123c30] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">Amezing Limited · Central Market, Kubwa · Open daily, 9am–10pm</div>
  <header className="border-b border-[#142c25]/10"><nav aria-label="Main navigation" className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><div className="hidden items-center gap-6 lg:flex"><Link href="/phone-repairs" className="text-sm text-[#50655d] hover:text-[#123c30]">Repairs</Link><Link href="/phone-parts" className="text-sm text-[#50655d] hover:text-[#123c30]">Phone parts</Link><Link href="/accessories" className="text-sm text-[#50655d] hover:text-[#123c30]">Accessories</Link><Link href="/about" className="text-sm text-[#50655d] hover:text-[#123c30]">About</Link><Link href="/contact" className="text-sm text-[#50655d] hover:text-[#123c30]">Contact</Link></div><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#123c30] px-4 py-2.5 text-sm font-bold text-white"><MessageCircle className="size-4" /> Contact us</a></nav></header>
  <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7133]">What we can help with</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#123c30] sm:text-6xl">Repairs, parts and accessories in one place.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-[#53675e] sm:text-lg">Choose the section that matches what you need. If you are unsure, send the shop a message with a few details and we can discuss the next step.</p>
   <div className="mt-10 grid gap-4 sm:grid-cols-2">{services.map(({title,text,Icon,href,link})=><article key={title} className="rounded-3xl border border-[#123c30]/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="grid size-12 place-items-center rounded-2xl bg-[#eaf1e8] text-[#245c43]"><Icon className="size-5" /></div><h2 className="mt-5 text-2xl font-semibold text-[#123c30]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#617168]">{text}</p><Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#245c43]">{link} <ArrowRight className="size-4" /></Link></article>)}</div>
   <div className="mt-10 rounded-[2rem] bg-[#eaf0e8] p-7 sm:p-9"><h2 className="text-2xl font-semibold text-[#123c30]">Before you visit</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#53675e]">For a repair, describe the fault and phone model. For a part or accessory, tell us the exact item so we can check current availability.</p><div className="mt-5 flex flex-wrap gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#123c30] px-6 py-3 text-sm font-bold text-white"><MessageCircle className="size-4" /> WhatsApp 0803 590 2087</a><a href={maps} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#123c30]/20 px-6 py-3 text-sm font-bold text-[#123c30]"><MapPin className="size-4" /> Directions</a></div></div>
  </div></section><SiteFooter />
 </main>;
}
function SiteFooter() { return <footer className="border-t border-[#123c30]/10 bg-[#f0f0e8] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><p className="mt-2 text-xs text-[#617168]">Block A1, Shop 18, Central Market, Kubwa, Abuja</p></div><div className="flex flex-wrap gap-4 text-sm text-[#53675e]"><Link href="/phone-repairs">Repairs</Link><Link href="/phone-parts">Phone parts</Link><Link href="/accessories">Accessories</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div></div><p className="mx-auto mt-6 max-w-7xl border-t border-[#123c30]/10 pt-4 text-xs text-[#758178]">© {new Date().getFullYear()} Amezing Limited</p></footer>; }
