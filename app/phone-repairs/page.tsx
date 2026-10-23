import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BatteryCharging, MapPin, MessageCircle, Smartphone, Wrench, Zap } from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

export const metadata: Metadata = {
  title: "Phone Repairs in Kubwa, Abuja",
  description: "Ask Amezing Limited about phone screen, battery, charging and software-related repairs at Central Market, Kubwa, Abuja.",
  alternates: { canonical: "/phone-repairs" },
  robots: { index: true, follow: true },
};

const services = [
  { title: "Screen and display", text: "For cracked, broken or faulty phone displays.", Icon: Smartphone },
  { title: "Battery problems", text: "For phones that drain quickly, shut down or struggle to hold charge.", Icon: BatteryCharging },
  { title: "Charging issues", text: "For phones that charge slowly, intermittently or not at all.", Icon: Zap },
  { title: "Software service", text: "For software-related phone problems that need troubleshooting.", Icon: Wrench },
];
const whatsapp = "https://wa.me/2348035902087";
const maps = "https://www.google.com/maps/search/?api=1&query=Block+A1+Shop+18+Central+Market+Kubwa+Abuja";

export default function PhoneRepairsPage() {
  return <main id="main-content" className="min-h-screen bg-[#0B0D10] text-[#F0F3F7]">
    <div className="bg-[#1A2029] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">Amezing Limited · Central Market, Kubwa · Open daily, 9am–10pm</div>
    <header className="border-b border-[#F0F3F7]/10"><nav aria-label="Main navigation" className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
      <Link href="/" aria-label="Amezing Limited home" className="shrink-0"><AmezingLogo /></Link>
      <div className="hidden items-center gap-6 lg:flex"><Link href="/phone-repairs" className="text-sm font-semibold text-[#1A2029]">Repairs</Link><Link href="/phone-parts" className="text-sm text-[#A7B0BD] hover:text-[#1A2029]">Phone parts</Link><Link href="/accessories" className="text-sm text-[#A7B0BD] hover:text-[#1A2029]">Accessories</Link><Link href="/about" className="text-sm text-[#A7B0BD] hover:text-[#1A2029]">About</Link><Link href="/contact" className="text-sm text-[#A7B0BD] hover:text-[#1A2029]">Contact</Link></div>
      <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1A2029] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2D3746]"><MessageCircle className="size-4" /> Ask about a repair</a>
    </nav></header>
    <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8DAEFF]">Phone repair services</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#1A2029] sm:text-6xl">Let’s start with what’s wrong with your phone.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[#A7B0BD] sm:text-lg">Tell us your phone model and what it is doing. We can discuss the problem and the next step before you visit the shop.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{services.map(({title,text,Icon}) => <article key={title} className="rounded-3xl border border-[#1A2029]/10 bg-[#15191F] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="grid size-12 place-items-center rounded-2xl bg-[#1B222B] text-[#8DAEFF]"><Icon className="size-5" /></div><h2 className="mt-5 text-xl font-semibold text-[#1A2029]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#A7B0BD]">{text}</p></article>)}</div>
      <div className="mt-10 rounded-[2rem] bg-[#1A2029] p-7 text-white sm:p-10"><h2 className="text-2xl font-semibold sm:text-3xl">Not sure what repair you need?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#b4c1c5]">Send a message describing the fault. The exact repair, required parts and cost can be discussed before work proceeds.</p><div className="mt-6 flex flex-wrap gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#8DAEFF] px-6 py-3 text-sm font-bold text-[#0B0D10]"><MessageCircle className="size-4" /> WhatsApp 0803 590 2087</a><a href={maps} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white"><MapPin className="size-4" /> Get directions</a></div></div>
    </div></section>
    <SiteFooter />
  </main>;
}
function SiteFooter() { return <footer className="border-t border-[#1A2029]/10 bg-[#101318] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><p className="mt-2 text-xs leading-5 text-[#A7B0BD]">Block A1, Shop 18, Central Market, Kubwa, Abuja</p></div><div className="flex flex-wrap gap-4 text-sm text-[#A7B0BD]"><Link href="/phone-parts">Phone parts</Link><Link href="/accessories">Accessories</Link><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div></div><p className="mx-auto mt-6 max-w-7xl border-t border-[#1A2029]/10 pt-4 text-xs text-[#8C96A5]">© {new Date().getFullYear()} Amezing Limited · Open daily, 9am–10pm</p></footer>; }
