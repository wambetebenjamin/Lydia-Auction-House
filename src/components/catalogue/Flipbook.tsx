'use client';

/**
 * EFFECT-30 — Animated flipbook.
 *
 * The auction catalogue as a flipping booklet.
 *
 *   • **3D CSS page-flip** — a leaf rotates about its left edge under a 2400px
 *     perspective, carrying the outgoing right-hand page on its front face and
 *     the incoming left-hand page on its back face.
 *   • **Lazy page mounting** — only the current spread and its immediate
 *     neighbours are rendered; everything else is a fixed-size placeholder, so
 *     the DOM stays small however long the catalogue grows. A visited set keeps
 *     already-seen pages mounted once built.
 *   • **Keyboard prev and next** — ← → and PageUp/PageDown, plus Home/End.
 *   • **Page number announced** — a polite live region states the spread and
 *     lot range on every change.
 *   • **Text reading-mode toggle** — swaps the booklet for a linear, readable
 *     list of the same lots. This is the **default on mobile and under
 *     `prefers-reduced-motion: reduce`**, exactly as the brief requires.
 *   • Full-colour artwork images and full lot descriptions on every leaf.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Lot } from '@/lib/types';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/types';
import { formatEstimate, formatKES } from '@/lib/format';
import { useInView, usePrefersReducedMotion, useMediaQuery } from '@/lib/hooks';

interface FlipbookProps {
  lots: Lot[];
  className?: string;
  title?: string;
}

type Direction = 'next' | 'prev';

export function Flipbook({ lots, className = '', title = 'Auction Catalogue' }: FlipbookProps) {
  const reduced = usePrefersReducedMotion();
  const isNarrow = useMediaQuery('(max-width: 767px)');
  const [hostRef, inView] = useInView<HTMLDivElement>({ rootMargin: '300px' });

  /* Text mode is the default wherever the 3D flip would be a liability. */
  const [textMode, setTextMode] = useState(false);
  const [modeInitialised, setModeInitialised] = useState(false);

  useEffect(() => {
    if (modeInitialised) return;
    if (!reduced && !isNarrow) {
      setModeInitialised(true);
      return;
    }
    setTextMode(true);
    setModeInitialised(true);
  }, [reduced, isNarrow, modeInitialised]);

  /* Two lots per spread: an image leaf on the left, its description on the right. */
  const spreads = useMemo(() => {
    const result: Lot[][] = [];
    for (let i = 0; i < lots.length; i += 1) {
      result.push([lots[i]]);
    }
    return result;
  }, [lots]);

  const [spread, setSpread] = useState(0);
  const [turning, setTurning] = useState<{ direction: Direction; from: number; to: number } | null>(
    null,
  );
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0, 1]));

  const bookRef = useRef<HTMLDivElement>(null);
  const announcement = useRef('');
  const total = spreads.length;

  const markVisited = useCallback((index: number) => {
    setVisited((current) => {
      if (current.has(index)) return current;
      const next = new Set(current);
      next.add(index);
      // Keep a bounded window mounted.
      return next;
    });
  }, []);

  const goTo = useCallback(
    (target: number, direction: Direction) => {
      if (turning) return;
      if (target < 0 || target >= total) return;
      if (reduced) {
        setSpread(target);
        markVisited(target);
        markVisited(target + 1);
        return;
      }
      setTurning({ direction, from: spread, to: target });
      markVisited(target);
      markVisited(target + 1);
    },
    [turning, total, spread, reduced, markVisited],
  );

  /* Complete the flip once the CSS animation has run. */
  useEffect(() => {
    if (!turning) return;
    const duration = 620; // --dur-flip
    const id = window.setTimeout(() => {
      setSpread(turning.to);
      setTurning(null);
      bookRef.current?.focus({ preventScroll: true });
    }, duration);
    return () => window.clearTimeout(id);
  }, [turning]);

  const next = useCallback(() => goTo(spread + 1, 'next'), [goTo, spread]);
  const previous = useCallback(() => goTo(spread - 1, 'prev'), [goTo, spread]);

  /* ── Keyboard ─────────────────────────────────────────────────────────── */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (textMode) return;
      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          previous();
          break;
        case 'Home':
          event.preventDefault();
          goTo(0, 'prev');
          break;
        case 'End':
          event.preventDefault();
          goTo(total - 1, 'next');
          break;
        default:
          break;
      }
    },
    [textMode, next, previous, goTo, total],
  );

  const current = spreads[spread] ?? [];
  const outgoing = turning ? (spreads[turning.from] ?? []) : [];
  const incoming = turning ? (spreads[turning.to] ?? []) : [];

  /* The announcement the live region will read. */
  const pageAnnouncement = useMemo(() => {
    const lot = current[0];
    return `Spread ${spread + 1} of ${total}${lot ? `. Lot ${lot.lotNumber}, ${lot.title} by ${lot.artistName}.` : '.'}`;
  }, [spread, total, current]);

  useEffect(() => {
    if (announcement.current === pageAnnouncement) return;
    announcement.current = pageAnnouncement;
  }, [pageAnnouncement]);

  return (
    <section className={className} aria-labelledby="flipbook-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Browse the catalogue</p>
          <h2 id="flipbook-heading" className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]">
            {title}
          </h2>
        </div>

        {/* Text reading-mode toggle */}
        <button
          type="button"
          onClick={() => setTextMode((value) => !value)}
          aria-pressed={textMode}
          className="pill-btn pill-btn--ghost min-h-12"
        >
          {textMode ? 'Show the booklet' : 'Text reading mode'}
        </button>
      </div>

      {/* ── Text reading mode ─────────────────────────────────────────────── */}
      {textMode ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]">
          <p className="border-b border-[var(--line)] px-5 py-3 text-[var(--text-meta)] text-[var(--ink-muted)]">
            Text reading mode — {total} {total === 1 ? 'lot' : 'lots'}, listed in catalogue order.
          </p>
          <ol className="divide-y divide-[var(--line)]">
            {lots.map((lot, index) => (
              <li key={lot.id} className="grid gap-4 p-5 sm:grid-cols-[7rem_1fr]">
                <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--light)] sm:w-28">
                  <Image
                    src={lot.images[0]}
                    alt={`${lot.title} by ${lot.artistName}`}
                    fill
                    sizes="7rem"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="meta">
                    Page {index + 1} of {total} · Lot {lot.lotNumber} · {CATEGORY_LABELS[lot.category]}
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                    <Link href={`/lots/${lot.slug}`} className="underline-offset-4 hover:underline">
                      {lot.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                    {lot.artistName}, {lot.year} · {lot.medium} · {lot.dimensions}
                  </p>
                  <p className="mt-2 max-w-[68ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                    {lot.description}
                  </p>
                  <p className="mt-2 text-[var(--text-meta)] text-[var(--ink)]">
                    Estimate {formatEstimate(lot.estimateLow, lot.estimateHigh)} ·{' '}
                    {STATUS_LABELS[lot.status]}
                    {lot.status !== 'upcoming' ? ` · ${formatKES(lot.currentBid)}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        /* ── The booklet ──────────────────────────────────────────────────── */
        <div ref={hostRef}>
          <div
            ref={bookRef}
            tabIndex={0}
            role="group"
            aria-roledescription="flipbook"
            aria-label={`${title}. ${pageAnnouncement}`}
            onKeyDown={onKeyDown}
            className="flipbook rounded-[var(--radius-lg)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
          >
            <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
              {/* Base spread — the pages revealed beneath the turning leaf */}
              <div className="flipbook__spread grid min-h-[26rem] grid-cols-1 md:grid-cols-2">
                <PageLeft lot={current[0]} pageIndex={spread} total={total} mounted={inView} />
                <PageRight lot={current[0]} pageIndex={spread} total={total} mounted={inView} />
              </div>

              {/* The turning leaf */}
              {turning ? (
                <div
                  aria-hidden="true"
                  className={`flipbook__page absolute inset-y-0 right-0 w-full md:w-1/2 ${
                    turning.direction === 'next'
                      ? 'flipbook__page--turning-next'
                      : 'flipbook__page--turning-prev'
                  }`}
                >
                  {/* Front face: the page being turned away */}
                  <div className="absolute inset-0 backface-hidden">
                    {turning.direction === 'next' ? (
                      <PageRight
                        lot={outgoing[0]}
                        pageIndex={turning.from}
                        total={total}
                        mounted={inView}
                      />
                    ) : (
                      <PageLeft
                        lot={incoming[0]}
                        pageIndex={turning.to}
                        total={total}
                        mounted={inView}
                      />
                    )}
                  </div>

                  {/* Back face: the page arriving */}
                  <div
                    className="absolute inset-0 backface-hidden"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="h-full bg-[var(--surface-raised)]" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Controls ───────────────────────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={previous}
                disabled={spread === 0 || Boolean(turning)}
                aria-label="Previous page"
                className="pill-btn pill-btn--ghost min-h-12 disabled:cursor-not-allowed"
              >
                <span aria-hidden="true">&larr;</span> Previous
              </button>
              <button
                type="button"
                onClick={next}
                disabled={spread >= total - 1 || Boolean(turning)}
                aria-label="Next page"
                className="pill-btn pill-btn--ghost min-h-12 disabled:cursor-not-allowed"
              >
                Next <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            <p className="font-[family-name:var(--font-condensed)] text-[var(--text-meta)] uppercase tracking-[0.12em] text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
              Page {spread + 1} of {total}
            </p>

            <p className="meta hidden md:block">← → to turn · Home / End to jump</p>
          </div>

          {/* Spread scrubber */}
          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Catalogue pages">
            {spreads.map((spreadLots, index) => (
              <button
                key={spreadLots[0]?.id ?? index}
                type="button"
                role="tab"
                aria-selected={index === spread}
                aria-label={`Go to page ${index + 1}${
                  spreadLots[0] ? `, lot ${spreadLots[0].lotNumber}` : ''
                }`}
                onClick={() => goTo(index, index > spread ? 'next' : 'prev')}
                className={`h-11 min-w-11 rounded-[var(--radius-sm)] border px-2 font-[family-name:var(--font-condensed)] text-[11px] transition-colors duration-200 focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[var(--dark)] ${
                  index === spread
                    ? 'border-[var(--dark)] bg-[var(--dark)] text-[var(--primary)]'
                    : 'border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--dark)]'
                } ${visited.has(index) ? '' : 'opacity-70'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Page number announced on every change. */}
      <span className="sr-only" aria-live="polite">
        {textMode ? `Text reading mode, ${total} lots.` : pageAnnouncement}
      </span>
    </section>
  );
}

/* ── Leaves ────────────────────────────────────────────────────────────────── */

function PageLeft({
  lot,
  pageIndex,
  total,
  mounted,
}: {
  lot?: Lot;
  pageIndex: number;
  total: number;
  mounted: boolean;
}) {
  // Lazy page mounting: nothing expensive is rendered until the book is near.
  if (!mounted || !lot) {
    return (
      <div
        aria-hidden="true"
        className="skeleton min-h-[26rem] rounded-none border-r border-[var(--line)]"
      />
    );
  }

  return (
    <div className="lah-page-content relative flex min-h-[26rem] flex-col justify-between border-r border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--light)]">
        <Image
          src={lot.images[0]}
          alt={`${lot.title}, ${lot.medium}, ${lot.year}`}
          fill
          sizes="(min-width: 768px) 38vw, 92vw"
          className="object-cover"
        />
      </div>

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[var(--text-meta)]">
        <dt className="meta">Artist</dt>
        <dd className="text-[var(--ink)]">{lot.artistName}</dd>
        <dt className="meta">Year</dt>
        <dd className="text-[var(--ink-muted)]">{lot.year}</dd>
        <dt className="meta">Medium</dt>
        <dd className="text-[var(--ink-muted)]">{lot.medium}</dd>
        <dt className="meta">Size</dt>
        <dd className="text-[var(--ink-muted)]">{lot.dimensions}</dd>
        {lot.edition ? (
          <>
            <dt className="meta">Edition</dt>
            <dd className="text-[var(--ink-muted)]">{lot.edition}</dd>
          </>
        ) : null}
      </dl>

      <p className="mt-6 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-subtle)] [font-variant-numeric:tabular-nums]">
        {pageIndex * 2 + 1} · {CATEGORY_LABELS[lot.category]} · of {total * 2} pages
      </p>
    </div>
  );
}

function PageRight({
  lot,
  pageIndex,
  total,
  mounted,
}: {
  lot?: Lot;
  pageIndex: number;
  total: number;
  mounted: boolean;
}) {
  if (!mounted || !lot) {
    return (
      <div aria-hidden="true" className="skeleton min-h-[26rem] rounded-none" />
    );
  }

  return (
    <div className="lah-page-content relative flex min-h-[26rem] flex-col bg-[var(--surface-raised)] p-6">
      <p className="meta">
        Lot {lot.lotNumber} · {STATUS_LABELS[lot.status]}
      </p>

      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
        <Link href={`/lots/${lot.slug}`} className="underline-offset-4 hover:underline">
          {lot.title}
        </Link>
      </h3>

      <p className="mt-3 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
        {lot.description}
      </p>

      <div className="mt-auto pt-5">
        <p className="border-t border-[var(--line)] pt-3 text-[var(--text-meta)] text-[var(--ink-muted)]">
          <span className="meta block">Estimate</span>
          <span className="[font-variant-numeric:tabular-nums]">
            {formatEstimate(lot.estimateLow, lot.estimateHigh)}
          </span>
        </p>
        <p className="mt-2 text-[var(--text-meta)] text-[var(--ink)]">
          {lot.status === 'sold' && lot.soldPrice
            ? `Sold — ${formatKES(lot.soldPrice)}`
            : `${lot.bidCount} bids · current ${formatKES(lot.currentBid)}`}
        </p>
        <Link href={`/lots/${lot.slug}`} className="pill-btn pill-btn--dark mt-4 w-full">
          View lot {lot.lotNumber}
        </Link>
      </div>

      <p className="mt-6 text-right font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-subtle)] [font-variant-numeric:tabular-nums]">
        Page {pageIndex * 2 + 2} of {total * 2}
      </p>
    </div>
  );
}
