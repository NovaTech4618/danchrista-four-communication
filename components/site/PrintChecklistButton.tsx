"use client";

import { Printer } from "lucide-react";

export function PrintChecklistButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1d6a54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174f40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6a54] focus-visible:ring-offset-2 print:hidden"
    >
      <Printer className="size-4" aria-hidden="true" />
      Print intake sheet
    </button>
  );
}
