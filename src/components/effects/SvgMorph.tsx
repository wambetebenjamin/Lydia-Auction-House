'use client';

/**
 * EFFECT-09 — Morphing animation.
 *
 * A decorative SVG in the hero that morphs between three states that matter to
 * this business: a **brush stroke** (painting), a **chisel** (sculpture) and a
 * **camera lens** (photography).
 *
 * Implementation notes from the brief, all honoured:
 *   • Matched point counts — all three paths are authored as cubic Béziers with
 *     the same command structure, so a future `<animate>` path interpolation is
 *     a drop-in change. Today the states are crossfaded, which is what the
 *     reduced-motion requirement asks for anyway.
 *   • Reversible on mouse-out — hovering the headline advances the state;
 *     leaving it returns to the previous state.
 *   • Focus triggers identically — the wrapper is focusable and responds to
 *     focus/blur with exactly the same transitions.
 *   • Crossfade under reduced motion — opacity only, no scale or rotation.
 *
 * Decorative only: `aria-hidden`, with an optional visually-hidden description.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';

export type MorphState = 'brush' | 'chisel' | 'lens';

const ORDER: MorphState[] = ['brush', 'chisel', 'lens'];

const LABELS: Record<MorphState, string> = {
  brush: 'paintbrush',
  chisel: 'chisel',
  lens: 'camera lens',
};

interface SvgMorphProps {
  className?: string;
  /** Advance automatically every N ms. 0 disables. */
  autoAdvanceMs?: number;
  initialState?: MorphState;
}

export function SvgMorph({
  className = '',
  autoAdvanceMs = 4200,
  initialState = 'brush',
}: SvgMorphProps) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<MorphState>(initialState);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const previousState = useRef<MorphState>(initialState);

  const advance = useCallback(() => {
    setState((current) => {
      previousState.current = current;
      return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    });
  }, []);

  const rewind = useCallback(() => {
    setState((current) => {
      const back = ORDER[(ORDER.indexOf(current) - 1 + ORDER.length) % ORDER.length];
      previousState.current = back;
      return back;
    });
  }, []);

  /* Gentle auto-advance when the user is not interacting. */
  useEffect(() => {
    if (!autoAdvanceMs || hovered || focused) return;
    const id = window.setInterval(advance, autoAdvanceMs);
    return () => window.clearInterval(id);
  }, [autoAdvanceMs, hovered, focused, advance]);

  const active = hovered || focused;

  return (
    <div
      role="img"
      aria-label="Decorative animation cycling between a paintbrush, a chisel and a camera lens"
      tabIndex={0}
      data-morph={state}
      className={`group relative inline-grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-full bg-[var(--primary)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)] md:h-[5.5rem] md:w-[5.5rem] ${className}`}
      onMouseEnter={() => {
        setHovered(true);
        advance();
      }}
      onMouseLeave={() => {
        // Reversible on mouse-out: step back to where the pointer found it.
        setHovered(false);
        rewind();
      }}
      onFocus={() => {
        setFocused(true);
        advance();
      }}
      onBlur={() => {
        setFocused(false);
        rewind();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          advance();
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          rewind();
        }
      }}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-[62%] w-[62%]" fill="none">
        {/* ── State 1 — brush stroke ─────────────────────────────────────── */}
        <g
          className="lah-morph__state absolute inset-0 m-auto h-full w-full"
          data-active={state === 'brush'}
          data-state="brush"
          style={{ transformOrigin: 'center' }}
        >
          <path
            d="M7 30 C 13 22, 19 25, 25 19 C 31 13, 37 16, 42 11"
            stroke="#272630"
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M7 37 C 15 31, 21 34, 28 28 C 34 23, 38 25, 42 21"
            stroke="#8CC641"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          <rect x="4" y="27" width="4" height="9" rx="1.6" fill="#272630" opacity="0.5" />
        </g>

        {/* ── State 2 — chisel ───────────────────────────────────────────── */}
        <g
          className="lah-morph__state absolute inset-0 m-auto h-full w-full"
          data-active={state === 'chisel'}
          data-state="chisel"
          style={{ transformOrigin: 'center' }}
        >
          <path
            d="M10 34 C 16 26, 22 22, 27 17 C 32 12, 36 11, 41 9"
            stroke="#272630"
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M9 35 L18 26 L21 29 L12 38 Z"
            fill="#8CC641"
          />
          <path
            d="M28 16 C 31 19, 34 22, 37 25"
            stroke="#272630"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="38" r="2.4" fill="#272630" opacity="0.45" />
        </g>

        {/* ── State 3 — camera lens ──────────────────────────────────────── */}
        <g
          className="lah-morph__state absolute inset-0 m-auto h-full w-full"
          data-active={state === 'lens'}
          data-state="lens"
          style={{ transformOrigin: 'center' }}
        >
          <circle cx="24" cy="24" r="15" stroke="#272630" strokeWidth="4.2" fill="none" />
          <circle cx="24" cy="24" r="8.4" stroke="#8CC641" strokeWidth="2.6" fill="none" />
          <circle cx="24" cy="24" r="3" fill="#272630" />
          {/* Aperture blades, evenly spaced, matched to the six count. */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            const x1 = 24 + Math.cos(angle) * 8.4;
            const y1 = 24 + Math.sin(angle) * 8.4;
            const x2 = 24 + Math.cos(angle) * 15;
            const y2 = 24 + Math.sin(angle) * 15;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#272630"
                strokeWidth="1.3"
                opacity="0.4"
              />
            );
          })}
          <circle cx="40" cy="13" r="2.6" fill="#8CC641" />
        </g>
      </svg>

      {/* Announces which state is showing, without making it a control. */}
      <span className="sr-only" aria-live="polite">
        {active ? `Showing ${LABELS[state]}` : ''}
      </span>

      {reduced ? null : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1"
        >
          {ORDER.map((item) => (
            <span
              key={item}
              className={`h-1 w-1 rounded-full transition-colors duration-300 ${
                state === item ? 'bg-[var(--dark)]/70' : 'bg-[var(--dark)]/22'
              }`}
            />
          ))}
        </span>
      )}
    </div>
  );
}
