/**
 * Pure catalogue querying — shared by `/api/lots` and the lot browsing pages so
 * the client-side filter UI and the server agree on semantics exactly.
 */

import { lots } from '@/data/lots';
import type { Lot, LotCategory, LotQuery, LotStatus } from './types';
import { LOT_CATEGORIES, LOT_STATUSES } from './types';

export const DEFAULT_PER_PAGE = 12;

export interface PagedLots {
  items: Lot[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  /** Facet counts across the *unfiltered-by-category* set, for the filter tabs. */
  categoryCounts: Record<LotCategory | 'all', number>;
  statusCounts: Record<LotStatus | 'all', number>;
  priceBounds: { min: number; max: number };
}

export function parseQuery(searchParams: URLSearchParams | Record<string, string | undefined>): LotQuery {
  const read = (key: string): string | undefined =>
    searchParams instanceof URLSearchParams ? (searchParams.get(key) ?? undefined) : searchParams[key];

  const categoryRaw = read('category');
  const statusRaw = read('status');
  const sortRaw = read('sort');

  const category =
    categoryRaw && (LOT_CATEGORIES as readonly string[]).includes(categoryRaw)
      ? (categoryRaw as LotCategory)
      : 'all';
  const status =
    statusRaw && (LOT_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as LotStatus)
      : 'all';

  const validSorts = ['lot', 'ending-soon', 'price-asc', 'price-desc', 'recent'] as const;
  const sort = sortRaw && (validSorts as readonly string[]).includes(sortRaw)
    ? (sortRaw as LotQuery['sort'])
    : 'lot';

  const num = (key: string): number | undefined => {
    const raw = read(key);
    if (raw === undefined || raw === '') return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    category,
    status,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    artist: read('artist'),
    auction: read('auction'),
    sort,
    page: Math.max(1, num('page') ?? 1),
    perPage: Math.min(48, Math.max(1, num('perPage') ?? DEFAULT_PER_PAGE)),
    search: read('q'),
  };
}

/** The value a card shows as "price" — hammer price when sold, else current bid. */
export function displayPrice(lot: Lot): number {
  return lot.status === 'sold' && lot.soldPrice ? lot.soldPrice : lot.currentBid;
}

export function queryLots(query: LotQuery, source: Lot[] = lots): PagedLots {
  const {
    category = 'all',
    status = 'all',
    minPrice,
    maxPrice,
    artist,
    auction,
    sort = 'lot',
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    search,
  } = query;

  const priceOf = (lot: Lot) => {
    if (maxPrice !== undefined || minPrice !== undefined) return displayPrice(lot);
    return displayPrice(lot);
  };

  // Facets are computed on everything except the dimension being faceted.
  const categoryCounts = { all: source.length } as Record<LotCategory | 'all', number>;
  for (const key of LOT_CATEGORIES) categoryCounts[key] = 0;
  for (const lot of source) categoryCounts[lot.category] += 1;

  const statusCounts = { all: source.length } as Record<LotStatus | 'all', number>;
  for (const key of LOT_STATUSES) statusCounts[key] = 0;
  for (const lot of source) statusCounts[lot.status] += 1;

  const prices = source.map(displayPrice);
  const priceBounds = {
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 0,
  };

  let items = source.filter((lot) => {
    if (category !== 'all' && lot.category !== category) return false;
    if (status !== 'all' && lot.status !== status) return false;
    if (artist && lot.artistSlug !== artist) return false;
    if (auction && lot.auctionId !== auction) return false;
    if (minPrice !== undefined && priceOf(lot) < minPrice) return false;
    if (maxPrice !== undefined && priceOf(lot) > maxPrice) return false;
    if (search) {
      const haystack = [
        lot.title,
        lot.artistName,
        lot.medium,
        lot.lotNumber,
        lot.description,
        lot.category,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  items = [...items].sort((a, b) => {
    switch (sort) {
      case 'ending-soon':
        return new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime();
      case 'price-asc':
        return displayPrice(a) - displayPrice(b);
      case 'price-desc':
        return displayPrice(b) - displayPrice(a);
      case 'recent':
        return (
          new Date(b.soldAt ?? b.closesAt).getTime() - new Date(a.soldAt ?? a.closesAt).getTime()
        );
      case 'lot':
      default:
        return a.lotNumber.localeCompare(b.lotNumber);
    }
  });

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    pageCount,
    categoryCounts,
    statusCounts,
    priceBounds,
  };
}

/** Serialisable lot projection for API responses. */
export function toApiLot(lot: Lot) {
  return {
    ...lot,
    displayPrice: displayPrice(lot),
    url: `/lots/${lot.slug}`,
    auctionUrl: null,
  };
}
