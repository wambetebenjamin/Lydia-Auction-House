import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { auctions, liveAuction } from '@/data/auctions';
import { buyNowLots, lotsByAuction } from '@/data/lots';
import { site } from '@/lib/site';
import { formatDate, formatKES, formatTime, relativeDayLabel } from '@/lib/format';
import { Countdown } from '@/components/shell/Countdown';
import { LotCard } from '@/components/lots/LotCard';
import { HorizontalRail } from '@/components/lots/HorizontalRail';
import { AuctionEventCard } from '@/components/home/AuctionEventCard';

export const metadata: Metadata = {
  title: 'Live Auctions',
  description:
    'The sale in progress and everything after it. Bid in real time from anywhere, or buy outright from the Buy Now selection.',
  alternates: { canonical: '/live-auctions' },
};

export const dynamic = 'force-dynamic';

export default function LiveAuctionsPage() {
  const liveLots = lotsByAuction(liveAuction.id);
  const others = auctions.filter((auction) => auction.id !== liveAuction.id);
  const upcoming = others.filter((auction) => auction.status === 'upcoming');

  return (
    <>
      {/* ══ The sale in progress ══════════════════════════════════════════ */}
      <header className="relative isolate overflow-hidden bg-[var(--surface-ink)] text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src={liveAuction.coverImage}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div aria-hidden="true" className="gradient-hero absolute inset-0 -z-10 opacity-90" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--surface-ink)] via-[var(--surface-ink)]/80 to-[var(--surface-ink)]/40"
        />

        <div className="shell py-12 md:py-16">
          <p className="flex items-center gap-3 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.2em] text-[var(--primary)]">
            <span className="live-dot text-[var(--status-live)]" aria-hidden="true" />
            In the saleroom now
          </p>
          <h1 className="mt-3 max-w-[20ch] font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight text-white">
            {liveAuction.title}
          </h1>
          <p className="mt-4 max-w-[62ch] text-[var(--text-lead)] text-white/80">
            {liveAuction.summary}
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-t border-[var(--line-ink)] pt-6">
            <div>
              <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/50">
                Closes
              </dt>
              <dd className="mt-1 text-[var(--text-ui)]">
                {formatDate(liveAuction.endsAt)} · {formatTime(liveAuction.endsAt)} EAT
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/50">
                Closes in
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] text-[var(--primary)]">
                <Countdown target={liveAuction.endsAt} variant="verbose" />
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/50">
                Lots open
              </dt>
              <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                {liveLots.length} of {liveAuction.lotsCount}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/50">
                Venue
              </dt>
              <dd className="mt-1 text-[var(--text-ui)]">{liveAuction.venue}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="pill-btn pill-btn--primary">
              Register to Bid
            </Link>
            <a href={site.whatsappLink} target="_blank" rel="noopener noreferrer" className="pill-btn pill-btn--ghost-invert">
              Ask about a lot
            </a>
          </div>
        </div>
      </header>

      {/* ══ Open lots ═════════════════════════════════════════════════════ */}
      <section className="shell py-12" aria-labelledby="open-lots-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Open for bidding</p>
            <h2
              id="open-lots-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              {liveLots.length} lots accepting bids
            </h2>
          </div>
          <p className="meta">Each lot closes independently — watch the clock on the lot page.</p>
        </div>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {liveLots.map((lot, index) => (
            <li key={lot.id}>
              <LotCard lot={lot} priority={index < 4} />
            </li>
          ))}
        </ul>

        {liveLots.length === 0 ? (
          <p className="mt-8 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-8 text-center text-[var(--text-body-min)] text-[var(--ink-muted)]">
            Every lot in this sale has closed. See the{' '}
            <Link href="/results" className="underline decoration-2 underline-offset-2">
              results archive
            </Link>{' '}
            or the{' '}
            <Link href="/upcoming-lots" className="underline decoration-2 underline-offset-2">
              next sale
            </Link>
            .
          </p>
        ) : null}
      </section>

      {/* ══ Buy Now — available outside the saleroom ══════════════════════ */}
      {buyNowLots.length > 0 ? (
        <section className="bg-[var(--surface-sunken)] py-12" aria-labelledby="buy-now-heading">
          <div className="shell">
            <p className="eyebrow">Buy It Now</p>
            <h2
              id="buy-now-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              Fixed prices, no bidding
            </h2>
            <p className="lead mt-3 max-w-[58ch]">
              Where the seller has agreed a fixed price, you can buy the work immediately at 15%
              over the figure shown — buyer&rsquo;s premium included, no auction to wait for.
            </p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {buyNowLots.map((lot) => (
                <li key={lot.id}>
                  <LotCard lot={lot} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ══ The rest of the calendar ══════════════════════════════════════ */}
      <section className="shell py-14" aria-labelledby="calendar-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="eyebrow">Later in the year</p>
          <Link href="/auction" className="text-[var(--text-meta)] underline decoration-2 underline-offset-2">
            See the full auction calendar
          </Link>
        </div>
        <div className="mt-2">
          <HorizontalRail label="Coming sales" count={upcoming.length}>
            {upcoming.map((auction) => (
              <AuctionEventCard key={auction.id} auction={auction} />
            ))}
          </HorizontalRail>
        </div>

        <div className="mt-10 divide-y divide-[var(--line)] border-t border-[var(--line)]">
          {others.map((auction) => (
            <article
              key={auction.id}
              id={auction.slug}
              className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="meta">
                  {auction.theme} · {relativeDayLabel(auction.startsAt)}
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
                  {auction.title}
                </h3>
                <p className="mt-1 max-w-[68ch] text-[var(--text-body-min)] text-[var(--ink-muted)]">
                  {auction.summary}
                </p>
                <p className="meta mt-2">
                  {formatDate(auction.startsAt)} · {formatTime(auction.startsAt)} EAT ·{' '}
                  {auction.lotsCount} lots · top estimate {formatKES(auction.topEstimate)}
                </p>
              </div>
              <Link
                href={auction.status === 'closed' ? '/results' : '/register'}
                className={`pill-btn shrink-0 ${
                  auction.status === 'closed' ? 'pill-btn--ghost' : 'pill-btn--dark'
                }`}
              >
                {auction.status === 'closed' ? 'View results' : 'Register for This Auction'}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
