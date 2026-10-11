'use client';

/**
 * EFFECT-15 — Horizontal scroll.
 *
 * A horizontal scroll-snap rail, labelled for assistive technology as
 * "Featured lots, N items." — the count is in the accessible name, as the brief
 * requires, so a screen-reader user knows the size of the set before entering it.
 *
 *   • Keyboard arrow navigable: the rail is a single focusable region with a
 *     documented key map (← → step one item, Home/End jump to the ends). Each
 *     card is also a real link, so plain Tab traversal works too.
 *   • `prefers-reduced-motion: reduce` → the rail collapses to a plain wrapped
 *     grid (see the `.scroll-rail` rules in components.css) and the scripting
 *     below is skipped entirely.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';

interface HorizontalRailProps {
  /** Used to build the accessible name: "<label>, <N> items." */
  label: string;
  count: number;
  children: React.ReactNode;
  className?: string;
  /** Minimum card width, so the rail's scroll step is predictable. */
  itemWidthRem?: number;
}

export function HorizontalRail({
  label,
  count,
  children,
  className = '',
  itemWidthRem = 19,
}: HorizontalRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: false });

  const step = itemWidthRem * 16 + 20; // card width + gap

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setEdges({
      start: rail.scrollLeft <= 4,
      end: rail.scrollLeft >= max - 4,
    });
  }, []);

  useEffect(() => {
    if (reduced) return;
    const rail = railRef.current;
    if (!rail) return;
    measure();
    rail.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      rail.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure, reduced]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, [step]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (reduced) return;
      const rail = railRef.current;
      if (!rail) return;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          scrollBy(1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          scrollBy(-1);
          break;
        case 'Home':
          event.preventDefault();
          rail.scrollTo({ left: 0, behavior: 'smooth' });
          break;
        case 'End':
          event.preventDefault();
          rail.scrollTo({ left: rail.scrollWidth, behavior: 'smooth' });
          break;
        default:
          break;
      }
    },
    [reduced, scrollBy],
  );

  const accessibleName = `${label}, ${count} ${count === 1 ? 'item' : 'items'}.`;

  return (
    <div className={`relative ${className}`}>
      {/* The visible heading. The hidden span completes the accessible name. */}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-[var(--text-h2)]">{label}</h2>
        <span className="sr-only">{accessibleName}</span>
        <p aria-hidden="true" className="meta">
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div
        ref={railRef}
        role="group"
        aria-label={accessibleName}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="scroll-rail focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
      >
        {children}
      </div>

      {/* Scroll affordances, hidden from reduced-motion grid layout. */}
      {!reduced && count > 2 ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <p className="mr-auto meta hidden md:block">
            Use ← → to move through the rail
          </p>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={edges.start}
            aria-label={`Scroll ${label} backwards`}
            className="grid h-12 w-12 place-items-center rounded-full border-2 border-[var(--line-strong)] text-[var(--ink)] transition-colors duration-200 hover:border-[var(--dark)] hover:bg-[var(--light)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={edges.end}
            aria-label={`Scroll ${label} forwards`}
            className="grid h-12 w-12 place-items-center rounded-full border-2 border-[var(--line-strong)] text-[var(--ink)] transition-colors duration-200 hover:border-[var(--dark)] hover:bg-[var(--light)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
