import type { SVGProps } from "react";

type NovatechLogoProps = {
  dark?: boolean;
  compact?: boolean;
  className?: string;
};

/** Product mark. The business tenant remains Danchrista Four Communication. */
export function NovatechLogo({ dark = false, compact = false, className = "" }: NovatechLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl shadow-sm ${
          dark ? "bg-[#d7a95a] text-[#123b34]" : "bg-[#123b34] text-white"
        }`}
        aria-hidden="true"
      >
        <DanchristaGlyph className="size-6" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={`block font-heading text-[17px] font-bold tracking-[-0.025em] ${dark ? "text-white" : "text-slate-950"}`}>
            NOVATECH
          </span>
          <span className={`mt-1.5 block text-[8px] font-bold uppercase tracking-[0.22em] ${dark ? "text-[#c7d8d2]" : "text-slate-400"}`}>
            Business Workspace
          </span>
        </span>
      )}
    </span>
  );
}

function DanchristaGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7 5v18M7 5h7a5 5 0 1 1 0 10H7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 19h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
