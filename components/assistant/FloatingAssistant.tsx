"use client";

import Link from "next/link";
import { Bot, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 w-[min(320px,calc(100vw-2rem))] max-h-[58svh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Amezing Limited Assistant</p>
                <p className="truncate text-[11px] text-slate-300">Shop assistant</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-[calc(58svh-58px)] overflow-y-auto p-4">
            <p className="text-sm leading-6 text-slate-600">Ask about repairs, stock, customers, sales, debit, credit, profit and shop records.</p>
            <Link href="/assistant" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              <MessageCircle className="size-4" />
              Open Assistant
            </Link>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close Amezing Limited Assistant" : "Open Amezing Limited Assistant"} className="ml-auto flex size-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl shadow-slate-950/20 ring-4 ring-white transition hover:-translate-y-0.5 hover:bg-slate-800">
        {open ? <X className="size-5" /> : <Bot className="size-6" />}
      </button>
    </div>
  );
}
