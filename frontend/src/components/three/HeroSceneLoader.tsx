"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function CssVoiceFallback() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center select-none pointer-events-none"
      aria-hidden="true"
    >
      <div className="absolute h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-primary/25 bg-surface-raised/60">
        <div className="h-40 w-40 rounded-full border border-accent/25 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary via-primary-strong to-accent/70 shadow-[var(--shadow-glow)]" />
        </div>
      </div>
    </div>
  );
}

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <CssVoiceFallback />,
});

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * Client-only 3D visual wrapper that:
 *  - falls back to a clean CSS illustration when WebGL is unavailable
 *  - respects prefers-reduced-motion
 *  - pauses the render loop when scrolled off-screen via IntersectionObserver
 *  - never intercepts pointer events over CTA buttons
 */
export default function HeroSceneLoader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebglSupported(detectWebGL());

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onMotionChange);

    const el = containerRef.current;
    let observer: IntersectionObserver | null = null;
    if (el && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => setInView(entry.isIntersecting),
        { threshold: 0.05 },
      );
      observer.observe(el);
    }

    return () => {
      mq.removeEventListener("change", onMotionChange);
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full pointer-events-none">
      {webglSupported === false ? (
        <CssVoiceFallback />
      ) : webglSupported === true ? (
        <HeroScene animate={!reducedMotion && inView} />
      ) : (
        <CssVoiceFallback />
      )}
    </div>
  );
}
