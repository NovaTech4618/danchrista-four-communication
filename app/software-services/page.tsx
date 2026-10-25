import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCheck2,
  LockKeyhole,
  MessageCircle,
  RefreshCcw,
  Smartphone,
  Wrench,
} from "lucide-react";

const whatsappUrl =
  "https://wa.me/2348035902087?text=Hello%20Amezing%20Limited%2C%20I%20need%20help%20with%20a%20phone%20software%20problem.%20Brand%20and%20model%3A%20____.%20Problem%3A%20____.%20What%20happened%20before%20the%20problem%3A%20____.";

export const metadata: Metadata = {
  title: "Phone Software & Firmware Services in Kubwa, Abuja | Amezing Limited",
  description:
    "Phone software troubleshooting, firmware recovery and boot-loop assessment in Kubwa, Abuja. Supported models, risks and costs are discussed after diagnosis.",
  alternates: { canonical: "/software-services" },
  keywords: [
    "phone software repair Kubwa",
    "firmware repair Kubwa",
    "phone stuck on logo Abuja",
    "boot loop phone repair Kubwa",
    "phone software services Abuja",
    "Amezing Limited",
  ],
  robots: { index: true, follow: true },
};

const services = [
  {
    icon: RefreshCcw,
    title: "Boot-loop and stuck-on-logo assessment",
    text: "Diagnosis for supported phones that restart repeatedly, freeze during startup or stop at the manufacturer logo. The cause must be assessed before deciding on a repair.",
  },
  {
    icon: Cpu,
    title: "Firmware and update recovery",
    text: "Software reinstallation or update-related troubleshooting for compatible models, where the device state and available firmware support the job.",
  },
  {
    icon: Smartphone,
    title: "Software fault diagnosis",
    text: "Help investigating repeated crashes, failed updates and other software symptoms. Some faults may turn out to be hardware-related after testing.",
  },
  {
    icon: LockKeyhole,
    title: "Owner-authorized access and network enquiries",
    text: "Guidance toward official account recovery, carrier-approved unlocking where a device is eligible, or the relevant organization administrator for managed devices.",
  },
];

const checklist = [
  "Send the exact brand and model, not just the brand name.",
  "Describe the fault and when it began. Mention previous resets, updates or repair attempts.",
  "Back up important data first if the phone still allows it. Some software procedures can erase data.",
  "For account, network or organization-managed restrictions, be prepared to show that you own the device or are authorized to request the service.",
  "Never send your banking PIN, one-time passcodes or account password in a chat.",
];

export default function SoftwareServicesPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0b1512] text-[#f4f1ea]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-7">
          <Link href="/" className="font-heading text-lg font-bold tracking-tight">
            AMEZING
          </Link>
          <Link
            href="/contact"
            className="rounded-lg bg-[#c98a4f] px-4 py-2.5 text-sm font-semibold text-[#1a1008]"
          >
            Contact the shop
          </Link>
        </div>
      </header>

      <section className="px-5 py-16 sm:px-7 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">
            Phone software support · Kubwa, Abuja
          </p>
          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Phone software problems need diagnosis, not guesswork.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-[#b4c2ba] sm:text-lg">
            Amezing Limited helps customers discuss software and firmware faults on supported
            phones. The right next step depends on the exact model, device condition, software
            version and what has already been tried. We explain the proposed work and known risks
            before proceeding.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c98a4f] px-6 py-3.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d69a61]"
            >
              <MessageCircle className="size-4" /> Describe your phone problem
            </a>
            <Link
              href="/phone-repair-guide"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3.5 text-sm font-semibold transition hover:bg-white/5"
            >
              Customer repair checklist <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101f1a] px-5 py-16 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Software and firmware services
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#93a69c]">
            Availability is confirmed case by case. A diagnosis may show that a hardware repair,
            official account recovery or another route is more appropriate than a software procedure.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {services.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-[#0b1512] p-6 sm:p-7"
              >
                <Icon className="size-6 text-[#e7b784]" />
                <h3 className="mt-5 font-heading text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#93a69c]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-7">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e7b784]">
              Before you message
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight">
              Help us understand the case.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#93a69c]">
              Sending the right details helps the shop check whether the model and problem are
              supported before you travel to Central Market.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c98a4f] px-5 py-3 text-sm font-semibold text-[#1a1008]"
            >
              <MessageCircle className="size-4" /> Start a WhatsApp enquiry
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#101f1a] p-6 sm:p-8">
            <ul className="space-y-4">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#c4d0c9]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#e7b784]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#101f1a] px-5 py-14 sm:px-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-5 text-[#e7b784]" />
              <h2 className="font-heading text-xl font-bold">Clear terms before work begins</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#93a69c]">
              Supported models, data-loss risks, price and estimated timing should be confirmed
              for the specific device. No outcome or turnaround time is guaranteed before diagnosis.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#e7b784]"
          >
            Contact Amezing <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
