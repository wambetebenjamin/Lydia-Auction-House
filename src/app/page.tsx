import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { site } from '@/lib/site';
import { auctions, liveAuction, upcomingAuctions } from '@/data/auctions';
import { artists } from '@/data/artists';
import { catalogueOrder, featuredLots, heroLot, liveLots, soldLots } from '@/data/lots';
import { formatKES, formatNumber, initials } from '@/lib/format';
import { parseQuery, queryLots } from '@/lib/lots-query';

import { Hero } from '@/components/home/Hero';
import { AuctionEventCard } from '@/components/home/AuctionEventCard';
import { HorizontalRail } from '@/components/lots/HorizontalRail';
import { LotCard } from '@/components/lots/LotCard';
import { Flipbook } from '@/components/catalogue/Flipbook';
import { NewsletterForm } from '@/components/forms/NewsletterForm';

export const metadata: Metadata = {
  title: 'Lydia Auction House — Live & Online Auctions of East African Art',
  description:
    'Live and online auctions of authentic East African paintings, sculpture, and craft. Bid in real time from Nairobi, or buy outright from the catalogue.',
  alternates: { canonical: '/' },
};

const SELL_STEPS = [
  {
    step: '01',
    title: 'Submit for Assessment',
    body: 'Send us photographs and a short description of the work. Our specialists assess condition, provenance and market, and come back within three working days with an honest view — including when the answer is no.',
    detail: 'Free · 3 working days',
  },
  {
    step: '02',
    title: 'Agree Reserve and Terms',
    body: 'We propose an estimate range, a reserve and a sale date. You approve both in writing. Nothing goes to auction, and no work is photographed or listed, until you sign.',
    detail: 'Reserve set by you',
  },
  {
    step: '03',
    title: 'We Auction on Your Behalf',
    body: 'The work is catalogued, photographed in the gallery, marketed to our bidder list, and offered in the saleroom and online simultaneously. Payment reaches you within fourteen days of the sale.',
    detail: 'Paid within 14 days',
  },
] as const;

export default function HomePage() {
  /* The home teaser reuses the same query engine as /api/lots, so the two can
     never disagree about what "live" or "ending soon" means. */
  const teaser = queryLots(parseQuery({ sort: 'ending-soon', perPage: '8' }));
  const closedSales = auctions.filter((a) => a.status === 'closed');

  return (
    <>
      {/* ══ HERO — EFFECT-01, 04, 09, 18, 23 ═══════════════════════════════ */}
      <Hero lot={heroLot} auction={liveAuction} />

      {/* ══ FEATURED LOTS — EFFECT-15, 26 ══════════════════════════════════ */}
      <section className="section" aria-labelledby="featured-lots-heading">
        <div className="shell">
          <p className="eyebrow">In the saleroom</p>
          <div className="mt-2">
            <HorizontalRail label="Featured lots" count={featuredLots.length}>
              {featuredLots.map((lot, index) => (
                <LotCard key={lot.id} lot={lot} variant="rail" priority={index < 2} />
              ))}
            </HorizontalRail>
          </div>
        </div>
      </section>

      {/* ══ UPCOMING AUCTIONS — EFFECT-15 ══════════════════════════════════ */}
      <section className="section bg-[var(--surface-sunken)]" aria-labelledby="upcoming-auctions-heading">
        <div className="shell">
          <p className="eyebrow">Save the date</p>
          <div className="mt-2">
            <HorizontalRail label="Upcoming auctions" count={upcomingAuctions.length}>
              {upcomingAuctions.map((auction) => (
                <AuctionEventCard key={auction.id} auction={auction} />
              ))}
            </HorizontalRail>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/live-auctions" className="pill-btn pill-btn--dark">
              All auctions
            </Link>
            <Link href="/upcoming-lots" className="pill-btn pill-btn--ghost">
              Browse upcoming lots
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CATALOGUE FLIPBOOK — EFFECT-30 ═════════════════════════════════ */}
      <section className="section" aria-labelledby="catalogue-heading">
        <div className="shell">
          <Flipbook lots={catalogueOrder.slice(0, 12)} title="Auction Catalogue" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/catalogue" className="pill-btn pill-btn--dark">
              Full catalogue
            </Link>
            <Link href="/lots" className="pill-btn pill-btn--ghost">
              Search every lot
            </Link>
          </div>
        </div>
      </section>

      {/* ══ LOT BROWSING TEASER — EFFECT-24, EFFECT-26 ═════════════════════ */}
      <section className="section bg-[var(--surface-sunken)]" aria-labelledby="browse-heading">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Closing soonest</p>
              <h2
                id="browse-heading"
                className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
              >
                Eight lots to watch
              </h2>
            </div>
            <Link href="/lots" className="pill-btn pill-btn--ghost">
              Search all {formatNumber(catalogueOrder.length)} lots
            </Link>
          </div>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teaser.items.map((lot, index) => (
              <li key={lot.id}>
                <LotCard lot={lot} priority={index < 4} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ SELL WITH US ═══════════════════════════════════════════════════ */}
      <section className="section" aria-labelledby="sell-heading">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <p className="eyebrow">Sell with Us</p>
              <h2
                id="sell-heading"
                className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
              >
                Three steps from your wall to the saleroom
              </h2>
              <hr className="rule-accent mt-4" />
              <p className="lead mt-5 max-w-[48ch]">
                We have placed East African work with collectors in Kenya, Uganda, Tanzania,
                Ethiopia, South Africa, the United Kingdom and the United States. Consigning with
                the house is free until the work sells.
              </p>
              <Link href="/sell" className="pill-btn pill-btn--dark mt-6">
                Start a consignment
              </Link>

              <dl className="mt-9 grid grid-cols-2 gap-6 border-t border-[var(--line)] pt-6">
                <div>
                  <dt className="meta">Lots sold to date</dt>
                  <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
                    {formatNumber(soldLots.length + 318)}
                  </dd>
                </div>
                <div>
                  <dt className="meta">Sell-through rate</dt>
                  <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
                    84%
                  </dd>
                </div>
              </dl>
            </div>

            <ol className="grid gap-6">
              {SELL_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-6"
                >
                  {/* The design source's diamond motif, carried forward: a
                      rotated square with a counter-rotated numeral inside. */}
                  <div className="flex items-start gap-5">
                    <span
                      aria-hidden="true"
                      className="grid h-14 w-14 shrink-0 rotate-[-45deg] place-items-center bg-[var(--primary)]"
                    >
                      <span className="rotate-[45deg] font-[family-name:var(--font-condensed)] text-[var(--text-ui)] font-bold text-[var(--dark)]">
                        {item.step}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                        {item.body}
                      </p>
                      <p className="mt-3 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-[var(--secondary)]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ══ ARTISTS ════════════════════════════════════════════════════════ */}
      <section className="section bg-[var(--surface-ink)] text-white" aria-labelledby="artists-heading">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow-invert font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.18em] text-[var(--primary)]">
                Represented
              </p>
              <h2
                id="artists-heading"
                className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)] text-white"
              >
                The artists
              </h2>
            </div>
            <Link href="/artists" className="pill-btn pill-btn--ghost-invert">
              All artists
            </Link>
          </div>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artists.slice(0, 8).map((artist) => (
              <li key={artist.slug}>
                <Link
                  href={`/artists/${artist.slug}`}
                  className="group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-ink)] bg-[var(--surface-ink-raised)] transition-colors duration-300 hover:border-[var(--primary)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--primary)]"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden bg-[var(--surface-ink-sunken)]">
                    <Image
                      src={artist.portrait}
                      alt={artist.portraitAlt}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 100vw"
                      className="object-cover transition-transform duration-[400ms] ease-[var(--ease-out)] group-hover:scale-[1.04] motion-reduce:transform-none"
                    />
                  </span>
                  <span className="block p-5">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--primary)] font-[family-name:var(--font-condensed)] text-[12px] font-bold text-[var(--dark)]"
                      >
                        {initials(artist.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-[family-name:var(--font-display)] text-[var(--text-h4)] text-white">
                          {artist.name}
                        </span>
                        <span className="block text-[var(--text-meta)] text-white/60">
                          {artist.location}, {artist.country}
                        </span>
                      </span>
                    </span>
                    <span className="mt-3 block text-[var(--text-meta)] text-white/70">
                      {artist.medium}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ RESULTS + CTA BAND — EFFECT-18 ═════════════════════════════════ */}
      <section
        className="gradient-band relative overflow-hidden text-[var(--dark)]"
        aria-labelledby="cta-heading"
      >
        <div className="shell py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-16">
            <div>
              <p className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--dark)]/70">
                Past results
              </p>
              <h2
                id="cta-heading"
                className="mt-2 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight"
              >
                Every hammer price, published in full.
              </h2>
              <p className="mt-4 max-w-[52ch] text-[var(--text-lead)] text-[var(--dark)]/80">
                We publish the results of every sale — including the lots that did not find a buyer.
                Download the archive as a PDF, or filter it by date, category and artist.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/results" className="pill-btn pill-btn--dark">
                  Browse past results
                </Link>
                <Link
                  href="/results?download=pdf"
                  className="pill-btn border-2 border-[var(--dark)] text-[var(--dark)] hover:bg-[var(--dark)] hover:text-[var(--primary)]"
                >
                  Download results PDF
                </Link>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] bg-[var(--surface)]/92 p-6 backdrop-blur-[3px]">
              <NewsletterForm source="home" tone="light" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ HISTORY STRIP ══════════════════════════════════════════════════ */}
      <section className="section" aria-labelledby="history-heading">
        <div className="shell grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--light)]">
            <Image
              src="/images/hero-gallery.jpg"
              alt="The house saleroom on Kimathi Street, hung with work from the current sale"
              fill
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="eyebrow">The house</p>
            <h2
              id="history-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              Seventeen years on Kimathi Street
            </h2>
            <hr className="rule-accent mt-4" />
            <p className="mt-5 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              Lydia Auction House opened in 2009 as a single room above a printer&rsquo;s on
              Kimathi Street, selling work by four painters from Kisumu. We now run five sales a
              year across painting, sculpture, photography, jewellery, textiles and studio ceramics,
              and every one of them is simulcast online.
            </p>
            <p className="mt-4 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              We buy nothing ourselves and we own none of the work we sell. That independence is the
              only thing that makes an estimate worth reading. When we tell you a piece will not
              make its reserve, we mean it — and we will tell you before you consign, not after.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--line)] pt-6 sm:grid-cols-3">
              <div>
                <dt className="meta">Founded</dt>
                <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                  2009
                </dd>
              </div>
              <div>
                <dt className="meta">Sales a year</dt>
                <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                  5
                </dd>
              </div>
              <div>
                <dt className="meta">Live lots now</dt>
                <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] [font-variant-numeric:tabular-nums]">
                  {liveLots.length}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/auction/${liveLots[0]?.slug ?? heroLot.slug}`} className="pill-btn pill-btn--dark">
                Enter the auction room
              </Link>
              <Link href="/contact" className="pill-btn pill-btn--ghost">
                Visit the gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTACT STRIP ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface-sunken)] py-14" aria-labelledby="visit-heading">
        <div className="shell grid gap-8 md:grid-cols-3">
          <div>
            <h2 id="visit-heading" className="footer-heading text-[var(--ink)]">
              Visit the saleroom
            </h2>
            <hr className="rule-accent mt-3" />
            <address className="mt-4 not-italic text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              {site.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-3 text-[var(--text-body-min)] text-[var(--ink-muted)]">
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]">
                {site.phone}
              </a>
            </p>
          </div>

          <div>
            <h2 className="footer-heading text-[var(--ink)]">Opening hours</h2>
            <hr className="rule-accent mt-3" />
            <dl className="mt-4 space-y-2 text-[var(--text-body-min)]">
              {site.hours.map((entry) => (
                <div key={entry.days} className="flex justify-between gap-4">
                  <dt className="text-[var(--ink-muted)]">{entry.days}</dt>
                  <dd className="text-[var(--ink)]">{entry.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="footer-heading text-[var(--ink)]">Talk to us</h2>
            <hr className="rule-accent mt-3" />
            <p className="mt-4 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              {site.whatsappTooltip}. We answer every message within one working day, and often
              within the hour.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={site.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn pill-btn--secondary"
              >
                WhatsApp the house
              </a>
              <Link href="/contact" className="pill-btn pill-btn--ghost">
                Contact form
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closed sales are referenced so the results archive is discoverable. */}
      {closedSales.length > 0 ? (
        <section className="sr-only" aria-label="Completed sales">
          <h2>Completed sales</h2>
          <ul>
            {closedSales.map((auction) => (
              <li key={auction.id}>
                <Link href={`/results?auction=${auction.id}`}>
                  {auction.title} — {auction.lotsCount} lots
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
