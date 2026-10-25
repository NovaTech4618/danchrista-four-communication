import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { PrintChecklistButton } from "@/components/site/PrintChecklistButton";

export const metadata: Metadata = {
  title: "Repair Intake & Handover Sheet | Amezing Limited",
  description:
    "A printable phone repair intake, approval, testing and collection sheet for Amezing Limited technicians in Kubwa, Abuja.",
  robots: { index: false, follow: false },
};

function Field({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <div className="mt-2 min-h-7 border-b border-slate-400" />
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white p-4 sm:p-5 print:break-inside-avoid print:rounded-none print:p-3">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-900 print:border print:border-slate-500 print:bg-white">
          {number}
        </span>
        <h2 className="text-sm font-bold tracking-wide text-slate-900 sm:text-base">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs leading-5 text-slate-800">
      <span className="mt-0.5 inline-block size-3.5 shrink-0 border border-slate-500" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

const tests = [
  "Original complaint checked",
  "Display and touch",
  "Charging / charging port",
  "Front and rear cameras",
  "Microphone",
  "Earpiece and loudspeaker",
  "Wi-Fi / Bluetooth (where relevant)",
  "SIM / mobile signal (where relevant)",
  "Buttons and vibration",
  "Fingerprint / Face ID (where fitted)",
  "Other fault-specific test",
  "Exterior / screen fit checked",
];

export default function RepairIntakePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#eef2ef] px-3 py-5 text-slate-900 sm:px-6 sm:py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:underline">
            <ArrowLeft className="size-4" /> Back to Amezing website
          </Link>
          <PrintChecklistButton />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="border-b-2 border-emerald-900 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-900">Amezing Limited</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Repair Intake & Handover Sheet</h1>
                <p className="mt-2 text-xs text-slate-600">Block A1, Shop 18, Central Market, Kubwa, Abuja · 0803 590 2087</p>
              </div>
              <div className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:min-w-40 print:rounded-none">
                <p className="font-semibold">Job / receipt number</p>
                <div className="mt-3 min-h-5 border-b border-slate-400" />
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-600">
              Complete this sheet for each device. Record the condition honestly, obtain approval before opening or performing chargeable work, and test the agreed fault again before collection.
            </p>
          </header>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
            <Section number="1" title="Customer and device">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date received" />
                <Field label="Time received" />
                <Field label="Customer name" className="col-span-2" />
                <Field label="Contact number" className="col-span-2" />
                <Field label="Brand / exact model" className="col-span-2" />
                <Field label="Colour / identifying mark" />
                <Field label="Serial / IMEI (only if necessary)" />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">Do not record passwords, banking PINs or one-time codes. Record only identifying details genuinely needed for the job.</p>
            </Section>

            <Section number="2" title="Condition at drop-off">
              <div className="grid gap-2">
                <CheckLine>Phone powers on</CheckLine>
                <CheckLine>Phone does not power on / not tested</CheckLine>
                <CheckLine>Cracked display / back glass / frame damage noted</CheckLine>
                <CheckLine>Signs of liquid exposure or corrosion observed</CheckLine>
                <CheckLine>Previous repair or missing screws / seals noted</CheckLine>
                <CheckLine>Customer permitted condition photos</CheckLine>
              </div>
              <Field label="Visible damage / existing issues" className="mt-4" />
              <Field label="Accessories left with the phone (if any)" className="mt-4" />
            </Section>

            <Section number="3" title="Reported problem and diagnosis">
              <Field label="Customer's description of the fault" />
              <Field label="Drop / liquid / update / earlier repair history" className="mt-4" />
              <Field label="Diagnosis and proposed work" className="mt-4" />
              <Field label="Part needed and quality/type described to customer" className="mt-4" />
            </Section>

            <Section number="4" title="Approval before work">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Quoted total (₦)" />
                <Field label="Agreed diagnostic fee / deposit (if any)" />
                <Field label="Estimated completion time/date" className="col-span-2" />
              </div>
              <div className="mt-3 grid gap-2">
                <CheckLine>Customer approved the quoted work and price</CheckLine>
                <CheckLine>Data-loss / reset risk explained where relevant</CheckLine>
                <CheckLine>Parts type, availability and known limitations explained</CheckLine>
                <CheckLine>Customer knows additional work requires fresh approval</CheckLine>
              </div>
              <Field label="Approval recorded by / time" className="mt-3" />
            </Section>

            <Section number="5" title="Work carried out">
              <Field label="Repair / software work performed" />
              <Field label="Parts fitted / part source or grade" className="mt-4" />
              <Field label="Technician" className="mt-4" />
              <Field label="Notes / work not completed and why" className="mt-4" />
            </Section>

            <Section number="6" title="Final test before collection">
              <p className="mb-3 text-xs leading-5 text-slate-600">Mark Pass, Fail or N/A against the checks relevant to this device. Do not mark a test as passed if it was not performed.</p>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 print:grid-cols-2">
                {tests.map((test) => (
                  <div key={test} className="flex items-start justify-between gap-2 border-b border-slate-200 pb-1.5 text-xs">
                    <span>{test}</span>
                    <span className="shrink-0 text-slate-600">P / F / N/A</span>
                  </div>
                ))}
              </div>
              <Field label="Unresolved issue / test not possible" className="mt-4" />
            </Section>

            <Section number="7" title="Collection, payment and warranty terms">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Final amount (₦)" />
                <Field label="Amount paid / balance (₦)" />
                <Field label="Collection date / time" />
                <Field label="Warranty period, if offered" />
              </div>
              <Field label="Warranty scope, exclusions and agreed terms" className="mt-4" />
              <div className="mt-3 grid gap-2">
                <CheckLine>Customer shown the completed work and relevant tests</CheckLine>
                <CheckLine>Phone and any accessories returned to the customer</CheckLine>
                <CheckLine>Any remaining issue and next step explained</CheckLine>
                <CheckLine>Receipt / payment record provided</CheckLine>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Customer acknowledgement" />
                <Field label="Staff name / acknowledgement" />
              </div>
            </Section>

            <section className="rounded-xl border border-emerald-900/20 bg-emerald-50 p-4 sm:p-5 print:break-inside-avoid print:rounded-none print:bg-white print:p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-900" />
                <h2 className="text-sm font-bold text-slate-900">Privacy and safe handling</h2>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 print:grid-cols-2">
                <CheckLine>Use customer data only for the repair and necessary testing</CheckLine>
                <CheckLine>Do not browse photos, messages or apps unrelated to testing</CheckLine>
                <CheckLine>Ask the customer to unlock the device personally when possible</CheckLine>
                <CheckLine>Keep the device tagged and stored securely while in the shop</CheckLine>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-700">
                This sheet records the conversation and work performed; it does not create an automatic warranty or waive either party's rights. The shop should agree and explain any fee, warranty and collection policy before using this form.
              </p>
            </section>
          </div>

          <footer className="mt-4 flex flex-col gap-2 border-t border-slate-300 pt-3 text-[10px] leading-4 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Amezing Limited · Repair documentation · Keep completed copies securely.</span>
            <span>Form version 1.0</span>
          </footer>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 print:hidden">
          <ClipboardCheck className="size-4" />
          <span>Print one sheet per device. This page does not save customer details.</span>
          <span className="inline-flex items-center gap-1"><Smartphone className="size-3.5" /> Use with every repair</span>
          <span className="inline-flex items-center gap-1"><Wrench className="size-3.5" /> Confirm price and timing before work</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5" /> Test before handover</span>
        </div>
      </div>
    </main>
  );
}
