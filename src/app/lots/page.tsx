import type { Metadata } from 'next';
import { Suspense } from 'react';

import { lots } from '@/data/lots';
import { parseQuery, queryLots } from '@/lib/lots-query';
import { LotBrowser } from '@/components/lots/LotBrowser';
import { LotGridSkeleton } from '@/components/lots/LotCardSkeleton';

export const metadata: Metadata = {
  title: 'Browse Lots',
  description:
    'Search every lot across paintings, sculpture, photography, jewellery, textiles and ceramics. Filter by category, status and price in Kenyan Shillings.',
  alternates: { canonical: '/lots' },
};

export const dynamic = 'force-dynamic';

/**
 * LOT BROWSING — /lots
 *
 * The first page and its facets are server-rendered so the grid is never empty
 * on arrival and the filter counts are correct without JavaScript. Every
 * subsequent filter change goes through `LotBrowser`, which fetches `/api/lots`
 * and shows EFFECT-24 shimmer skeletons while in flight.
 */
export default async function LotsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }

  const query = parseQuery(flat);
  const result = queryLots(query);

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">The catalogue</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            Browse every lot
          </h1>
          <p className="lead mt-4 max-w-[62ch]">
            {lots.length} works currently catalogued across painting, sculpture, photography,
            jewellery, textiles and studio ceramics — from Kenyan, Ugandan, Tanzanian and Ethiopian
            artists, all priced in shillings.
          </p>
        </div>
      </header>

      <div className="shell py-10">
        <Suspense fallback={<LotGridSkeleton count={8} />}>
          <LotBrowser
            initialItems={result.items}
            initialTotal={result.total}
            initialPageCount={result.pageCount}
            initialQuery={query}
            priceBounds={result.priceBounds}
            categoryCounts={result.categoryCounts}
            statusCounts={result.statusCounts}
          />
        </Suspense>
      </div>
    </>
  );
}
