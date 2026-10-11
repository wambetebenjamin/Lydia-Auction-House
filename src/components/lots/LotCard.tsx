'use client';

/**
 * EFFECT-26 — Hover animations.
 *
 * An artwork card that reveals artist, medium, estimated value and bid count.
 *
 *   • 200–400 ms (the reveal transitions are 260/320 ms — see `.lot-card__reveal`)
 *   • Gated behind `@media (hover: hover) and (pointer: fine)` in components.css,
 *     so a touch device never gets a hover state it cannot escape
 *   • The same reveal appears on `:focus-visible` via `:focus-within`, so
 *     keyboard users get identical information
 *   • On touch, an explicit "Details" toggle sets `data-revealed`, giving the
 *     same content on tap without hijacking the card's link
 *
 * EFFECT-24 — the skeleton companion lives in `LotCardSkeleton.tsx` and matches
 * this card's dimensions box for box, so the swap produces zero layout shift.
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Lot } from '@/lib/types';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/types';
import { formatEstimate, formatKES, formatKESCompact } from '@/lib/format';
import { useHoverCapable } from '@/lib/hooks';

interface LotCardProps {
  lot: Lot;
  /** `rail` fixes the width for the horizontal scroll rail. */
  variant?: 'grid' | 'rail';
  priority?: boolean;
  className?: string;
}

export function LotCard({ lot, variant = 'grid', priority = false, className = '' }: LotCardProps) {
  const [revealed, setRevealed] = useState(false);
  const hoverCapable = useHoverCapable();

  const sold = lot.status === 'sold';
  const primaryPrice = sold && lot.soldPrice ? lot.soldPrice : lot.currentBid;

  return (
    <article
      className={`lot-card group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] transition-shadow duration-[260ms] ease-[var(--ease-out)] hover:shadow-[var(--shadow-md)] focus-within:shadow-[var(--shadow-md)] ${
        variant === 'rail' ? 'w-[19rem] shrink-0 snap-start sm:w-[20rem]' : ''
      } ${className}`}
      data-revealed={revealed ? 'true' : 'false'}
      aria-labelledby={`lot-${lot.id}-title`}
    >
      {/* ── Media ────────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--light)]">
        <Image
          src={lot.images[0]}
          alt={`${lot.title} by ${lot.artistName}`}
          fill
          sizes={variant === 'rail' ? '20rem' : '(min-width: 1200px) 22vw, (min-width: 768px) 33vw, 100vw'}
          priority={priority}
          className="lot-card__media object-cover"
        />

        {/* Status chip — always visible, so state never depends on hover. */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          <StatusChip lot={lot} />
        </div>

        {/* Lot number — always visible. */}
        <p className="pointer-events-none absolute right-3 top-3 rounded-[var(--radius-sm)] bg-[var(--surface-ink)]/86 px-2 py-1 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.1em] text-[var(--primary)] backdrop-blur-[2px]">
          Lot {lot.lotNumber}
        </p>

        {/* A dark scrim appears with the reveal, for contrast on busy images. */}
        <div
          aria-hidden="true"
          className="lot-card__scrim pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--surface-ink)]/78 via-transparent to-transparent"
        />

        {/* Title sits on the media, always legible. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--surface-ink)]/92 to-transparent px-4 pb-3 pt-8">
          <h3
            id={`lot-${lot.id}-title`}
            className="font-[family-name:var(--font-display)] text-[var(--text-h4)] leading-tight text-white"
          >
            <Link
              href={`/lots/${lot.slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {lot.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-[var(--text-meta)] text-white/75">{lot.artistName}</p>
        </div>
      </div>

      {/* ── Always-visible price line ─────────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-3">
        <p className="meta">{sold ? 'Hammer price' : lot.status === 'buy-now' ? 'Buy Now' : 'Current bid'}</p>
        <p className="font-[family-name:var(--font-display)] text-[var(--text-lead)] text-[var(--ink)] [font-variant-numeric:tabular-nums]">
          {formatKES(primaryPrice)}
        </p>
      </div>

      {/* ── The reveal (EFFECT-26) ────────────────────────────────────────── */}
      <div className="lot-card__reveal px-4">
        <div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-[var(--line)] pb-3 pt-3 text-[var(--text-meta)]">
            <dt className="meta">Artist</dt>
            <dd className="text-[var(--ink)]">{lot.artistName}</dd>

            <dt className="meta">Medium</dt>
            <dd className="text-[var(--ink-muted)]">{lot.medium}</dd>

            <dt className="meta">Estimate</dt>
            <dd className="text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
              {formatEstimate(lot.estimateLow, lot.estimateHigh)}
            </dd>

            <dt className="meta">{sold ? 'Bids' : 'Bids'}</dt>
            <dd className="text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
              {lot.bidCount} bids · {lot.bidderCount} bidders
            </dd>

            {lot.edition ? (
              <>
                <dt className="meta">Edition</dt>
                <dd className="text-[var(--ink-muted)]">{lot.edition}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>

      {/* ── Touch-only explicit toggle ────────────────────────────────────── */}
      {!hoverCapable ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-expanded={revealed}
            aria-controls={`lot-${lot.id}-title`}
            className="relative z-10 min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors duration-200 hover:border-[var(--dark)] hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)]"
          >
            {revealed ? 'Hide details' : 'Details'}
          </button>
        </div>
      ) : (
        <div className="h-4" aria-hidden="true" />
      )}
    </article>
  );
}

function StatusChip({ lot }: { lot: Lot }) {
  const tone =
    lot.status === 'live'
      ? 'chip--live'
      : lot.status === 'upcoming'
        ? 'chip--upcoming'
        : lot.status === 'buy-now'
          ? 'chip--buy-now'
          : 'chip--sold';

  return (
    <span className={`chip ${tone}`}>
      {lot.status === 'live' ? <span className="live-dot" aria-hidden="true" /> : null}
      {STATUS_LABELS[lot.status]}
      <span className="sr-only"> — {CATEGORY_LABELS[lot.category]}</span>
    </span>
  );
}

/** Compact rail variant used inside EFFECT-15's horizontal strip. */
export function LotRailCard({ lot, priority }: { lot: Lot; priority?: boolean }) {
  return <LotCard lot={lot} variant="rail" priority={priority} />;
}

/** The terse one-line presentation used inside dense lists. */
export function LotListRow({ lot }: { lot: Lot }) {
  return (
    <Link
      href={`/lots/${lot.slug}`}
      className="flex items-center gap-4 rounded-[var(--radius-md)] px-3 py-3 transition-colors duration-200 hover:bg-[var(--surface-raised)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)]"
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--light)]">
        <Image src={lot.images[0]} alt="" fill sizes="3.5rem" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-[family-name:var(--font-display)] text-[var(--text-body-min)]">
          {lot.title}
        </span>
        <span className="block truncate text-[var(--text-meta)] text-[var(--ink-muted)]">
          Lot {lot.lotNumber} · {lot.artistName}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-[family-name:var(--font-condensed)] text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
          {formatKESCompact(lot.status === 'sold' && lot.soldPrice ? lot.soldPrice : lot.currentBid)}
        </span>
        <span className="block text-[11px] uppercase tracking-[0.1em] text-[var(--ink-subtle)]">
          {lot.bidCount} bids
        </span>
      </span>
    </Link>
  );
}
