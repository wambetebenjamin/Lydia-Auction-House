import type { Metadata } from 'next';
import Link from 'next/link';

import { liveLots, soldLots } from '@/data/lots';
import { liveAuction } from '@/data/auctions';
import { formatDate } from '@/lib/format';
import { LotCard } from '@/components/lots/LotCard';

export const metadata: Metadata = {
  title: 'Lot not found',
  description: 'This lot was not found. It may have been sold.',
  robots: { index: false, follow: true },
};

/**
 * 404 — the brief specifies the copy exactly:
 *   "This lot was not found. It may have been sold."
 *   CTA: "Browse Live Auctions."
 *
 * The page is written as a saleroom notice rather than an error, and offers a
 * route back into the catalogue rather than a dead end — with real lots to
 * click, taken from the catalogue at build time.
 */
export default function NotFound() {
  const suggestions = liveLots.slice(0, 4);
  const recentlySold = soldLots[0];

  return (
    <>
      <div className="shell py-16 md:py-20">
        <div className="mx-auto max-w-[62ch] text-center">
          <p className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.24em] text-[var(--secondary)]">
            Error 404
          </p>

          {/* The design source's diamond motif, used as the notice mark. */}
          <span
            aria-hidden="true"
            className="mx-auto mt-7 grid h-20 w-20 rotate-[-45deg] place-items-center bg-[var(--primary)]"
          >
            <span className="rotate-45 font-[family-name:var(--font-display)] text-[1.75rem] font-semibold text-[var(--dark)]">
              ?
            </span>
          </span>

          <h1 className="mt-8 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            This lot was not found.
            <span className="mt-1 block text-[var(--ink-muted)]">It may have been sold.</span>
          </h1>

          <p className="mt-5 text-[var(--text-lead)] leading-relaxed text-[var(--ink-muted)]">
            The address you followed does not match anything in the catalogue. Lots are archived the
            moment they sell, and catalogue links change between sales.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/live-auctions" className="pill-btn pill-btn--dark">
              Browse Live Auctions
            </Link>
            <Link href="/lots" className="pill-btn pill-btn--ghost">
              Search the catalogue
            </Link>
            <Link href="/results" className="pill-btn pill-btn--ghost">
              Check the results
            </Link>
          </div>

          <p className="mt-6 text-[var(--text-meta)] text-[var(--ink-muted)]">
            Looking for something specific?{' '}
            <Link href="/contact" className="underline decoration-2 underline-offset-2">
              Tell us what it is
            </Link>{' '}
            and we will search the archive for you.
          </p>
        </div>
      </div>

      {/* ── Real lots, so the page is not a dead end ─────────────────────── */}
      {suggestions.length > 0 ? (
        <section className="bg-[var(--surface-sunken)] py-12" aria-labelledby="not-found-lots">
          <div className="shell">
            <h2
              id="not-found-lots"
              className="font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              Open for bidding now
            </h2>
            <p className="meta mt-1">
              {liveLots.length} lots in {liveAuction.title}, closing{' '}
              {formatDate(liveAuction.endsAt)}
            </p>
            <hr className="rule-accent mt-4" />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((lot) => (
                <li key={lot.id}>
                  <LotCard lot={lot} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {recentlySold ? (
        <div className="shell py-10 text-center">
          <p className="text-[var(--text-meta)] text-[var(--ink-muted)]">
            Recently hammered:{' '}
            <Link
              href={`/lots/${recentlySold.slug}`}
              className="font-semibold underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
            >
              {recentlySold.title}
            </Link>{' '}
            by {recentlySold.artistName}
          </p>
        </div>
      ) : null}
    </>
  );
}
