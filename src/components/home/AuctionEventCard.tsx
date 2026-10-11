'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { AuctionEvent } from '@/lib/types';
import { formatDate, formatKES, formatTime, relativeDayLabel } from '@/lib/format';
import { Countdown } from '@/components/shell/Countdown';

/**
 * An auction event card for the EFFECT-15 rail.
 * Carries the four facts the brief requires: date, theme, number of lots and
 * the top estimated lot value, plus a "Register for This Auction" CTA.
 */
export function AuctionEventCard({ auction }: { auction: AuctionEvent }) {
  const closed = auction.status === 'closed';

  return (
    <article
      className={`flex w-[19rem] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--surface)] transition-shadow duration-[260ms] sm:w-[21rem] ${
        closed ? 'border-[var(--line)]' : 'border-[var(--line-strong)] hover:shadow-[var(--shadow-md)]'
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--light)]">
        <Image
          src={auction.coverImage}
          alt={`${auction.title} — ${auction.theme}`}
          fill
          sizes="21rem"
          className="object-cover"
        />
        <div className="absolute left-3 top-3">
          <span
            className={`chip ${
              auction.status === 'live'
                ? 'chip--live'
                : auction.status === 'upcoming'
                  ? 'chip--upcoming'
                  : 'chip--sold'
            }`}
          >
            {auction.status === 'live' ? <span className="live-dot" aria-hidden="true" /> : null}
            {auction.status === 'live' ? 'Live now' : auction.status === 'closed' ? 'Closed' : 'Upcoming'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="meta">{auction.theme}</p>
        <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-[var(--text-h4)] leading-tight">
          <Link href={`/live-auctions#${auction.slug}`} className="underline-offset-4 hover:underline">
            {auction.title}
          </Link>
        </h3>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[var(--text-meta)]">
          <dt className="meta">Date</dt>
          <dd className="text-[var(--ink)]">
            {formatDate(auction.startsAt)} · {formatTime(auction.startsAt)} EAT
            <span className="block text-[var(--ink-subtle)]">{relativeDayLabel(auction.startsAt)}</span>
          </dd>

          <dt className="meta">Lots</dt>
          <dd className="text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
            {auction.lotsCount} lots
          </dd>

          <dt className="meta">Top lot</dt>
          <dd className="text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
            {formatKES(auction.topEstimate)}
          </dd>

          <dt className="meta">Venue</dt>
          <dd className="text-[var(--ink-muted)]">{auction.venue}</dd>
        </dl>

        {!closed ? (
          <p className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-[var(--text-meta)] text-[var(--ink-muted)]">
            <span className="text-[var(--ink-subtle)]">Opens in</span>
            <Countdown
              target={auction.startsAt}
              variant="verbose"
              className="font-[family-name:var(--font-condensed)] font-bold text-[var(--ink)]"
            />
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <Link
            href={closed ? '/results' : '/register'}
            className={`pill-btn w-full ${closed ? 'pill-btn--ghost' : 'pill-btn--dark'}`}
          >
            {closed ? 'View results' : 'Register for This Auction'}
          </Link>
        </div>
      </div>
    </article>
  );
}
