import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BatteryCharging, Cable, Headphones, MessageCircle, Package, ShieldCheck, Smartphone, Speaker, Wrench } from "lucide-react";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

export const metadata: Metadata = {
  title: "Shop Phone Accessories and Parts | Amezing Limited, Kubwa",
  description: "Browse Amezing Limited's online product catalogue for phone accessories and replacement parts. Contact the shop to confirm products and prices.",
  alternates: { canonical: "/shop" },
  robots: { index: true, follow: true },
};

const whatsapp = "https://wa.me/2348035902087?text=Hello%20Amezing%20Limited%2C%20I%27d%20like%20to%20ask%20about%20products%20in%20your%20shop.";
const categories = [
  { title: "Chargers", detail: "Charging adapters for compatible devices", Icon: BatteryCharging, href: "/accessories" },
  { title: "Cables", detail: "Charging and data cables", Icon: Cable, href: "/accessories" },
  { title: "Earphones and headsets", detail: "Wired and wireless audio accessories", Icon: Headphones, href: "/accessories" },
  { title: "Power banks", detail: "Portable charging options", Icon: Package, href: "/accessories" },
  { title: "Screen protectors", detail: "Display protection for selected models", Icon: ShieldCheck, href: "/accessories" },
  { title: "Speakers", detail: "Portable audio accessories", Icon: Speaker, href: "/accessories" },
  { title: "Phone parts", detail: "Ask about parts for your exact phone model", Icon: Smartphone, href: "/phone-parts" },
  { title: "Repair services", detail: "Discuss a phone fault with the shop", Icon: Wrench, href: "/phone-repairs" },
];

export default function ShopPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#FAF5EE] text-[#30231F]">
      <div className="bg-[#3B2825] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Amezing Limited · Central Market, Kubwa · Open daily, 9am–10pm
      </div>
      <header className="border-b border-[#30231F]/10 bg-[#FAF5EE]">
        <nav aria-label="Main navigation" className="mx-auto flex min-h-[78px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link>
          <div className="hidden items-center gap-6 lg:flex">
            <Link href="/shop" className="text-sm font-semibold text-[#C65D3A]">Shop</Link>
            <Link href="/phone-repairs" className="text-sm text-[#766761] hover:text-[#C65D3A]">Repairs</Link>
            <Link href="/phone-parts" className="text-sm text-[#766761] hover:text-[#C65D3A]">Phone parts</Link>
            <Link href="/accessories" className="text-sm text-[#766761] hover:text-[#C65D3A]">Accessories</Link>
            <Link href="/contact" className="text-sm text-[#766761] hover:text-[#C65D3A]">Contact</Link>
          </div>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#C65D3A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A94B2E]">
            <MessageCircle className="size-4" /> Ask the shop
          </a>
        </nav>
      </header>

      <section className="px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C65D3A]">The Amezing shop</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_.72fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#30231F] sm:text-6xl">Find what you need for your phone.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#766761] sm:text-lg">
                Browse our product categories, then contact us to check the exact item, current price and availability before visiting.
              </p>
            </div>
            <div className="rounded-3xl border border-[#E7D9CD] bg-white p-6 sm:p-7">
              <p className="text-sm font-semibold text-[#766761]">Looking for something specific?</p>
              <h2 className="mt-2 text-2xl font-semibold">Tell us the item or phone model.</h2>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#3B2825] px-5 py-3 text-sm font-bold text-white hover:bg-[#754333]">
                Enquire on WhatsApp <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C65D3A]">Browse categories</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">What are you looking for?</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#766761]">These are category links, not a claim that every item is currently in stock.</p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ title, detail, Icon, href }) => (
              <Link key={title} href={href} className="group rounded-3xl border border-[#E7D9CD] bg-white p-6 transition hover:-translate-y-1 hover:border-[#E4A27B] hover:shadow-xl hover:shadow-[#3B2825]/5">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#F5EDE5] text-[#C65D3A] transition group-hover:bg-[#C65D3A] group-hover:text-white">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#30231F]">{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#766761]">{detail}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C65D3A]">Explore category <ArrowRight className="size-4" /></span>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] bg-[#F1E6DA] p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C65D3A]">Product catalogue</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Real products. Confirmed prices.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#766761]">
              We are preparing the photo catalogue using actual Amezing shop products. No sample products, made-up prices or unverified stock are shown here. Contact us to ask about an item while the catalogue is being populated.
            </p>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C65D3A] px-6 py-3 text-sm font-bold text-white hover:bg-[#A94B2E]">
              <MessageCircle className="size-4" /> Ask about a product
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#766761]/10 bg-[#F1E6DA] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><Link href="/" aria-label="Amezing Limited home"><AmezingLogo /></Link><p className="mt-2 text-xs text-[#766761]">Block A1, Shop 18, Central Market, Kubwa, Abuja</p></div>
          <div className="flex flex-wrap gap-4 text-sm text-[#766761]"><Link href="/phone-repairs">Repairs</Link><Link href="/phone-parts">Phone parts</Link><Link href="/accessories">Accessories</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div>
        </div>
        <p className="mx-auto mt-6 max-w-7xl border-t border-[#766761]/10 pt-4 text-xs text-[#8D7A72]">© {new Date().getFullYear()} Amezing Limited · Open daily, 9am–10pm</p>
      </footer>
    </main>
  );
}
