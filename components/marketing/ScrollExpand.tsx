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
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setIsMobile(media.matches);
      setReduceMotion(motion.matches);
    };
    update();
    media.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !useWindowScroll || reduceMotion) return;

    const updateTarget = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      // Start when the section enters the viewport and finish before the
      // user has to scroll through a large empty area. This is much easier
      // to control with a thumb on a phone than the old fixed 12% trigger.
      const start = window.innerHeight * (isMobile ? 0.72 : 0.86);
      const travel = Math.max(1, window.innerHeight * (isMobile ? 0.82 : scrollDistance));
      targetRef.current = Math.max(0, Math.min(1, (start - rect.top) / travel));
    };

    const animate = () => {
      const current = progressRef.current;
      const target = targetRef.current;
      const ease = Math.max(0.05, Math.min(0.24, isMobile ? smoothing * 1.55 : smoothing));
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
  }, [enabled, isMobile, reduceMotion, scrollDistance, smoothing, useWindowScroll]);

  const effectiveStartWidth = isMobile ? Math.max(startWidth, 88) : startWidth;
  const effectiveStartHeight = isMobile ? Math.min(startHeight, 48) : startHeight;
  const effectiveStartRadius = isMobile ? Math.min(startRadius, 24) : startRadius;
  const effectiveMediaZoom = isMobile ? Math.min(mediaZoom, 1.08) : mediaZoom;
  const width = effectiveStartWidth + (100 - effectiveStartWidth) * progress;
  const height = effectiveStartHeight + (100 - effectiveStartHeight) * progress;
  const radius = effectiveStartRadius + (endRadius - effectiveStartRadius) * progress;
  const imageScale = 1 + (effectiveMediaZoom - 1) * progress;
  const scrim = overlayScrim * (1 - progress);
  const introOpacity = 1 - Math.min(1, progress * 2.2);
  const contentOpacity = Math.max(0, Math.min(1, (progress - (isMobile ? 0.38 : 0.5)) / (isMobile ? 0.28 : 0.32)));
  const contentY = (1 - contentOpacity) * (isMobile ? 18 : 32);
  const stageHeight = isMobile ? 135 : Math.max(155, (scrollDistance + holdDistance) * 100);

  return (
    <div
      ref={stageRef}
      className="relative"
      style={{ height: `${stageHeight}vh` }}
    >
      <div className="sticky top-0 flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden bg-[#e9efec] px-3 py-5 sm:h-screen sm:px-7 sm:py-10">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-[8%] top-[12%] size-40 rounded-full bg-teal-200/25 blur-3xl sm:size-56" />
          <div className="absolute bottom-[5%] right-[8%] size-52 rounded-full bg-white/80 blur-3xl sm:size-72" />
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
                ? "14px 14px 34px rgba(96,112,105,.18), -10px -10px 30px rgba(255,255,255,.9), 0 0 0 1px rgba(255,255,255,.65)"
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

          <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white sm:p-8 lg:p-12">
            <div
              className="flex items-start justify-between gap-3"
              style={{ opacity: introOpacity }}
            >
              <div className="max-w-2xl">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-teal-200 sm:text-[11px] sm:tracking-[0.25em]">
                  Danchrista Four Communication
                </p>
                {title ? (
                  <h1 className="mt-2 max-w-2xl font-heading text-xl font-bold leading-[1] tracking-[-0.04em] sm:text-4xl lg:text-6xl">
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
              <div className="rounded-[1.35rem] border border-white/15 bg-slate-950/45 p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-9 lg:p-10">
                {children}
              </div>
            </div>

            <div
              className="flex items-end justify-between gap-4"
              style={{ opacity: Math.max(0.2, 1 - progress * 0.72) }}
            >
              <div className="max-w-md">
                <p className="text-[11px] font-bold text-white/90 sm:text-sm">One action. The records stay connected.</p>
                <p className="mt-1 text-[9px] leading-4 text-white/60 sm:text-xs sm:leading-5">Sales · repairs · parts · payments · stock · closing</p>
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
