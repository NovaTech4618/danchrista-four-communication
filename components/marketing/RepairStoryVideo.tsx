"use client";

import { useEffect, useState } from "react";

// NOTE: this is an animated illustration, not a real product screenshot.
// "No real product demo" is one of the most common tells that a site was
// vibe-coded rather than built around an actual working product - and
// AMEZING has a real, working app behind this landing page. Replacing
// this component with an actual screen recording or screenshot of the
// live dashboard would be a stronger, more honest fix than anything that
// can be done to this mockup - I can't capture that myself (no browser
// access to the deployed app), so wiring in a real recording/screenshot
// once one is provided is the next step here.
const stages = [
  { label: "Device arrives", detail: "Customer + device captured" },
  { label: "Engineer", detail: "Job assigned" },
  { label: "Parts", detail: "Stock accounted for" },
  { label: "Customer update", detail: "Status stays visible" },
  { label: "Collected", detail: "Payment + handover" },
];

export default function RepairStoryVideo() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 1500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.7)] sm:aspect-[16/10] lg:aspect-[4/3]"
      aria-label="AMEZING repair workflow preview"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(45,212,191,0.24),transparent_30%),radial-gradient(circle_at_15%_80%,rgba(20,184,166,0.12),transparent_32%),linear-gradient(135deg,#0f172a,#111827)]" />
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-teal-400/6 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 size-64 rounded-full bg-teal-500/6 blur-3xl" />

      <div className="relative flex h-full flex-col p-5 sm:p-8">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-xs">
          <span>AMEZING repair story</span>
          <span className="inline-flex items-center gap-2 text-teal-300">
            <span className="size-1.5 rounded-full bg-teal-300 motion-safe:animate-pulse" />
            Live workflow
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-5 sm:py-7">
          <div className="w-full max-w-xl">
            <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-md sm:mb-6 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300">Repair job</p>
                  <p className="mt-1 text-base font-semibold text-white sm:text-lg">Device stays visible from intake to pickup</p>
                </div>
                <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-teal-200">Tracked</span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-teal-300 transition-[width] duration-700 ease-out"
                  style={{ width: `${((activeStage + 1) / stages.length) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[9px] font-medium text-slate-500">
                <span>Started</span>
                <span>{stages[activeStage].label}</span>
                <span>Complete</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
              {stages.map((stage, index) => {
                const active = index === activeStage;
                const completed = index < activeStage;
                return (
                  <div
                    key={stage.label}
                    className={`rounded-2xl border p-3 transition-all duration-500 sm:p-4 ${
                      active
                        ? "border-teal-300/40 bg-teal-300/10 shadow-lg shadow-teal-950/20 -translate-y-1"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <div className={`grid size-8 place-items-center rounded-full text-xs font-bold transition-colors ${completed || active ? "bg-teal-300 text-slate-950" : "bg-white/10 text-slate-400"}`}>
                      {completed ? "✓" : index + 1}
                    </div>
                    <p className={`mt-3 text-[10px] font-semibold leading-4 sm:text-[11px] ${active ? "text-white" : "text-slate-300"}`}>{stage.label}</p>
                    <p className="mt-1 hidden text-[9px] leading-4 text-slate-500 sm:block">{stage.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4 sm:pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">One operational record</p>
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-white sm:text-base">From device intake to payment and pickup, the whole job stays visible.</p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200 backdrop-blur sm:inline-flex">No video required</span>
        </div>
      </div>
    </div>
  );
}
