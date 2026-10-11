import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getLot, similarLots } from '@/data/lots';
import { getArtist } from '@/data/artists';
import { getAuction } from '@/data/auctions';
import { getBidHistory, getRoomState } from '@/lib/store';
import { absoluteUrl, site } from '@/lib/site';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/types';
import { formatDate, formatDateTime, formatEstimate, formatKES, formatNumber } from '@/lib/format';
import { LotGallery } from '@/components/lots/LotGallery';
import { ShareLotButton } from '@/components/lots/ShareLotButton';
import { LotCard } from '@/components/lots/LotCard';
import { BidPanel } from '@/components/auction/BidPanel';
import { Countdown } from '@/components/shell/Countdown';

/**
 * LOT DETAIL — /lots/[slug]
 *
 * SSR on every request, because the page shows a live bid and a running
 * countdown. The ISR pages in the brief (artist pages, results archive) are
 * handled separately; a lot whose price can change cannot be cached.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lot = getLot(slug);
  if (!lot) return { title: 'Lot not found' };

  const description = `${lot.artistName} — ${lot.medium}, ${lot.dimensions}. Estimate ${formatEstimate(
    lot.estimateLow,
    lot.estimateHigh,
  )}. Lot ${lot.lotNumber} at Lydia Auction House, Nairobi.`;

  return {
    title: `${lot.title} — ${lot.artistName}`,
    description,
    alternates: { canonical: `/lots/${lot.slug}` },
    openGraph: {
      title: `${lot.title} — ${lot.artistName}`,
      description,
      type: 'article',
      url: absoluteUrl(`/lots/${lot.slug}`),
      images: [
        { url: lot.images[0], width: 1024, height: 1024, alt: `${lot.title} by ${lot.artistName}` },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${lot.title} — ${lot.artistName}`,
      description,
      images: [lot.images[0]],
    },
  };
}

export default async function LotDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const lot = getLot(slug);
  if (!lot) notFound();

  const [state, history] = await Promise.all([getRoomState(lot), getBidHistory(lot.id, 10)]);
  const artist = getArtist(lot.artistSlug);
  const auction = getAuction(lot.auctionId);
  const related = similarLots(lot, 4);

  const isLive = lot.status === 'live';
  const isBuyNow = lot.status === 'buy-now';
  const sold = lot.status === 'sold';

  return (
    <>
      <div className="shell py-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            <li>
              <Link href="/" className="hover:text-[var(--ink)]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/lots" className="hover:text-[var(--ink)]">
                Lots
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/lots?category=${lot.category}`} className="hover:text-[var(--ink)]">
                {CATEGORY_LABELS[lot.category]}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[var(--ink)]">Lot {lot.lotNumber}</li>
          </ol>
        </nav>
      </div>

      <div className="shell grid gap-10 pb-14 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        {/* ══ LEFT ════════════════════════════════════════════════════════ */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`chip ${
                lot.status === 'live'
                  ? 'chip--live'
                  : lot.status === 'upcoming'
                    ? 'chip--upcoming'
                    : lot.status === 'buy-now'
                      ? 'chip--buy-now'
                      : 'chip--sold'
              }`}
            >
              {lot.status === 'live' ? <span className="live-dot" aria-hidden="true" /> : null}
              {STATUS_LABELS[lot.status]}
            </span>
            <span className="meta">
              Lot {lot.lotNumber} · {CATEGORY_LABELS[lot.category]}
            </span>
          </div>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            {lot.title}
          </h1>

          <p className="mt-3 text-[var(--text-lead)] text-[var(--ink-muted)]">
            <Link
              href={`/artists/${lot.artistSlug}`}
              className="text-[var(--ink)] underline decoration-2 decoration-[var(--secondary)] underline-offset-4 hover:decoration-[var(--primary)]"
            >
              {lot.artistName}
            </Link>
            , {lot.year} · {lot.artistLocation}
          </p>

          <LotGallery lot={lot} className="mt-7" />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ShareLotButton lot={lot} currentBid={state.currentBid} />
            {isLive ? (
              <Link href={`/auction/${lot.slug}`} className="pill-btn pill-btn--dark min-h-12">
                Open the live auction room
              </Link>
            ) : null}
          </div>

          {/* ── Artist profile snippet ─────────────────────────────────── */}
          {artist ? (
            <section className="mt-10 rounded-[var(--radius-lg)] border border-[var(--line)] p-6" aria-labelledby="artist-heading">
              <h2 id="artist-heading" className="eyebrow">
                About the artist
              </h2>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--light)]">
                  <Image
                    src={artist.portrait}
                    alt={artist.portraitAlt}
                    fill
                    sizes="6rem"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                    {artist.name}
                  </p>
                  <p className="meta mt-0.5">
                    {artist.born} · {artist.location}, {artist.country}
                  </p>
                  <p className="mt-2 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                    {artist.bio[0]}
                  </p>
                  <blockquote className="mt-3 border-l-4 border-[var(--primary)] pl-3 font-[family-name:var(--font-display)] text-[var(--text-ui)] italic text-[var(--ink)]">
                    &ldquo;{artist.statement}&rdquo;
                  </blockquote>
                  <Link
                    href={`/artists/${artist.slug}`}
                    className="mt-3 inline-flex min-h-11 items-center text-[var(--text-meta)] underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                  >
                    Full profile, portfolio and exhibition history
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-8" aria-labelledby="provenance-story-heading">
            <h2 id="provenance-story-heading" className="eyebrow">
              Provenance
            </h2>
            <p className="mt-2 max-w-[68ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              {lot.description}
            </p>
            <ol className="mt-4 space-y-2">
              {lot.provenance.map((entry, index) => (
                <li key={entry} className="flex gap-3 text-[var(--text-body-min)] text-[var(--ink-muted)]">
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--light)] font-[family-name:var(--font-condensed)] text-[11px] text-[var(--ink-muted)]"
                  >
                    {index + 1}
                  </span>
                  <span>{entry}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <section aria-labelledby="detail-condition">
              <h2 id="detail-condition" className="eyebrow">
                Condition report
              </h2>
              <p className="mt-2 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                {lot.condition}
              </p>
            </section>

            <section aria-labelledby="detail-exhibitions">
              <h2 id="detail-exhibitions" className="eyebrow">
                Exhibition history
              </h2>
              {lot.exhibitionHistory.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {lot.exhibitionHistory.map((entry) => (
                    <li key={entry} className="text-[var(--text-body-min)] text-[var(--ink-muted)]">
                      {entry}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[var(--text-body-min)] text-[var(--ink-subtle)]">
                  Not previously exhibited. Studio work, held by the artist until consignment.
                </p>
              )}
            </section>
          </div>

          {/* ── Similar lots carousel ─────────────────────────────────── */}
          {related.length > 0 ? (
            <section className="mt-12" aria-labelledby="similar-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  id="similar-heading"
                  className="font-[family-name:var(--font-display)] text-[var(--text-h3)]"
                >
                  Similar lots
                </h2>
                <Link
                  href={`/lots?category=${lot.category}`}
                  className="text-[var(--text-meta)] underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                >
                  All {CATEGORY_LABELS[lot.category].toLowerCase()}
                </Link>
              </div>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {related.map((item) => (
                  <li key={item.id}>
                    <LotCard lot={item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* ══ RIGHT — bid panel, estimate, history ════════════════════════ */}
        <aside aria-label="Bidding and lot details" className="min-w-0">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+var(--ticker-h)+1rem)]">
            {/* Estimate summary */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-5">
              <h2 className="meta">Estimated value</h2>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-[var(--text-h3)] [font-variant-numeric:tabular-nums]">
                {formatEstimate(lot.estimateLow, lot.estimateHigh)}
              </p>
              <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                Buyer&rsquo;s premium 15% plus VAT on the hammer price. Reserve{' '}
                {lot.reserve === 0 ? 'none' : formatKES(lot.reserve)}.
              </p>
            </div>

            {isLive || isBuyNow ? (
              <BidPanel
                lot={lot}
                seed={{
                  currentBid: state.currentBid,
                  bidCount: state.bidCount,
                  bidderCount: state.bidderCount,
                  reserveMet: state.reserveMet,
                }}
                className="mt-4"
              />
            ) : (
              <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5">
                <h2 className="meta">
                  {sold ? 'Hammer price' : 'Current bid'}
                </h2>
                <p className="mt-1.5 font-[family-name:var(--font-display)] text-[var(--text-h3)] [font-variant-numeric:tabular-nums]">
                  {formatKES(sold && lot.soldPrice ? lot.soldPrice : state.currentBid)}
                </p>
                <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                  {state.bidCount} bids from {state.bidderCount} bidders
                  {sold && lot.soldAt ? ` · sold ${formatDate(lot.soldAt)}` : ''}
                </p>

                <dl className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-[var(--text-meta)]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ink-muted)]">
                      {sold ? 'Sale closed' : 'Bidding opens'}
                    </dt>
                    <dd>
                      {sold
                        ? formatDate(state.closesAt)
                        : formatDateTime(auction?.startsAt ?? state.closesAt)}
                    </dd>
                  </div>
                  {!sold ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--ink-muted)]">Opens in</dt>
                      <dd>
                        <Countdown target={auction?.startsAt ?? state.closesAt} variant="verbose" />
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {!sold ? (
                  <>
                    <Link href="/register" className="pill-btn pill-btn--dark mt-4 w-full">
                      Register to Bid
                    </Link>
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-subtle)]">
                      Registration is free and takes a minute. We will remind you before this lot
                      opens.
                    </p>
                  </>
                ) : (
                  <Link href="/results" className="pill-btn pill-btn--ghost mt-4 w-full">
                    See all results
                  </Link>
                )}
              </div>
            )}

            {/* Bid history */}
            <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--line)] p-5">
              <h2 className="meta">Bid history</h2>
              {history.length > 0 ? (
                <ol className="mt-3 divide-y divide-[var(--line)]">
                  {history.slice(0, 8).map((bid, index) => (
                    <li key={bid.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-[var(--text-meta)] text-[var(--ink-muted)]">
                        {index === 0 ? 'Highest — ' : ''}
                        {bid.bidder}
                      </span>
                      <span className="text-[var(--text-meta)] text-[var(--ink)] [font-variant-numeric:tabular-nums]">
                        {formatKES(bid.amount)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-[var(--text-meta)] text-[var(--ink-muted)]">
                  No bids recorded on this lot yet.
                </p>
              )}
            </div>

            {/* House help */}
            <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--line)] p-5">
              <h2 className="meta">Ask about this lot</h2>
              <p className="mt-2 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
                {site.whatsappTooltip}. We can send additional photographs, a video condition
                report, or arrange a viewing at the gallery.
              </p>
              <a
                href={`${site.whatsappLink.split('?')[0]}?text=${encodeURIComponent(
                  `Hello! I am interested in "${lot.title}" (Lot ${lot.lotNumber}, current bid ${formatKES(
                    state.currentBid,
                  )}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn pill-btn--secondary mt-3 w-full"
              >
                WhatsApp about this lot
              </a>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-subtle)]">
              Measurements are approximate. Colours may vary between screens. Bid increments on this
              lot: {formatKES(state.nextBid - state.currentBid)} at the current level. Total lots in
              this catalogue: {formatNumber(14)} live.
            </p>
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: lot.title,
            description: lot.description,
            image: lot.images.map((image) => absoluteUrl(image)),
            sku: `LAH-${lot.lotNumber}`,
            brand: { '@type': 'Brand', name: lot.artistName },
            material: lot.medium,
            category: CATEGORY_LABELS[lot.category],
            offers: {
              '@type': 'Offer',
              url: absoluteUrl(`/lots/${lot.slug}`),
              priceCurrency: 'KES',
              price: sold && lot.soldPrice ? lot.soldPrice : state.currentBid,
              availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
              seller: { '@type': 'Organization', name: site.name, url: site.url },
            },
          }),
        }}
      />
    </>
  );
}
