import type { Metadata } from 'next';
import Link from 'next/link';

import { auctionById, auctions, closedAuctions } from '@/data/auctions';
import { soldLots } from '@/data/lots';
import { artists } from '@/data/artists';
import { formatDate, formatEstimate, formatKES, formatNumber, pluralise } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Results',
  description:
    'Hammer prices achieved at Lydia Auction House. Every sold lot, with its estimate and the price it made, updated after each sale.',
  alternates: { canonical: '/results' },
};

/** ISR — per the brief, results pages revalidate hourly. */
export const revalidate = 3600;

export default function ResultsPage() {
  const totalHammer = soldLots.reduce((sum, lot) => sum + (lot.soldPrice ?? 0), 0);
  const withEstimateMid = soldLots.filter((lot) => lot.soldPrice);
  const aboveHigh = withEstimateMid.filter(
    (lot) => (lot.soldPrice ?? 0) > lot.estimateHigh,
  ).length;
  const inEstimate = withEstimateMid.filter(
    (lot) => (lot.soldPrice ?? 0) >= lot.estimateLow && (lot.soldPrice ?? 0) <= lot.estimateHigh,
  ).length;
  const bestLot = [...soldLots].sort((a, b) => (b.soldPrice ?? 0) - (a.soldPrice ?? 0))[0];

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">Archive</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            Results
          </h1>
          <p className="lead mt-4 max-w-[64ch]">
            Hammer prices achieved at the house. They are published for every lot we sell, whatever
            the outcome, so that consignors and buyers can judge the market honestly.
          </p>

          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5 border-t border-[var(--line)] pt-6">
            <div>
              <dt className="meta">Lots sold to date</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] [font-variant-numeric:tabular-nums]">
                {soldLots.length}
              </dd>
            </div>
            <div>
              <dt className="meta">Total hammer</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] [font-variant-numeric:tabular-nums]">
                {formatKES(totalHammer)}
              </dd>
            </div>
            <div>
              <dt className="meta">Sold within estimate</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] [font-variant-numeric:tabular-nums]">
                {inEstimate}/{withEstimateMid.length}
              </dd>
            </div>
            <div>
              <dt className="meta">Above high estimate</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] [font-variant-numeric:tabular-nums]">
                {aboveHigh}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="shell space-y-14 py-12">
        {/* ══ Sales summary ══════════════════════════════════════════════ */}
        <section aria-labelledby="sales-heading">
          <p className="eyebrow">By sale</p>
          <h2
            id="sales-heading"
            className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
          >
            Sales to date
          </h2>
          <hr className="rule-accent mt-4" />

          <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {auctions.map((auction) => {
              const lotsInSale = soldLots.filter((lot) => lot.auctionId === auction.id);
              const hammer = lotsInSale.reduce((sum, lot) => sum + (lot.soldPrice ?? 0), 0);
              return (
                <li
                  key={auction.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-6"
                >
                  <p className="meta">{formatDate(auction.startsAt)}</p>
                  <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
                    {auction.title}
                  </h3>
                  <p className="mt-2 text-[var(--text-meta)] text-[var(--ink-muted)]">
                    {lotsInSale.length} {pluralise(lotsInSale.length, 'lot')} sold · total hammer{' '}
                    <strong className="font-semibold text-[var(--ink)]">{formatKES(hammer)}</strong>
                  </p>
                  <p className="mt-3 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
                    {auction.summary}
                  </p>
                  <Link
                    href={`#${auction.slug}`}
                    className="pill-btn pill-btn--ghost mt-5 w-full"
                  >
                    See the {lotsInSale.length} results
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ══ Highest price of the season ════════════════════════════════ */}
        {bestLot ? (
          <section
            className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-7"
            aria-labelledby="top-lot-heading"
          >
            <p className="eyebrow">Top price of the season</p>
            <h2
              id="top-lot-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              {bestLot.title}
            </h2>
            <p className="mt-2 text-[var(--text-body-min)] text-[var(--ink-muted)]">
              {bestLot.artistName} · {bestLot.year} · {bestLot.medium}, {bestLot.dimensions} ·{' '}
              {CATEGORY_LABELS[bestLot.category]}
            </p>
            <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--line)] pt-5">
              <div>
                <dt className="meta">Estimate</dt>
                <dd className="mt-1 [font-variant-numeric:tabular-nums]">
                  {formatEstimate(bestLot.estimateLow, bestLot.estimateHigh)}
                </dd>
              </div>
              <div>
                <dt className="meta">Hammer price</dt>
                <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h3)] text-[var(--secondary)] [font-variant-numeric:tabular-nums]">
                  {formatKES(bestLot.soldPrice ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="meta">Against high estimate</dt>
                <dd className="mt-1 [font-variant-numeric:tabular-nums]">
                  +{formatNumber(
                    Math.round((((bestLot.soldPrice ?? 0) - bestLot.estimateHigh) / bestLot.estimateHigh) * 100),
                  )}
                  %
                </dd>
              </div>
            </dl>
            <Link href={`/lots/${bestLot.slug}`} className="pill-btn pill-btn--dark mt-6">
              View the lot
            </Link>
          </section>
        ) : null}

        {/* ══ Full results table, grouped by sale ════════════════════════ */}
        {closedAuctions.map((auction) => {
          const rows = soldLots.filter((lot) => lot.auctionId === auction.id);
          if (rows.length === 0) return null;
          return (
            <section key={auction.id} id={auction.slug} className="scroll-mt-[calc(var(--nav-h)+1.5rem)]">
              <h2 className="font-[family-name:var(--font-display)] text-[var(--text-h2)]">
                {auction.title}
              </h2>
              <p className="meta mt-1">
                {formatDate(auction.startsAt)} · {auction.venue} · {auction.theme}
              </p>
              <hr className="rule-accent mt-4" />

              <div className="mt-5 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]">
                <table className="results-table min-w-[820px]">
                  <caption className="sr-only">
                    Results for {auction.title}, with estimate and hammer price in Kenyan Shillings
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Lot</th>
                      <th scope="col">Work</th>
                      <th scope="col">Artist</th>
                      <th scope="col">Estimate (KES)</th>
                      <th scope="col">Hammer (KES)</th>
                      <th scope="col">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((lot) => {
                      const sold = lot.soldPrice ?? 0;
                      const outcome =
                        sold > lot.estimateHigh
                          ? { label: 'Above estimate', tone: 'text-[var(--status-success)]' }
                          : sold < lot.estimateLow
                            ? { label: 'Below estimate', tone: 'text-[var(--ink-muted)]' }
                            : { label: 'Within estimate', tone: 'text-[var(--secondary)]' };
                      return (
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
                          <td className="text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
                            {formatEstimate(lot.estimateLow, lot.estimateHigh)}
                          </td>
                          <td className="font-semibold [font-variant-numeric:tabular-nums]">
                            {sold ? formatKES(sold) : '—'}
                          </td>
                          <td className={`text-[var(--text-meta)] ${outcome.tone}`}>
                            {sold ? outcome.label : 'Not sold'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-[var(--ink-subtle)]">
                Hammer prices exclude the 15% buyer&rsquo;s premium and any applicable VAT.
              </p>
            </section>
          );
        })}

        {/* ══ Records by artist ══════════════════════════════════════════ */}
        <section aria-labelledby="records-heading">
          <p className="eyebrow">Records</p>
          <h2
            id="records-heading"
            className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
          >
            Best price by artist
          </h2>
          <hr className="rule-accent mt-4" />

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => {
              const artistLots = soldLots.filter(
                (lot) => lot.artistSlug === artist.slug && lot.soldPrice,
              );
              if (artistLots.length === 0) return null;
              const best = artistLots.reduce((a, b) => ((a.soldPrice ?? 0) >= (b.soldPrice ?? 0) ? a : b));
              return (
                <li
                  key={artist.slug}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/artists/${artist.slug}`}
                      className="block font-[family-name:var(--font-display)] text-[var(--text-ui)] underline-offset-4 hover:underline"
                    >
                      {artist.name}
                    </Link>
                    <span className="mt-0.5 block text-[11px] text-[var(--ink-subtle)]">
                      {artistLots.length} {pluralise(artistLots.length, 'work')} sold
                    </span>
                  </span>
                  <span className="shrink-0 font-[family-name:var(--font-condensed)] text-[var(--text-ui)] text-[var(--secondary)] [font-variant-numeric:tabular-nums]">
                    {formatKES(best.soldPrice ?? 0)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ══ Sell CTA ══════════════════════════════════════════════════ */}
        <section className="gradient-band rounded-[var(--radius-lg)] px-7 py-10 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-[var(--text-h2)] text-[var(--dark)]">
            Thinking of selling?
          </h2>
          <p className="mx-auto mt-3 max-w-[54ch] text-[var(--text-body-min)] leading-relaxed text-[var(--dark)]/80">
            These are the prices our consignors have achieved. A free assessment takes three working
            days and commits you to nothing.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/sell#submit" className="pill-btn pill-btn--dark">
              Submit a work for assessment
            </Link>
            <Link href="/upcoming-lots" className="pill-btn pill-btn--ghost">
              See what is coming up
            </Link>
          </div>
        </section>

        <p className="text-[11px] leading-relaxed text-[var(--ink-subtle)]">
          Results are published after each sale and updated as invoices are settled. Occasional
          post-sale corrections are made here and noted in the sale&rsquo;s printed list. Auctioned
          by {auctionById.get(auctions[0].id)?.venue ?? 'Lydia Auction House'}, Nairobi.
        </p>
      </div>
    </>
  );
}
