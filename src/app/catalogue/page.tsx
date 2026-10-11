import type { Metadata } from 'next';
import Link from 'next/link';

import { catalogueOrder } from '@/data/lots';
import { site } from '@/lib/site';
import { formatKES } from '@/lib/format';
import { Flipbook } from '@/components/catalogue/Flipbook';
import { HorizontalRail } from '@/components/lots/HorizontalRail';
import { LotCard } from '@/components/lots/LotCard';

export const metadata: Metadata = {
  title: 'Auction Catalogue',
  description:
    'Read the full auction catalogue as a flipbook, or switch to text reading mode. Every lot with its full-colour image, description, estimate and provenance.',
  alternates: { canonical: '/catalogue' },
};

/** ISR — the catalogue changes only when a sale is catalogued. */
export const revalidate = 3600;

export default function CataloguePage() {
  const liveCount = catalogueOrder.filter((lot) => lot.status === 'live').length;
  const topEstimate = Math.max(...catalogueOrder.map((lot) => lot.estimateHigh));

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            The auction catalogue
          </h1>
          <p className="lead mt-4 max-w-[62ch]">
            {catalogueOrder.length} lots, catalogued by our specialists with full provenance and
            condition reports. Browse it as a booklet, or switch to text reading mode if you would
            rather scroll than turn pages.
          </p>

          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--line)] pt-5">
            <div>
              <dt className="meta">Lots catalogued</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                {catalogueOrder.length}
              </dd>
            </div>
            <div>
              <dt className="meta">Open for bidding</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                {liveCount}
              </dd>
            </div>
            <div>
              <dt className="meta">Highest estimate</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] [font-variant-numeric:tabular-nums]">
                {formatKES(topEstimate)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ══ EFFECT-30 — the flipbook ══════════════════════════════════════ */}
      <section className="shell py-12">
        <Flipbook lots={catalogueOrder} title="Lydia Auction House — Catalogue" />

        <div className="mt-10 flex flex-wrap gap-3 border-t border-[var(--line)] pt-8">
          <Link href="/lots" className="pill-btn pill-btn--dark">
            Search and filter lots
          </Link>
          <Link href="/live-auctions" className="pill-btn pill-btn--ghost">
            Enter the live sale
          </Link>
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent('Catalogue request — printed copy')}`}
            className="pill-btn pill-btn--ghost"
          >
            Request a printed catalogue
          </a>
        </div>
      </section>

      {/* ══ A rail by way of a footer to the page ═════════════════════════ */}
      <section className="bg-[var(--surface-sunken)] py-14">
        <div className="shell">
          <HorizontalRail
            label="Closing soonest"
            count={catalogueOrder.filter((lot) => lot.status === 'live').length}
          >
            {catalogueOrder
              .filter((lot) => lot.status === 'live')
              .map((lot, index) => (
                <LotCard key={lot.id} lot={lot} variant="rail" priority={index < 2} />
              ))}
          </HorizontalRail>
        </div>
      </section>
    </>
  );
}
