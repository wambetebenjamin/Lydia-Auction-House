import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { auctions, liveAuction } from '@/data/auctions';
import { lotsByAuction } from '@/data/lots';
import { site } from '@/lib/site';
import { formatDate, formatKES, formatTime, relativeDayLabel } from '@/lib/format';
import { Countdown } from '@/components/shell/Countdown';
import { HorizontalRail } from '@/components/lots/HorizontalRail';
import { AuctionEventCard } from '@/components/home/AuctionEventCard';

export const metadata: Metadata = {
  title: 'Auction Calendar',
  description:
    'Every sale on the Lydia Auction House calendar — the sale in progress, the sales ahead, and the archive of results.',
  alternates: { canonical: '/auction' },
};

export const dynamic = 'force-dynamic';

/**
 * THE CALENDAR — /auction
 *
 * The brief lists `/auction` alongside the live room at `/auction/[id]`: this is
 * the page that answers "what is coming up and when", while `/live-auctions`
 * answers "what can I bid on right now" and `/upcoming-lots` works lot by lot.
 * The upcoming rail is EFFECT-15, so it scrolls and reads out as
 * "Upcoming auctions, N items."
 */
export default function AuctionCalendarPage() {
  const upcoming = auctions.filter((a) => a.status === 'upcoming');
  const closed = auctions.filter((a) => a.status === 'closed');
  const capacity = auctions.reduce((sum, auction) => sum + auction.lotsCount, 0);

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">Calendar</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            Auction calendar
          </h1>
          <p className="lead mt-4 max-w-[62ch]">
            {auctions.length} sales this season, {capacity} lots catalogued in total. Sales run in
            the saleroom on Kimathi Street and online at the same time — a bid placed from Mombasa
            or Manchester competes on exactly the same terms as one placed in the room.
          </p>
          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--line)] pt-5">
            <div>
              <dt className="meta">Bidding now</dt>
              <dd className="mt-1 text-[var(--text-ui)]">{liveAuction.title}</dd>
            </div>
            <div>
              <dt className="meta">Sales ahead</dt>
              <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                {upcoming.length}
              </dd>
            </div>
            <div>
              <dt className="meta">Conducted</dt>
              <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                {closed.length}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ══ Sale in progress ══════════════════════════════════════════════ */}
      <section className="shell py-12" aria-labelledby="now-heading">
        <p className="eyebrow flex items-center gap-3">
          <span className="live-dot text-[var(--status-live)]" aria-hidden="true" />
          On the rostrum
        </p>
        <h2
          id="now-heading"
          className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
        >
          {liveAuction.title}
        </h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--light)]">
            <Image
              src={liveAuction.coverImage}
              alt={`Works from ${liveAuction.title} in the saleroom`}
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>

          <dl className="grid content-start gap-5">
            <div>
              <dt className="meta">Closes</dt>
              <dd className="mt-1 text-[var(--text-ui)]">
                {formatDate(liveAuction.endsAt)} · {formatTime(liveAuction.endsAt)} EAT
                <span className="mt-1 block font-[family-name:var(--font-display)] text-[var(--text-h4)] text-[var(--secondary)]">
                  <Countdown target={liveAuction.endsAt} variant="verbose" />
                </span>
              </dd>
            </div>
            <div>
              <dt className="meta">Where</dt>
              <dd className="mt-1 text-[var(--text-ui)]">{liveAuction.venue}</dd>
            </div>
            <div>
              <dt className="meta">Lots</dt>
              <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                {lotsByAuction(liveAuction.id).filter((lot) => lot.status === 'live').length} open of{' '}
                {liveAuction.lotsCount}
              </dd>
            </div>
            <div>
              <dt className="meta">Top estimate</dt>
              <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                {formatKES(liveAuction.topEstimate)}
              </dd>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/live-auctions" className="pill-btn pill-btn--dark">
                Browse Live Auctions
              </Link>
              <Link href="/register" className="pill-btn pill-btn--ghost">
                Register to Bid
              </Link>
            </div>
          </dl>
        </div>
      </section>

      {/* ══ EFFECT-15 rail of what is coming ══════════════════════════════ */}
      <section className="bg-[var(--surface-sunken)] py-12">
        <div className="shell">
          <HorizontalRail label="Upcoming auctions" count={upcoming.length}>
            {upcoming.map((auction) => (
              <AuctionEventCard key={auction.id} auction={auction} />
            ))}
          </HorizontalRail>
        </div>
      </section>

      {/* ══ The calendar proper ═══════════════════════════════════════════ */}
      <section className="shell py-12" aria-labelledby="calendar-heading">
        <p className="eyebrow">Dates</p>
        <h2
          id="calendar-heading"
          className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
        >
          Sale by sale
        </h2>
        <hr className="rule-accent mt-4" />

        <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {auctions.map((auction) => {
            const lots = lotsByAuction(auction.id);
            return (
              <article key={auction.id} id={auction.slug} className="grid gap-6 py-7 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <p className="meta">
                    {formatDate(auction.startsAt)} · {relativeDayLabel(auction.startsAt)} ·{' '}
                    {formatTime(auction.startsAt)} EAT
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
                    {auction.title}
                  </h3>
                  <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                    {auction.theme} · {auction.venue}, {auction.city}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-[var(--ink-subtle)]">
                    {auction.status === 'live' ? (
                      <span className="text-[var(--status-live)]">Bidding open</span>
                    ) : auction.status === 'upcoming' ? (
                      <span className="text-[var(--status-upcoming)]">Cataloguing</span>
                    ) : (
                      'Sale concluded'
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                    {auction.summary}
                  </p>
                  <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                    <div>
                      <dt className="meta">Lots</dt>
                      <dd className="mt-0.5 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                        {auction.lotsCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="meta">Top estimate</dt>
                      <dd className="mt-0.5 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                        {formatKES(auction.topEstimate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="meta">Closing</dt>
                      <dd className="mt-0.5 text-[var(--text-ui)]">
                        <Countdown target={auction.endsAt} variant="verbose" />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {auction.status === 'live' ? (
                      <>
                        {lots[0] ? (
                          <Link href={`/auction/${lots[0].slug}`} className="pill-btn pill-btn--dark">
                            Enter the saleroom
                          </Link>
                        ) : null}
                        <Link href="/lots?status=live" className="pill-btn pill-btn--ghost">
                          All open lots
                        </Link>
                      </>
                    ) : auction.status === 'upcoming' ? (
                      <>
                        <Link href={`/upcoming-lots#${auction.slug}`} className="pill-btn pill-btn--dark">
                          See the {lots.length} catalogued lots
                        </Link>
                        <Link href="/register" className="pill-btn pill-btn--ghost">
                          Register for This Auction
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href={`/results#${auction.slug}`} className="pill-btn pill-btn--dark">
                          View results
                        </Link>
                        <Link href="/sell#submit" className="pill-btn pill-btn--ghost">
                          Consign to the next sale
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ══ Practical notes ══════════════════════════════════════════════ */}
      <section className="bg-[var(--surface-ink)] py-14 text-white" aria-labelledby="practical-heading">
        <div className="shell grid gap-10 lg:grid-cols-3">
          <div>
            <h2 id="practical-heading" className="eyebrow-invert">
              Bidding in the room
            </h2>
            <p className="mt-3 text-[var(--text-body-min)] leading-relaxed text-white/72">
              Doors open two hours before the first lot. Register at the desk, or online in advance
              and quote your paddle number on arrival. Seats are unreserved.
            </p>
          </div>
          <div>
            <h2 className="eyebrow-invert">Bidding online</h2>
            <p className="mt-3 text-[var(--text-body-min)] leading-relaxed text-white/72">
              The saleroom broadcast runs on every lot page, with the same increments as the room. If
              your connection drops, bids refresh automatically every two seconds until it returns.
            </p>
          </div>
          <div>
            <h2 className="eyebrow-invert">Payment and collection</h2>
            <p className="mt-3 text-[var(--text-body-min)] leading-relaxed text-white/72">
              Hammer plus 15% buyer&rsquo;s premium, payable within seven days; collection within
              fourteen. Full terms are in the{' '}
              <Link href="/legal/terms" className="underline decoration-2 underline-offset-2">
                terms of sale
              </Link>
              .
            </p>
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn pill-btn--primary mt-5"
            >
              Ask about a sale
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
