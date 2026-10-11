'use client';

/**
 * EFFECT-05 — Bid history log.
 *
 * The last ten bids, updating in real time. New rows slide in and flash once
 * (`.lah-bid-arrive`); under reduced motion they simply appear, and the
 * announcement still fires through the shared live region so nothing is lost.
 *
 * A single summary sentence is announced rather than every row, which keeps the
 * channel from becoming unusable with a screen reader under active bidding.
 */

import { useEffect, useRef } from 'react';
import type { Bid } from '@/lib/types';
import { formatKES, formatTime } from '@/lib/format';
import { usePrefersReducedMotion } from '@/lib/hooks';

interface BidHistoryProps {
  bids: Bid[];
  /** A locally-optimistic bid still awaiting server confirmation. */
  pendingAmount?: number | null;
  lotId: string;
  className?: string;
}

export function BidHistory({ bids, pendingAmount, lotId, className = '' }: BidHistoryProps) {
  const reduced = usePrefersReducedMotion();
  const previousTop = useRef<string | null>(null);
  const flashed = useRef(new Set<string>());

  const rows = bids.slice(0, 10);

  useEffect(() => {
    const top = rows[0]?.id ?? null;
    if (top && top !== previousTop.current) {
      previousTop.current = top;
      flashed.current.add(top);
    }
  }, [rows]);

  return (
    <section className={className} aria-labelledby={`${lotId}-ladder-heading`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={`${lotId}-ladder-heading`} className="meta">
          Bid ladder
        </h3>
        <p className="text-[11px] text-[var(--ink-subtle)]">Most recent first</p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-4 text-[var(--text-meta)] text-[var(--ink-muted)]">
          No bids yet. Be the first — the opening bid is{' '}
          {pendingAmount ? formatKES(pendingAmount) : 'the starting price shown above'}.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)]">
          {rows.map((bid, index) => {
            const isNew = index === 0 && flashed.current.has(bid.id) && !reduced;
            return (
              <li
                key={bid.id}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                  isNew ? 'lah-bid-arrive' : ''
                } ${bid.pending ? 'opacity-65' : ''}`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      index === 0
                        ? 'bg-[var(--primary)] text-[var(--dark)]'
                        : 'bg-[var(--light)] text-[var(--ink-muted)]'
                    }`}
                  >
                    {index === 0 ? '★' : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[var(--text-meta)] text-[var(--ink)]">
                      {bid.bidder}
                      {bid.pending ? (
                        <span className="ml-1.5 text-[var(--ink-subtle)]">(sending…)</span>
                      ) : null}
                    </span>
                    <span className="block font-[family-name:var(--font-condensed)] text-[11px] text-[var(--ink-subtle)] [font-variant-numeric:tabular-nums]">
                      {formatTime(bid.at)}
                    </span>
                  </span>
                </span>

                <span className="shrink-0 font-[family-name:var(--font-condensed)] text-[var(--text-ui)] font-bold text-[var(--ink)] [font-variant-numeric:tabular-nums]">
                  {formatKES(bid.amount)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {rows.length > 0 ? (
        <p className="mt-2 text-[11px] text-[var(--ink-subtle)]">
          Showing the last {rows.length} {rows.length === 1 ? 'bid' : 'bids'}. Bidder names are shown
          as the bidder entered them; the house does not publish identities.
        </p>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {rows.length > 0
          ? `${rows.length} recent bids. Highest is ${formatKES(rows[0].amount)}.`
          : 'No bids have been placed on this lot yet.'}
      </span>
    </section>
  );
}
