import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HandCoins, Package, ShoppingCart, Wrench } from "lucide-react";
import { DanchristaLogo } from "@/components/brand/NovatechLogo";

export const metadata: Metadata = {
  title: "Danchrista Four Communication | Shop record system",
  description: "The internal business system for Danchrista Four Communication: simple sales, stock, repairs, debit, credit and owner records.",
};

const modules = [
  ["Sales", "Fast walk-in sales without forcing a customer name, phone number or unnecessary fields."],
  ["Inventory", "Accessories and phone parts are separated into clear categories, with stock levels and selling prices visible."],
  ["Repairs", "Record the person, item/device, price and repair status without turning intake into paperwork."],
  ["Debit", "Track who collected goods, what they collected, what it cost, what they paid and what remains."],
  ["Credit", "Track goods collected from other people, what Danchrista owes them and when payment is due."],
  ["Owner view", "See low stock, fast-moving goods, outstanding balances, money movement and daily activity."],
] as const;

export default function HomePage() {
  return <main className="min-h-screen bg-[#f7f8f5] text-[#182a28]">
    <nav className="sticky top-0 z-50 border-b border-[#dfe6df] bg-[#f7f8f5]/90 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7"><Link href="/" aria-label="Danchrista home"><DanchristaLogo /></Link><Link href="/login" className="rounded-xl bg-[#123b34] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1d6a54]">Sign in</Link></div></nav>
    <section className="px-5 pb-20 pt-16 sm:px-7 sm:pt-24"><div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div><span className="inline-flex rounded-full border border-[#d7a95a]/40 bg-[#fff8e9] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a641d]">Danchrista Four Communication</span><h1 className="mt-6 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">The shop should not have to remember everything.</h1><p className="mt-6 max-w-xl text-base leading-7 text-[#687974] sm:text-lg">A simple internal system built around the way Danchrista already works: sell goods, receive repairs, watch stock, track who owes us and remember who we owe.</p><Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#123b34] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#123b34]/10 transition hover:bg-[#1d6a54]">Open the shop system <ArrowRight className="size-4" /></Link></div><div className="rounded-[28px] bg-[#123b34] p-5 text-white shadow-[0_30px_70px_rgba(18,59,52,.18)] sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7a95a]">Today's shop picture</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Preview icon={ShoppingCart} title="Sales" text="Quick walk-in recording" /><Preview icon={Package} title="Stock" text="Low + fast-moving signals" /><Preview icon={Wrench} title="Repairs" text="Simple status tracking" /><Preview icon={HandCoins} title="Debit" text="Who still owes us" /></div><div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-[#c7d8d2]">Owner rule</p><p className="mt-1 font-heading text-lg font-bold">What sold · What is low · Who owes us · Who we owe</p></div></div></div></section>
    <section id="modules" className="border-y border-[#dfe6df] bg-white px-5 py-20 sm:px-7"><div className="mx-auto max-w-6xl"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Built from the real books</p><h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Six parts. One clear shop record.</h2><div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#dfe6df] bg-[#dfe6df] sm:grid-cols-2 lg:grid-cols-3">{modules.map(([title,text]) => <article key={title} className="bg-white p-6"><h3 className="font-heading text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#687974]">{text}</p></article>)}</div></div></section>
    <section className="px-5 py-20 sm:px-7"><div className="mx-auto max-w-4xl rounded-[28px] bg-[#123b34] px-7 py-12 text-white sm:px-12"><h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Simple for the worker. Powerful for the owner.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-[#c7d8d2]">The worker should not need to understand inventory accounting or business reports. They record what happened. Danchrista keeps the picture.</p><Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#d7a95a] px-6 py-3.5 text-sm font-bold text-[#123b34]">Sign in <ArrowRight className="size-4" /></Link></div></section>
    <footer className="mx-auto flex max-w-6xl justify-between px-5 py-8 text-xs text-[#87958f] sm:px-7"><span>Danchrista Four Communication</span><span>Internal business system</span></footer>
  </main>;
}

function Preview({ icon: Icon, title, text }: { icon: typeof ShoppingCart; title: string; text: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><Icon className="size-5 text-[#d7a95a]" /><p className="mt-4 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-[#9eb8ad]">{text}</p></div>; }
