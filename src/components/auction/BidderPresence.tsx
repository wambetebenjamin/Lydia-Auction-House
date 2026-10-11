'use client';

/**
 * EFFECT-05 — Bidder presence.
 *
 * Shows how many bidders are active on the lot, with up to eight avatar dots.
 *
 * The brief's **graceful single-bidder state** is handled here: when there is
 * only one bidder the component shows no dots at all, because a single dot
 * reads as decoration rather than information. It says, plainly, that the
 * visitor is the only bidder so far — which is the honest and useful message.
 *
 * The dots are `aria-hidden`; a single live-region sentence carries the meaning,
 * so a screen reader hears "7 bidders" rather than eight anonymous elements.
 */

import { usePrefersReducedMotion } from '@/lib/hooks';

interface BidderPresenceProps {
  bidderCount: number;
  /** Live watchers reported by the server, over and above bidders. */
  watchers?: number;
  className?: string;
}

const MAX_DOTS = 8;

const DOT_COLOURS = [
  'var(--primary)',
  'var(--secondary)',
  '#C8B8F0',
  '#F0C0B8',
  '#9FD8D0',
  '#E8B8D8',
  '#B8CCE8',
  '#D8D0A8',
];

export function BidderPresence({ bidderCount, watchers = 0, className = '' }: BidderPresenceProps) {
  const reduced = usePrefersReducedMotion();
  const single = bidderCount <= 1;

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {/* ── Single-bidder state: no dots, a plain statement instead ─────── */}
      {single ? (
        <p className="flex items-center gap-2 text-[var(--text-meta)] text-[var(--ink-muted)]">
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-full bg-[var(--light)] text-[10px] text-[var(--ink-muted)]"
          >
            {bidderCount === 1 ? '1' : '0'}
          </span>
          {bidderCount === 1
            ? 'You are the only bidder on this lot so far.'
            : 'No bidders yet — yours would be the opening bid.'}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <ul className="flex items-center" aria-hidden="true">
              {Array.from({ length: Math.min(bidderCount, MAX_DOTS) }).map((_, index) => (
                <li
                  key={index}
                  className="-ml-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--surface)] text-[10px] font-bold text-[var(--dark)] first:ml-0"
                  style={{ backgroundColor: DOT_COLOURS[index % DOT_COLOURS.length] }}
                >
                  {String.fromCharCode(65 + (index % 26))}
                </li>
              ))}
            </ul>
            {bidderCount > MAX_DOTS ? (
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--surface-ink)] text-[10px] font-bold text-[var(--primary)]"
              >
                +{bidderCount - MAX_DOTS}
              </span>
            ) : null}
          </div>

          <p className="text-[var(--text-meta)] text-[var(--ink-muted)]">
            <strong className="[font-variant-numeric:tabular-nums]">{bidderCount}</strong> active
            bidders
          </p>
        </>
      )}

      {/* ── Watchers ────────────────────────────────────────────────────── */}
      {watchers > 0 ? (
        <p
          className={`ml-auto flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--ink-subtle)] ${
            reduced ? '' : 'transition-opacity duration-300'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full bg-[var(--secondary)] ${reduced ? '' : 'animate-pulse'}`}
          />
          {watchers} watching now
        </p>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {single
          ? bidderCount === 1
            ? 'One bidder on this lot.'
            : 'No bidders yet.'
          : `${bidderCount} active bidders.`}
        {watchers > 0 ? ` ${watchers} people watching this lot.` : ''}
      </span>
    </div>
  );
}
