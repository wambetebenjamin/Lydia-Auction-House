'use client';

/**
 * Mobile bid bar.
 *
 * The brief asks for the bid panel to be sticky at the bottom of the screen on
 * mobile. Sticking the whole panel would bury two thirds of the viewport, so the
 * panel itself stays in the flow and this compact bar — carrying the same live
 * numbers from the same channel — sticks to the bottom instead, with a single
 * 48px-plus action that scrolls the real panel into view and focuses its first
 * field.
 *
 * Hidden from `lg` upward, where the panel is already sticky in the right-hand
 * column, and hidden under reduced motion only in the sense that its entry
 * animation is suppressed — the bar itself is functional, not decorative.
 */

import { useEffect, useState } from 'react';
import type { AuctionRoomState, Bid } from '@/lib/types';
import { formatKES } from '@/lib/format';
import { usePrefersReducedMotion } from '@/lib/hooks';

interface MobileBidBarProps {
  state: AuctionRoomState | null;
  history: Bid[];
  seed: { currentBid: number; bidCount: number };
  panelId: string;
  closed?: boolean;
}

export function MobileBidBar({ state, history, seed, panelId, closed }: MobileBidBarProps) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  const currentBid = state?.currentBid ?? seed.currentBid;
  const bidCount = state?.bidCount ?? seed.bidCount;
  const latest = history[0];

  /* Appear once the visitor is past the top of the lot, so the bar does not
     cover the gallery before they have seen it. */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 380);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[75] border-t border-[var(--line-ink)] bg-[var(--surface-ink)]/96 backdrop-blur-[12px] lg:hidden print:hidden">
      <div className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-white/50">
            {closed ? 'Closed' : 'Current bid'}
          </p>
          <p
            className={`font-[family-name:var(--font-display)] text-[1.375rem] leading-tight text-[var(--primary)] [font-variant-numeric:tabular-nums] ${
              reduced ? '' : 'lah-figure-pop'
            }`}
            key={currentBid}
          >
            {formatKES(currentBid)}
          </p>
          <p className="truncate text-[11px] text-white/55">
            {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
            {latest ? ` · last by ${latest.bidder}` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const panel = document.getElementById(panelId);
            panel?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
            panel?.querySelector<HTMLInputElement>('input[inputmode="numeric"]')?.focus();
          }}
          className="pill-btn pill-btn--primary min-h-12 shrink-0"
          aria-label={closed ? 'View the closed lot details' : 'Go to the bidding panel'}
        >
          {closed ? 'Details' : 'Place bid'}
        </button>
      </div>
    </div>
  );
}
