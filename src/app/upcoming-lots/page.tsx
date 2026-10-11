import type { Metadata } from 'next';
import Link from 'next/link';

import { upcomingAuctions } from '@/data/auctions';
import { upcomingLots } from '@/data/lots';
import { formatDate, formatEstimate, formatKES, formatTime, relativeDayLabel } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/types';
import { Countdown } from '@/components/shell/Countdown';
import { LotCard } from '@/components/lots/LotCard';
import { HorizontalRail } from '@/components/lots/HorizontalRail';
import { AuctionEventCard } from '@/components/home/AuctionEventCard';

export const metadata: Metadata = {
  title: 'Upcoming Lots',
  description:
    'Lots coming to auction in the next sales. Register early, place advance bids, or reserve a telephone line for the morning of the sale.',
  alternates: { canonical: '/upcoming-lots' },
};

export const dynamic = 'force-dynamic';

export default function UpcomingLotsPage() {
  const byAuction = upcomingAuctions.map((auction) => ({
    auction,
    lots: upcomingLots.filter((lot) => lot.auctionId === auction.id),
  }));

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">Coming to auction</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            Upcoming lots
          </h1>
          <p className="lead mt-4 max-w-[62ch]">
            {upcomingLots.length} lots already catalogued for {upcomingAuctions.length} future
            sales. Browse them now, and register so we can tell you when bidding opens.
          </p>
        </div>
      </header>

      {/* Rail of the sales themselves (EFFECT-15). */}
      <section className="shell py-12" aria-labelledby="sales-rail-heading">
        <HorizontalRail label="Sales ahead" count={upcomingAuctions.length}>
          {upcomingAuctions.map((auction) => (
            <AuctionEventCard key={auction.id} auction={auction} />
          ))}
        </HorizontalRail>
      </section>

      {/* Grouped by sale. */}
      {byAuction.map(({ auction, lots }) => (
        <section
          key={auction.id}
          id={auction.slug}
          className="shell border-t border-[var(--line)] py-12"
          aria-labelledby={`${auction.slug}-heading`}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">
                {auction.theme} · {relativeDayLabel(auction.startsAt)}
              </p>
              <h2
                id={`${auction.slug}-heading`}
                className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
              >
                {auction.title}
              </h2>
              <p className="mt-2 max-w-[68ch] text-[var(--text-body-min)] text-[var(--ink-muted)]">
                {auction.summary}
              </p>
            </div>

            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="meta">Opens</dt>
                <dd className="mt-1 text-[var(--text-ui)]">
                  {formatDate(auction.startsAt)}
                  <span className="block text-[var(--text-meta)] text-[var(--ink-muted)]">
                    {formatTime(auction.startsAt)} EAT · opens in{' '}
                    <Countdown target={auction.startsAt} variant="verbose" />
                  </span>
                </dd>
              </div>
              <div>
                <dt className="meta">Lots</dt>
                <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                  {auction.lotsCount}
                </dd>
              </div>
            </dl>
          </div>

          {lots.length > 0 ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lots.map((lot) => (
                <li key={lot.id}>
                  <LotCard lot={lot} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-[var(--text-body-min)] text-[var(--ink-muted)]">
              The catalogue for this sale is being photographed and will be published here shortly.
            </p>
          )}

          {/* Advance-bid summary. */}
          {lots.length > 0 ? (
            <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)]">
              <table className="results-table">
                <caption className="sr-only">
                  Upcoming lots in {auction.title}, with estimates and categories
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Lot</th>
                    <th scope="col">Work</th>
                    <th scope="col">Artist</th>
                    <th scope="col">Category</th>
                    <th scope="col">Estimate (KES)</th>
                    <th scope="col">Reserve</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id}>
                      <td className="[font-variant-numeric:tabular-nums]">{lot.lotNumber}</td>
                      <td>
                        <Link
                          href={`/lots/${lot.slug}`}
                          className="underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                        >
                          {lot.title}
                        </Link>
                      </td>
                      <td className="text-[var(--ink-muted)]">{lot.artistName}</td>
                      <td className="text-[var(--ink-muted)]">{CATEGORY_LABELS[lot.category]}</td>
                      <td className="[font-variant-numeric:tabular-nums]">
                        {formatEstimate(lot.estimateLow, lot.estimateHigh)}
                      </td>
                      <td className="text-[var(--ink-muted)]">
                        {lot.reserve === 0 ? 'No reserve' : formatKES(lot.reserve)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}
    </>
  );
}
