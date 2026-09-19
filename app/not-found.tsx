import Link from "next/link";
import { ArrowLeft, Compass, Wrench } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f5] px-6 py-16 text-slate-950">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <Compass className="size-6" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Amezing Limited</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">That page isn’t here.</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">The link may be outdated, or the page you requested may have moved.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Wrench className="size-4" />
            Back to dashboard
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
