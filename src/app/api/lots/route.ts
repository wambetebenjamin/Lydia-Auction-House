/**
 * GET /api/lots
 *
 * Paginated lot catalogue with filters.
 *
 * Query params:
 *   category   paintings | sculpture | photography | jewellery | textiles | ceramics
 *   status     live | upcoming | buy-now | sold
 *   minPrice   integer KES
 *   maxPrice   integer KES
 *   artist     artist slug
 *   auction    auction id
 *   sort       lot | ending-soon | price-asc | price-desc | recent
 *   page       1-based
 *   perPage    1–48, default 12
 *   q          free-text across title, artist, medium, lot number
 */

import { NextResponse } from 'next/server';
import { parseQuery, queryLots, toApiLot } from '@/lib/lots-query';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseQuery(searchParams);
  const result = queryLots(parsed);

  const url = new URL(request.url);
  const pageLink = (page: number) => {
    const next = new URL(url);
    next.searchParams.set('page', String(page));
    return `${next.pathname}${next.search}`;
  };

  return NextResponse.json(
    {
      ok: true,
      items: result.items.map(toApiLot),
      pagination: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        pageCount: result.pageCount,
        next: result.page < result.pageCount ? pageLink(result.page + 1) : null,
        previous: result.page > 1 ? pageLink(result.page - 1) : null,
      },
      facets: {
        categories: result.categoryCounts,
        statuses: result.statusCounts,
        priceBounds: result.priceBounds,
      },
      query: parsed,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
