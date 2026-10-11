'use client';

/**
 * HERO — EFFECT-01, EFFECT-04, EFFECT-09, EFFECT-18, EFFECT-23 together.
 *
 * EFFECT-23 (Hero entrance), sequenced and completed in under 1.6 seconds:
 *
 *     0 ms   auction house name eyebrow
 *   120 ms   headline, per-letter stagger at 18 ms → settled by  ~860 ms
 *   620 ms   sub-copy
 *   740 ms   the two CTAs
 *   880 ms   featured artwork visual
 *
 * The CTA is **focusable immediately** — nothing in the sequence sets
 * `pointer-events: none`, `visibility: hidden` or `inert`, and the buttons are
 * ordinary links in the tab order from first paint. A visitor can Tab to
 * "Browse Live Auctions" before the animation has finished.
 *
 * EFFECT-18 — the animated gradient sits behind the photograph as a wash, using
 * `background-position` only, frozen under reduced motion.
 *
 * EFFECT-09 — the morphing brush / chisel / lens SVG sits beside the headline.
 *
 * EFFECT-01 — the featured lot's 3D render sits in the right column.
 */

import Image from 'next/image';
import Link from 'next/link';
import type { AuctionEvent, Lot } from '@/lib/types';
import { formatCountdownClock, formatDateTime, formatKES } from '@/lib/format';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { HeroHeadline } from '@/components/effects/HeroHeadline';
import { SvgMorph } from '@/components/effects/SvgMorph';
import { FeaturedLotCanvas } from '@/components/three/FeaturedLotCanvas';
import { Countdown } from '@/components/shell/Countdown';

interface HeroProps {
  lot: Lot;
  auction: AuctionEvent;
}

/* Sequence offsets, in milliseconds. Total ≤ 1,600 ms. */
const T = {
  eyebrow: 0,
  headline: 120,
  subCopy: 620,
  cta: 740,
  visual: 880,
} as const;

export function Hero({ lot, auction }: HeroProps) {
  const reduced = usePrefersReducedMotion();

  // Under reduced motion every stage is instant (EFFECT-23).
  const delay = (ms: number) => (reduced ? 0 : ms);
  const stageClass = reduced ? '' : 'lah-stage';

  return (
    <section className="relative isolate overflow-hidden bg-[var(--surface-ink)] text-white">
      {/* ── Backdrop: the editorial gallery photograph ───────────────────── */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/hero-gallery.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* ── EFFECT-18: animated gradient wash over the photograph ────────── */}
      <div
        aria-hidden="true"
        className="gradient-hero absolute inset-0 -z-10 opacity-[0.86] mix-blend-multiply"
      />
      {/* Contrast floor: an ink scrim keeps white text above 7:1 everywhere. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--surface-ink)] via-[var(--surface-ink)]/72 to-[var(--surface-ink)]/28"
      />

      <div className="shell grid gap-12 pb-16 pt-14 md:pb-20 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-24 lg:pt-24">
        {/* ── Left column: the sequenced copy ──────────────────────────── */}
        <div className="flex flex-col justify-center">
          {/* Stage 1 — the auction house name. This page's single <h1>. */}
          <p
            className={`eyebrow-invert flex flex-wrap items-center gap-x-3 gap-y-2 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.26em] text-[var(--primary)] ${stageClass}`}
            style={{ animationDelay: `${delay(T.eyebrow)}ms` }}
          >
            <span className="inline-block h-[2px] w-8 bg-[var(--primary)]" aria-hidden="true" />
            <span>Lydia Auction House · Nairobi</span>
          </p>

          {/* Stage 2 — the headline, with the morph beside it (EFFECT-09). */}
          <div
            className={`mt-5 flex items-start gap-5 ${stageClass}`}
            style={{ animationDelay: `${delay(T.headline)}ms` }}
          >
            <SvgMorph className="mt-2 hidden sm:inline-grid" />
            <HeroHeadline
              as="h2"
              text="East African Art Deserves a World Stage."
              glitch="Art"
              startDelay={reduced ? 0 : T.headline + 60}
              stagger={reduced ? 0 : 18}
              className="font-[family-name:var(--font-display)] text-[clamp(2.25rem,5.4vw,4.25rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-white"
            />
          </div>

          {/* Stage 3 — sub-copy */}
          <p
            className={`mt-6 max-w-[52ch] text-[var(--text-lead)] leading-relaxed text-white/82 ${stageClass}`}
            style={{ animationDelay: `${delay(T.subCopy)}ms` }}
          >
            Live and online auctions of authentic East African paintings, sculpture, and craft.
          </p>

          {/* Stage 4 — the two CTAs. Focusable from first paint. */}
          <div
            className={`mt-8 flex flex-wrap gap-3 ${stageClass}`}
            style={{ animationDelay: `${delay(T.cta)}ms` }}
          >
            <Link href="/live-auctions" className="pill-btn pill-btn--primary">
              Browse Live Auctions
            </Link>
            <Link href="/register" className="pill-btn pill-btn--ghost-invert">
              Register to Bid
            </Link>
          </div>

          {/* Live auction status — real numbers, not a strapline. */}
          <div
            className={`mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[var(--line-ink)] pt-6 ${stageClass}`}
            style={{ animationDelay: `${delay(T.visual)}ms` }}
          >
            <p className="flex items-center gap-2 font-[family-name:var(--font-condensed)] text-[var(--text-meta)] uppercase tracking-[0.14em] text-white/70">
              <span className="live-dot text-[var(--status-live)]" aria-hidden="true" />
              In the saleroom now
            </p>
            <p className="text-[var(--text-meta)] text-white/70">
              <span className="text-white/45">Closes in </span>
              <Countdown
                target={auction.endsAt}
                className="font-[family-name:var(--font-condensed)] text-[var(--text-ui)] font-bold text-[var(--primary)]"
              />
            </p>
            <p className="text-[var(--text-meta)] text-white/70">
              {auction.lotsCount} lots · {auction.venue}
            </p>
          </div>
        </div>

        {/* ── Right column: EFFECT-01, the featured lot in 3D ──────────── */}
        <div
          className={`flex flex-col justify-center ${stageClass}`}
          style={{ animationDelay: `${delay(T.visual)}ms` }}
        >
          <div className="relative rounded-[var(--radius-lg)] border border-[var(--line-ink)] bg-[var(--surface-ink)]/55 p-5 backdrop-blur-[6px]">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="eyebrow-invert font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.18em] text-[var(--primary)]">
                  Lot of the sale
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] text-white">
                  {lot.title}
                </p>
                <p className="text-[var(--text-meta)] text-white/65">
                  {lot.artistName} · {lot.year}
                </p>
              </div>
              <Link
                href={`/lots/${lot.slug}`}
                className="shrink-0 text-[var(--text-meta)] text-[var(--primary)] underline decoration-2 underline-offset-4 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                Full details
              </Link>
            </div>

            <FeaturedLotCanvas lot={lot} />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-ink)] pt-4">
              <p className="text-[var(--text-meta)] text-white/60">
                Estimate {formatKES(lot.estimateLow)} – {formatKES(lot.estimateHigh)}
              </p>
              <Link href={`/auction/${lot.slug}`} className="pill-btn pill-btn--secondary min-h-11">
                Enter the auction room
              </Link>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-white/45">
            Closing {formatDateTime(lot.closesAt)} East Africa Time · closing in{' '}
            {formatCountdownClock(lot.closesAt)}. Purchases are subject to a 15% buyer&rsquo;s
            premium.
          </p>
        </div>
      </div>
    </section>
  );
}
