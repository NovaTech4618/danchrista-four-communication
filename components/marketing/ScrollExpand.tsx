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
  startRadius = 28,
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
      const start = window.innerHeight * 0.12;
      targetRef.current = Math.max(0, Math.min(1, (start - rect.top) / travel));
    };

    const animate = () => {
      const current = progressRef.current;
      const target = targetRef.current;
      const ease = Math.max(0.02, Math.min(0.28, smoothing));
      const next = current + (target - current) * ease;
      progressRef.current = next;
      setProgress(next);
      if (Math.abs(target - next) > 0.0008) frameRef.current = window.requestAnimationFrame(animate);
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
  const introOpacity = 1 - Math.min(1, progress * 2.2);
  const contentOpacity = Math.max(0, Math.min(1, (progress - 0.5) / 0.32));
  const contentY = (1 - contentOpacity) * 32;

  return (
    <div
      ref={stageRef}
      className="relative"
      style={{ height: `${Math.max(155, (scrollDistance + holdDistance) * 100)}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-[#e9efec] px-4 py-7 sm:px-7 sm:py-10">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-[8%] top-[12%] size-56 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute bottom-[5%] right-[8%] size-72 rounded-full bg-white/80 blur-3xl" />
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            width: `${width}%`,
            height: `${height}%`,
            maxWidth: "1680px",
            borderRadius: `${radius}px`,
            boxShadow:
              progress < 0.96
                ? "18px 18px 45px rgba(96,112,105,.22), -14px -14px 38px rgba(255,255,255,.92), 0 0 0 1px rgba(255,255,255,.7)"
                : "0 30px 90px rgba(15,23,42,.18)",
          }}
        >
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{ transform: `scale(${imageScale})` }}
          />
          <div className="absolute inset-0 bg-slate-950" style={{ opacity: scrim }} aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/60" aria-hidden="true" />

          <div className="relative z-10 flex h-full flex-col justify-between p-5 text-white sm:p-8 lg:p-12">
            <div
              className="flex items-start justify-between gap-4 transition-opacity duration-300"
              style={{ opacity: introOpacity }}
            >
              <div className="max-w-2xl">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-teal-200 sm:text-[11px]">Danchrista Four Communication</p>
                {title ? (
                  <h1 className="mt-2 max-w-2xl font-heading text-2xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-4xl lg:text-6xl">
                    {title}
                  </h1>
                ) : null}
              </div>
              <div className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold backdrop-blur-md sm:block">
                Business, connected.
              </div>
            </div>

            <div
              className="mx-auto w-full max-w-3xl will-change-transform"
              style={{ opacity: contentOpacity, transform: `translateY(${contentY}px)` }}
            >
              <div className="rounded-[2rem] border border-white/15 bg-slate-950/45 p-6 shadow-2xl backdrop-blur-xl sm:p-9 lg:p-10">
                {children}
              </div>
            </div>

            <div
              className="flex items-end justify-between gap-5 transition-opacity duration-300"
              style={{ opacity: Math.max(0.25, 1 - progress * 0.7) }}
            >
              <div className="max-w-md">
                <p className="text-xs font-bold text-white/90 sm:text-sm">One action. The records stay connected.</p>
                <p className="mt-1 text-[10px] leading-5 text-white/60 sm:text-xs">Sales · repairs · parts · payments · stock · closing</p>
              </div>
              <div className="hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 sm:flex">
                <span className="grid size-8 place-items-center rounded-full border border-white/25 bg-white/10">↓</span>
                {scrollHint}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
