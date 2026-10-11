'use client';

/**
 * EFFECT-24 — Skeleton screens.
 *
 * Exact dimensions, `aria-busy`, zero CLS. Every skeleton box is sized from the
 * same constants the real `LotCard` uses, so swapping skeleton for content
 * cannot move anything: the media is 4:3, the price row is one line at the
 * display size, the reveal block is three fixed rows.
 *
 * Under `prefers-reduced-motion: reduce` the shimmer is removed and a flat grey
 * block is shown instead (see the `.skeleton::after` rule in components.css).
 */

import { usePrefersReducedMotion } from '@/lib/hooks';

interface LotCardSkeletonProps {
  variant?: 'grid' | 'rail';
  className?: string;
}

export function LotCardSkeleton({ variant = 'grid', className = '' }: LotCardSkeletonProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading auction lot"
      role="status"
      className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] ${
        variant === 'rail' ? 'w-[19rem] shrink-0 sm:w-[20rem]' : ''
      } ${className}`}
    >
      {/* Media — exactly aspect-[4/3], matching LotCard */}
      <div className="skeleton aspect-[4/3] w-full rounded-none" />

      {/* Price row — same height as the real one */}
      <div className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-3">
        <div className="skeleton h-[11px] w-20" />
        <div className="skeleton h-[22px] w-28" />
      </div>

      {/* Reveal block — three rows, matching the real <dl> */}
      <div className="space-y-2 px-4 pb-4">
        <div className="skeleton h-[12px] w-full" />
        <div className="skeleton h-[12px] w-4/5" />
        <div className="skeleton h-[12px] w-3/5" />
      </div>

      {/* A skeleton makes no sound, but it must report its state. */}
      <span className="sr-only">{reduced ? 'Loading' : 'Loading lots'}</span>
    </div>
  );
}

/** A grid of skeletons with the same column rhythm as the lot grid. */
export function LotGridSkeleton({
  count = 8,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={`Loading ${count} auction lots`}
      className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <LotCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Skeleton for the auction-room bid panel — same block heights as the real one. */
export function BidPanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Connecting to the live auction room"
      className={`space-y-5 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5 ${className}`}
    >
      <div className="space-y-2">
        <div className="skeleton h-[11px] w-24" />
        <div className="skeleton h-[42px] w-52" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-[26px] w-24 rounded-full" />
        <div className="skeleton h-[26px] w-24 rounded-full" />
      </div>
      <div className="skeleton h-[52px] w-full" />
      <div className="skeleton h-[48px] w-full rounded-full" />
      <div className="space-y-2 pt-2">
        <div className="skeleton h-[11px] w-20" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton h-[30px] w-full" />
        ))}
      </div>
      <span className="sr-only">Connecting to the live bidding channel</span>
    </div>
  );
}
