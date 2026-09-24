type AmezingLogoProps = { dark?: boolean; compact?: boolean; className?: string };

export function AmezingLogo({ dark = false, compact = false, className = "" }: AmezingLogoProps) {
  return (
    <div className={"flex items-center gap-2 " + className} aria-label="Amezing Limited">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold">A</div>
      {!compact && <div className={"leading-tight " + (dark ? "text-white" : "text-foreground")}><div className="font-bold tracking-wide">AMEZING</div><div className="text-[10px] opacity-70">Amezing Limited</div></div>}
    </div>
  );
}