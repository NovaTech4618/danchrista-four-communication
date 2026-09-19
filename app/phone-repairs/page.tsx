import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BatteryCharging, Smartphone, Wrench, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Phone Repairs | Danchrista Four Communication",
  description: "Phone repair services from Danchrista Four Communication, including screen, battery, charging and software-related repairs.",
  alternates: { canonical: "/phone-repairs" },
  robots: { index: true, follow: true },
};

const services = [
  ["Screen Repairs", "Screen and display replacement for phones with cracked, broken or faulty displays.", Smartphone],
  ["Battery Service", "Battery replacement and power-related troubleshooting for phones that drain, shut down or refuse to hold charge.", BatteryCharging],
  ["Charging Repairs", "Charging-port and charging-related repairs for phones that charge slowly, intermittently or not at all.", Zap],
  ["Software Service", "Phone software service and troubleshooting for common software-related problems.", Wrench],
];

export default function PhoneRepairsPage() {
  return <main className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
    <header className="border-b border-white/10">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7">
        <Link href="/" className="font-heading text-lg font-bold tracking-tight">DANCHRISTA</Link>
        <Link href="/login" className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]">Sign in</Link>
      </div>
    </header>
    <section className="px-5 py-16 sm:px-7 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">Phone repair services</p>
        <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Get your phone working properly again.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#93a69c] sm:text-lg">Danchrista Four Communication provides practical phone repair and software services, with the job recorded clearly from intake through completion.</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {services.map(([title, text, Icon]) => <article key={title as string} className="rounded-2xl border border-white/10 bg-[#101f1a] p-6">
            <Icon className="size-6 text-[#e7b784]" />
            <h2 className="mt-5 font-heading text-xl font-bold">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-[#93a69c]">{text as string}</p>
          </article>)}
        </div>
        <div className="mt-12 rounded-2xl border border-[#c98a4f]/20 bg-[#101f1a] p-7">
          <h2 className="font-heading text-2xl font-bold">Not sure what your phone needs?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#93a69c]">Bring the device in for assessment. The exact repair, parts requirement and cost can be discussed before work proceeds.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]">Contact Danchrista <ArrowRight className="size-4" /></Link>
        </div>
      </div>
    </section>
  </main>;
}
