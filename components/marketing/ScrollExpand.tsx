"use client";

import { useEffect, useRef, useState } from "react";

type ScrollExpandProps = {
  src: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  useWindowScroll?: boolean;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  enabled?: boolean;
  children?: React.ReactNode;
};

export default function ScrollExpand({
  src,
  alt = "",
  title,
  scrollHint = "Scroll to explore",
  useWindowScroll = true,
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  enabled = true,
  children,
}: ScrollExpandProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const progressRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled || !useWindowScroll) return;

    const updateTarget = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const travel = Math.max(1, window.innerHeight * scrollDistance);
      const raw = (-rect.top + window.innerHeight * 0.08) / travel;
      targetRef.current = Math.max(0, Math.min(1, raw));
    };

    const animate = () => {
      const current = progressRef.current;
      const target = targetRef.current;
      const next = current + (target - current) * Math.max(0.02, Math.min(0.35, smoothing));
      progressRef.current = next;
      setProgress(next);
      if (Math.abs(target - next) > 0.001) frameRef.current = window.requestAnimationFrame(animate);
      else frameRef.current = null;
    };

    const onScroll = () => {
      updateTarget();
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(animate);
    };

    updateTarget();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [enabled, scrollDistance, smoothing, useWindowScroll]);

  const width = startWidth + (100 - startWidth) * progress;
  const height = startHeight + (100 - startHeight) * progress;
  const radius = startRadius + (endRadius - startRadius) * progress;
  const imageScale = 1 + (mediaZoom - 1) * progress;
  const scrim = overlayScrim * (1 - progress);
  const contentOpacity = Math.max(0, Math.min(1, (progress - 0.62) / 0.28));

  return (
    <div
      ref={stageRef}
      className="relative min-h-[150vh]"
      style={{ height: `${Math.max(150, (scrollDistance + holdDistance) * 100)}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-[#f7f9f8] px-4 py-10 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(20,184,166,0.10),transparent_38%)]" aria-hidden="true" />

        <div
          className="relative overflow-hidden border border-white/20 bg-slate-950 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.75)]"
          style={{
            width: `${width}%`,
            height: `${height}%`,
            maxWidth: "1600px",
            borderRadius: `${radius}px`,
          }}
        >
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: `scale(${imageScale})` }}
          />
          <div className="absolute inset-0 bg-slate-950" style={{ opacity: scrim }} aria-hidden="true" />

          <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white sm:p-10 lg:p-14">
            <div className="flex items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-200 sm:text-xs">Danchrista Four Communication</p>
                {title ? <h1 className="mt-3 max-w-2xl font-heading text-3xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-7xl">{title}</h1> : null}
              </div>
              <div className="hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md sm:block">Business, connected.</div>
            </div>

            <div className="mx-auto w-full max-w-3xl text-center" style={{ opacity: contentOpacity, transform: `translateY(${(1 - contentOpacity) * 28}px)` }}>
              <div className="rounded-[2rem] border border-white/15 bg-slate-950/55 p-7 shadow-2xl backdrop-blur-xl sm:p-10">{children}</div>
            </div>

            <div className="flex items-end justify-between gap-6">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-white/90 sm:text-base">One action. The records stay connected.</p>
                <p className="mt-1 text-xs leading-5 text-white/60 sm:text-sm">Sales, parts, repairs, payments, stock and closing records—built around how the shop actually works.</p>
              </div>
              <div className="hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/65 sm:flex"><span className="grid size-8 place-items-center rounded-full border border-white/20">↓</span>{scrollHint}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
