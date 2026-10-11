'use client';

/**
 * LOADING SCREEN — built to the brief's fallback specification.
 *
 * The design source contained no loading screen (DESIGN-INVENTORY.md §4): the
 * only `loading` token anywhere in the archive was Owl Carousel's internal
 * `.owl-loading` class. So this is the brief's specification, implemented:
 *
 *   • A paintbrush SVG sweeps left to right.
 *   • It leaves a stroke of colour drawn from the design source's palette
 *     (--primary #FFE468 and --secondary #8CC641, verbatim from style.css).
 *   • The Lydia Auction House wordmark appears in the wake of the stroke.
 *   • Progress fills.
 *   • Skip control at 3 seconds.
 *   • `role="status"` on the container, announcing completion.
 *   • Completes in under 2 seconds.
 *   • Under prefers-reduced-motion: a plain-text percentage, no animation.
 */

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';

/** Total sweep duration. The brief requires "under 2 seconds". */
const DURATION_MS = 1750;
const FADE_MS = 320;
const SKIP_VISIBLE_AT_MS = 3000;

export function LoadingScreen() {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const [announced, setAnnounced] = useState(false);
  const [visible, setVisible] = useState(true);

  const startedAt = useRef<number>(0);
  const frame = useRef<number>(0);

  /* ── Drive progress. Reduced motion jumps straight to a text counter. ──── */
  useEffect(() => {
    startedAt.current = performance.now();

    if (reduced) {
      // No animation: step in plain-text increments, still under 2 seconds.
      setProgress(8);
      const id = window.setInterval(() => {
        setProgress((p) => {
          const next = p + 23;
          if (next >= 100) {
            window.clearInterval(id);
            setProgress(100);
            return 100;
          }
          return next;
        });
      }, 260);
      return () => window.clearInterval(id);
    }

    const tick = (now: number) => {
      const elapsed = now - startedAt.current;
      const ratio = Math.min(1, elapsed / DURATION_MS);
      // Ease-out so the stroke decelerates as it completes its arc.
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));
      if (ratio < 1) {
        frame.current = window.requestAnimationFrame(tick);
      }
    };
    frame.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame.current);
  }, [reduced]);

  /* ── Reveal the skip control if the screen outstays its welcome ────────── */
  useEffect(() => {
    const id = window.setTimeout(() => setSkipVisible(true), SKIP_VISIBLE_AT_MS);
    return () => window.clearTimeout(id);
  }, []);

  /* ── Completion ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (progress < 100 || done) return;
    setDone(true);
    setAnnounced(true);
    setFading(true);

    const id = window.setTimeout(() => setVisible(false), reduced ? 0 : FADE_MS);
    return () => window.clearTimeout(id);
  }, [progress, done, reduced]);

  /* Reduced motion completes on a short timer rather than on a sweep. */
  useEffect(() => {
    if (!reduced) return;
    const id = window.setTimeout(() => {
      setProgress(100);
    }, DURATION_MS);
    return () => window.clearTimeout(id);
  }, [reduced]);

  const skip = () => {
    setProgress(100);
  };

  if (!visible) return null;

  /* ── Reduced motion: plain text percentage, nothing else ───────────────── */
  if (reduced) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading Lydia Auction House"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--surface-ink)]"
        style={{ transition: 'none' }}
      >
        <p className="font-[family-name:var(--font-condensed)] text-[13px] uppercase tracking-[0.24em] text-[var(--primary)]">
          Loading Lydia Auction House — {progress}%
        </p>
      </div>
    );
  }

  /* ── Full motion: paintbrush sweep leaving a stroke of colour ──────────── */
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Lydia Auction House"
      aria-busy={!done}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[var(--surface-ink)]"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms var(--ease-out)`,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Sweep track — the stroke the brush leaves behind */}
      <div className="relative w-[min(560px,78vw)]" aria-hidden="true">
        <svg
          viewBox="0 0 560 200"
          className="w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Both stops are design-source tokens, verbatim. */}
            <linearGradient id="lah-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFE468" />
              <stop offset="55%" stopColor="#FFE468" />
              <stop offset="100%" stopColor="#8CC641" />
            </linearGradient>
            <clipPath id="lah-stroke-clip">
              {/* Reveals the stroke left to right as the brush advances. */}
              <rect x="0" y="0" width={progress * 5.6} height="200" />
            </clipPath>
          </defs>

          {/* The painted stroke — a tapered, slightly rough band of colour */}
          <g clipPath="url(#lah-stroke-clip)">
            <path
              d="M8 118 C 90 96, 150 138, 232 112 C 314 86, 372 128, 452 104 C 496 90, 524 100, 552 92 L 552 128 C 520 138, 492 128, 448 142 C 368 168, 308 126, 228 152 C 148 178, 92 136, 8 156 Z"
              fill="url(#lah-stroke)"
              opacity="0.95"
            />
            {/* A thinner secondary pass, as a loaded brush leaves */}
            <path
              d="M22 132 C 104 112, 162 150, 244 126 C 326 102, 384 142, 464 118 C 506 106, 528 114, 548 108"
              stroke="#FFE468"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>

          {/* The brush itself, tracking the leading edge of the stroke */}
          <g
            transform={`translate(${Math.max(0, progress * 5.6 - 34)} 0)`}
            style={{ transition: 'transform 60ms linear' }}
          >
            <rect x="18" y="86" width="44" height="12" rx="3" fill="#8CC641" opacity="0.35" />
            <rect x="46" y="72" width="20" height="40" rx="4" fill="#F2F2F2" opacity="0.22" />
            <rect x="58" y="76" width="52" height="32" rx="5" fill="#F2F2F2" opacity="0.14" />
            <path
              d="M8 74 L30 74 L30 118 L8 118 C 2 118, 0 112, 0 106 L 0 86 C 0 80, 2 74, 8 74 Z"
              fill="#FFE468"
            />
          </g>
        </svg>
      </div>

      {/* Wordmark appearing in the wake of the stroke */}
      <div
        className="mt-2 text-center"
        style={{
          opacity: Math.max(0, (progress - 22) / 55),
          transform: `translateY(${Math.max(0, 14 - progress * 0.22)}px)`,
          transition: 'opacity 120ms linear, transform 120ms linear',
        }}
      >
        <p className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.34em] text-[var(--primary)]">
          Nairobi · Est. 2009
        </p>
        <p className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,6vw,2.75rem)] leading-tight text-white">
          Lydia Auction House
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="mt-9 h-[2px] w-[min(280px,56vw)] overflow-hidden rounded-full bg-white/12"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[var(--primary)]"
          style={{ width: `${progress}%`, transition: 'width 90ms linear' }}
        />
      </div>

      <p className="sr-only">Loading, {progress} percent complete.</p>

      {skipVisible && !done ? (
        <button
          type="button"
          onClick={skip}
          className="mt-6 min-h-12 px-5 font-[family-name:var(--font-condensed)] text-[13px] uppercase tracking-[0.16em] text-white/70 underline decoration-[var(--primary)] decoration-2 underline-offset-4 transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Skip
        </button>
      ) : null}

      {/* Polite completion announcement */}
      <span aria-live="polite" className="sr-only">
        {announced ? 'Loading complete.' : ''}
      </span>
    </div>
  );
}
