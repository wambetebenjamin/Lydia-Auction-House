import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getLot, lotsByAuction, similarLots } from '@/data/lots';
import { getAuction } from '@/data/auctions';
import { getBidHistory, getRoomState } from '@/lib/store';
import { absoluteUrl, site } from '@/lib/site';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/types';
import { bidIncrement, formatDate, formatEstimate, formatKES } from '@/lib/format';
import { LotGallery } from '@/components/lots/LotGallery';
import { ShareLotButton } from '@/components/lots/ShareLotButton';
import { LotListRow } from '@/components/lots/LotCard';
import { BidPanel } from '@/components/auction/BidPanel';
import { MobileBidBar } from '@/components/auction/MobileBidBar';

/**
 * THE LIVE AUCTION ROOM — /auction/[id]
 *
 * Rendered on every request (`dynamic = 'force-dynamic'`), because bid accuracy
 * is the whole point: a cached room would show a stale price on a lot that is
 * closing. The brief asks for SSR on live lots for exactly this reason.
 *
 * Layout
 *   Left  — image gallery, artist, medium, provenance, condition report,
 *           exhibition history, estimate
 *   Right — the live bidding panel (EFFECT-05), sticky on desktop
 *   Mobile — single column; a sticky bid bar (MobileBidBar) mirrors the live
 *           numbers and jumps to the panel, since the panel itself is taller
 *           than a phone viewport
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lot = getLot(id);
  if (!lot) return { title: 'Lot not found' };

  const title = `${lot.title} — ${lot.artistName} · Lot ${lot.lotNumber}`;
  const description = `${lot.medium}, ${lot.dimensions}. Estimate ${formatEstimate(
    lot.estimateLow,
    lot.estimateHigh,
  )}. Live bidding in the Lydia Auction House saleroom, Nairobi.`;

  return {
    title,
    description,
    alternates: { canonical: `/auction/${lot.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: absoluteUrl(`/auction/${lot.slug}`),
      images: [
        {
          url: lot.images[0],
          width: 1024,
          height: 1024,
          alt: `${lot.title} by ${lot.artistName}`,
        },
      ],
    },
  };
}

export default async function AuctionRoomPage({ params }: PageProps) {
  const { id } = await params;
  const lot = getLot(id);
  if (!lot) notFound();

  const auction = getAuction(lot.auctionId);
  const [state, history] = await Promise.all([getRoomState(lot), getBidHistory(lot.id, 10)]);
  const siblings = auction
    ? lotsByAuction(auction.id).filter((item) => item.id !== lot.id)
    : [];
  const related = similarLots(lot, 5);

  const closed = new Date(state.closesAt).getTime() <= Date.now() || lot.status === 'sold';
  const increment = bidIncrement(state.currentBid);

  return (
    <>
      {/* A deliberately visual, room-like header band. */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-ink)] text-white">
        <div className="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-white/55">
              <li>
                <Link href="/" className="hover:text-[var(--primary)]">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/live-auctions" className="hover:text-[var(--primary)]">
                  Live auctions
                </Link>
              </li>
              {auction ? (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link
                      href={`/live-auctions#${auction.slug}`}
                      className="hover:text-[var(--primary)]"
                    >
                      {auction.title}
                    </Link>
                  </li>
                </>
              ) : null}
              <li aria-hidden="true">/</li>
              <li className="text-[var(--primary)]">Lot {lot.lotNumber}</li>
            </ol>
          </nav>

          <p className="flex items-center gap-3 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em]">
            <span className={`chip ${closed ? 'chip--sold' : 'chip--live'}`}>
              {!closed ? <span className="live-dot" aria-hidden="true" /> : null}
              {closed ? 'Closed' : 'Open for bidding'}
            </span>
            <span className="text-white/55">
              Increment {formatKES(increment)} · {state.bidCount} bids
            </span>
          </p>
        </div>
      </div>

      <div className="shell grid gap-10 py-8 lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:py-12">
        {/* ══ LEFT — the artwork ══════════════════════════════════════════ */}
        <div className="min-w-0">
          <p className="eyebrow">
            Lot {lot.lotNumber} · {CATEGORY_LABELS[lot.category]} · {STATUS_LABELS[lot.status]}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            {lot.title}
          </h1>
          <p className="mt-2 text-[var(--text-lead)] text-[var(--ink-muted)]">
            <Link
              href={`/artists/${lot.artistSlug}`}
              className="text-[var(--ink)] underline decoration-2 decoration-[var(--secondary)] underline-offset-4 hover:decoration-[var(--primary)]"
            >
              {lot.artistName}
            </Link>
            , {lot.year} · {lot.artistLocation}
          </p>

          <LotGallery lot={lot} className="mt-7" />

          <ShareLotButton lot={lot} currentBid={state.currentBid} className="mt-5" />

          {/* ── Details ────────────────────────────────────────────────── */}
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <section aria-labelledby="estimate-heading">
              <h2 id="estimate-heading" className="eyebrow">
                Estimated value
              </h2>
              <p className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-h3)] [font-variant-numeric:tabular-nums]">
                {formatEstimate(lot.estimateLow, lot.estimateHigh)}
              </p>
              <dl className="mt-3 space-y-1.5 text-[var(--text-meta)]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--ink-muted)]">Opening bid</dt>
                  <dd className="[font-variant-numeric:tabular-nums]">{formatKES(lot.startingBid)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--ink-muted)]">Reserve</dt>
                  <dd className="[font-variant-numeric:tabular-nums]">
                    {lot.reserve === 0 ? 'No reserve' : formatKES(lot.reserve)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--ink-muted)]">Buyer&rsquo;s premium</dt>
                  <dd>15% plus VAT</dd>
                </div>
                {lot.buyNowPrice ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ink-muted)]">Buy It Now</dt>
                    <dd className="[font-variant-numeric:tabular-nums]">
                      {formatKES(lot.buyNowPrice)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section aria-labelledby="condition-heading">
              <h2 id="condition-heading" className="eyebrow">
                Condition report
              </h2>
              <p className="mt-2 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                {lot.condition}
              </p>
              <p className="mt-3 text-[var(--text-meta)] text-[var(--ink-subtle)]">
                Condition is our honest opinion at the time of cataloguing, not a warranty. We
                welcome inspections in person or by video call, and we will answer any question in
                writing before you bid.
              </p>
              <p className="mt-3">
                <Link
                  href="/contact"
                  className="text-[var(--text-meta)] underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                >
                  Request a condition report or extra photographs
                </Link>
              </p>
            </section>
          </div>

          <section className="mt-10" aria-labelledby="description-heading">
            <h2 id="description-heading" className="eyebrow">
              About this lot
            </h2>
            <p className="mt-2 max-w-[68ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              {lot.description}
            </p>
          </section>

          <section className="mt-8" aria-labelledby="provenance-heading">
            <h2 id="provenance-heading" className="eyebrow">
              Provenance
            </h2>
            <ol className="mt-3 space-y-2">
              {lot.provenance.map((entry, index) => (
                <li key={entry} className="flex gap-3 text-[var(--text-body-min)] text-[var(--ink-muted)]">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--secondary)]"
                  />
                  <span>
                    <span className="sr-only">{`Step ${index + 1}: `}</span>
                    {entry}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {lot.exhibitionHistory.length > 0 ? (
            <section className="mt-8" aria-labelledby="exhibitions-heading">
              <h2 id="exhibitions-heading" className="eyebrow">
                Exhibition history
              </h2>
              <ul className="mt-3 space-y-1.5">
                {lot.exhibitionHistory.map((entry) => (
                  <li key={entry} className="text-[var(--text-body-min)] text-[var(--ink-muted)]">
                    {entry}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ── Sibling lots in this sale ──────────────────────────────── */}
          {siblings.length > 0 ? (
            <section className="mt-10" aria-labelledby="siblings-heading">
              <h2 id="siblings-heading" className="eyebrow">
                Also in {auction?.title ?? 'this sale'}
              </h2>
              <ul className="mt-3 divide-y divide-[var(--line)] rounded-[var(--radius-lg)] border border-[var(--line)]">
                {siblings.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <LotListRow lot={item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section className="mt-10" aria-labelledby="related-heading">
              <h2 id="related-heading" className="eyebrow">
                You may also like
              </h2>
              <ul className="mt-3 divide-y divide-[var(--line)] rounded-[var(--radius-lg)] border border-[var(--line)]">
                {related.map((item) => (
                  <li key={item.id}>
                    <LotListRow lot={item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* ══ RIGHT — the live bidding panel ══════════════════════════════ */}
        <aside className="min-w-0" aria-label="Bidding">
          <div id="bid-panel" className="lg:sticky lg:top-[calc(var(--nav-h)+var(--ticker-h)+1rem)]">
            <BidPanel
              lot={lot}
              seed={{
                currentBid: state.currentBid,
                bidCount: state.bidCount,
                bidderCount: state.bidderCount,
                reserveMet: state.reserveMet,
              }}
            />

            {auction ? (
              <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-5">
                <h2 className="meta">This sale</h2>
                <p className="mt-1.5 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                  {auction.title}
                </p>
                <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                  {formatDate(auction.startsAt)} · {auction.venue} · {auction.lotsCount} lots
                </p>
                <Link href={`/live-auctions#${auction.slug}`} className="pill-btn pill-btn--ghost mt-4 w-full">
                  All lots in this sale
                </Link>
              </div>
            ) : null}

            <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--line)] p-5">
              <h2 className="meta">Questions before you bid?</h2>
              <p className="mt-2 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
                {site.whatsappTooltip}. A specialist will answer on the lot, its condition and its
                provenance.
              </p>
              <a
                href={site.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn pill-btn--secondary mt-3 w-full"
              >
                Ask about this lot
              </a>
              <a
                href={`tel:${site.phone.replace(/\s/g, '')}`}
                className="pill-btn pill-btn--ghost mt-2 w-full"
              >
                Call {site.phone}
              </a>
            </div>
          </div>
        </aside>
      </div>

      <MobileBidBar
        state={state}
        history={history}
        seed={{ currentBid: state.currentBid, bidCount: state.bidCount }}
        panelId="bid-panel"
        closed={closed}
      />

      {/* Product + Offer schema for this lot, per the brief. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: lot.title,
            description: lot.description,
            image: absoluteUrl(lot.images[0]),
            sku: `LAH-${lot.lotNumber}`,
            brand: { '@type': 'Brand', name: lot.artistName },
            material: lot.medium,
            width: lot.dimensions,
            category: CATEGORY_LABELS[lot.category],
            offers: {
              '@type': 'Offer',
              url: absoluteUrl(`/auction/${lot.slug}`),
              priceCurrency: 'KES',
              price: state.currentBid,
              availability:
                lot.status === 'sold'
                  ? 'https://schema.org/SoldOut'
                  : 'https://schema.org/InStock',
              seller: { '@type': 'Organization', name: site.name, url: site.url },
              priceValidUntil: state.closesAt,
            },
          }),
        }}
      />
    </>
  );
}
