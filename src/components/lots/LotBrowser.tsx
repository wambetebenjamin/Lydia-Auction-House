'use client';

/**
 * Lot browsing — EFFECT-24 (shimmer skeletons) and EFFECT-26 (hover reveals).
 *
 * Filter tabs: All, Paintings, Sculpture, Photography, Jewellery, Textiles,
 * Ceramics. Price range slider. Status filter: Live, Upcoming, Buy Now, Sold.
 *
 * The component fetches `/api/lots` on every filter change and renders
 * `LotGridSkeleton` while in flight, which is a **real** loading state rather
 * than a simulated one — the grid genuinely has nothing to show yet, and the
 * skeleton's fixed dimensions mean the swap produces zero layout shift.
 *
 * Filters are mirrored into the URL query string, so a filtered view is
 * shareable, bookmarkable, and works without JavaScript.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Lot, LotCategory, LotStatus, LotQuery } from '@/lib/types';
import { CATEGORY_LABELS, LOT_CATEGORIES, LOT_STATUSES, STATUS_LABELS } from '@/lib/types';
import { formatKES } from '@/lib/format';
import { LotCard } from './LotCard';
import { LotGridSkeleton } from './LotCardSkeleton';

interface LotBrowserProps {
  /** Server-rendered first page, so the grid is never empty on arrival. */
  initialItems: Lot[];
  initialTotal: number;
  initialPageCount: number;
  initialQuery: LotQuery;
  priceBounds: { min: number; max: number };
  categoryCounts: Record<LotCategory | 'all', number>;
  statusCounts: Record<LotStatus | 'all', number>;
  perPage?: number;
  className?: string;
}

const SORTS: { value: NonNullable<LotQuery['sort']>; label: string }[] = [
  { value: 'lot', label: 'Catalogue order' },
  { value: 'ending-soon', label: 'Ending soonest' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
];

export function LotBrowser({
  initialItems,
  initialTotal,
  initialPageCount,
  initialQuery,
  priceBounds,
  categoryCounts,
  statusCounts,
  perPage = 12,
  className = '',
}: LotBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Lot[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const [category, setCategory] = useState<LotCategory | 'all'>(initialQuery.category ?? 'all');
  const [status, setStatus] = useState<LotStatus | 'all'>(initialQuery.status ?? 'all');
  const [sort, setSort] = useState<NonNullable<LotQuery['sort']>>(initialQuery.sort ?? 'lot');
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [maxPrice, setMaxPrice] = useState(initialQuery.maxPrice ?? priceBounds.max);

  const firstRender = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Fetch on any filter change ───────────────────────────────────────── */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (status !== 'all') params.set('status', status);
    if (sort !== 'lot') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    if (maxPrice < priceBounds.max) params.set('maxPrice', String(maxPrice));
    params.set('perPage', String(perPage));

    // Keep the URL in step so the view is shareable.
    const query = params.toString();
    router.replace(query ? `/lots?${query}` : '/lots', { scroll: false });

    fetch(`/api/lots?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as {
          ok: boolean;
          items: Lot[];
          pagination: { total: number; pageCount: number; page: number };
        };
      })
      .then((payload) => {
        setItems(payload.items);
        setTotal(payload.pagination.total);
        setPageCount(payload.pagination.pageCount);
        setAnnouncement(
          `${payload.pagination.total} ${
            payload.pagination.total === 1 ? 'lot' : 'lots'
          } match your filters. Showing page ${payload.pagination.page} of ${
            payload.pagination.pageCount
          }.`,
        );
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError('We could not load the catalogue. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, sort, page, maxPrice, perPage, priceBounds.max]);

  /* Reset to page 1 whenever a filter (not the page) changes. */
  const changeFilter = useCallback((apply: () => void) => {
    apply();
    setPage(1);
  }, []);

  const tabs = useMemo(
    () => [
      { value: 'all' as const, label: 'All', count: categoryCounts.all },
      ...LOT_CATEGORIES.map((value) => ({
        value,
        label: CATEGORY_LABELS[value],
        count: categoryCounts[value] ?? 0,
      })),
    ],
    [categoryCounts],
  );

  return (
    <div className={className}>
      {/* ── Category tabs ────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Filter lots by category"
        className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-4"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={category === tab.value}
            onClick={() => changeFilter(() => setCategory(tab.value as LotCategory | 'all'))}
            className={`min-h-12 rounded-[var(--radius-pill)] border px-4 font-[family-name:var(--font-condensed)] text-[var(--text-button)] uppercase tracking-[0.08em] transition-colors duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] ${
              category === tab.value
                ? 'border-[var(--dark)] bg-[var(--dark)] text-[var(--primary)]'
                : 'border-[var(--line-strong)] text-[var(--ink-muted)] hover:border-[var(--dark)] hover:text-[var(--ink)]'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-[11px] opacity-70 [font-variant-numeric:tabular-nums]">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Status + price + sort ────────────────────────────────────────── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <fieldset className="min-w-0">
          <legend className="meta mb-2">Status</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={status === 'all'}
              onClick={() => changeFilter(() => setStatus('all'))}
              className={statusPillClass(status === 'all')}
            >
              All
              <span className="ml-2 text-[11px] opacity-70">{statusCounts.all}</span>
            </button>
            {LOT_STATUSES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => changeFilter(() => setStatus(value))}
                className={statusPillClass(status === value)}
              >
                {STATUS_LABELS[value]}
                <span className="ml-2 text-[11px] opacity-70">{statusCounts[value] ?? 0}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Price range slider */}
        <div className="min-w-0">
          <label htmlFor="price-range" className="meta mb-2 flex items-center justify-between gap-3">
            <span>Price range</span>
            <span className="text-[var(--ink)] [font-variant-numeric:tabular-nums]">
              Up to {formatKES(maxPrice)}
            </span>
          </label>
          <input
            id="price-range"
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            step={Math.max(1000, Math.round((priceBounds.max - priceBounds.min) / 100))}
            value={maxPrice}
            onChange={(event) => changeFilter(() => setMaxPrice(Number(event.target.value)))}
            aria-valuetext={`Up to ${formatKES(maxPrice)}`}
            className="h-12 w-full cursor-pointer accent-[var(--dark)]"
          />
          <p className="text-[11px] text-[var(--ink-subtle)] [font-variant-numeric:tabular-nums]">
            {formatKES(priceBounds.min)} – {formatKES(priceBounds.max)} across the catalogue
          </p>
        </div>

        <div>
          <label htmlFor="sort-order" className="meta mb-2 block">
            Sort
          </label>
          <select
            id="sort-order"
            value={sort}
            onChange={(event) =>
              changeFilter(() => setSort(event.target.value as NonNullable<LotQuery['sort']>))
            }
            className="min-h-12 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[var(--text-ui)] outline-none transition-colors duration-200 focus:border-[var(--dark)] focus:ring-3 focus:ring-[var(--primary)]/50"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="mt-6 flex items-baseline justify-between gap-4">
        <p className="text-[var(--text-body-min)] text-[var(--ink-muted)]">
          {loading ? (
            'Loading lots…'
          ) : (
            <>
              <strong className="text-[var(--ink)] [font-variant-numeric:tabular-nums]">
                {total}
              </strong>{' '}
              {total === 1 ? 'lot' : 'lots'} match your filters
            </>
          )}
        </p>
        {error ? (
          <p role="alert" className="text-[var(--text-meta)] text-[var(--status-danger)]">
            {error}
          </p>
        ) : null}
      </div>

      {/* The live region carries the result count for assistive technology. */}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>

      {/* EFFECT-24: skeletons while the fetch is in flight. */}
      {loading ? (
        <LotGridSkeleton count={Math.min(perPage, 8)} className="mt-5" />
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-10 text-center">
          <h3 className="font-[family-name:var(--font-display)] text-[var(--text-h3)]">
            No lots match those filters
          </h3>
          <p className="mx-auto mt-2 max-w-[46ch] text-[var(--text-body-min)] text-[var(--ink-muted)]">
            Try widening the price range, or clear the filters to see the whole catalogue.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setStatus('all');
              setMaxPrice(priceBounds.max);
              setPage(1);
            }}
            className="pill-btn pill-btn--dark mt-5"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((lot, index) => (
            <li key={lot.id}>
              <LotCard lot={lot} priority={index < 4} />
            </li>
          ))}
        </ul>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pageCount > 1 && !loading ? (
        <nav aria-label="Catalogue pages" className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="pill-btn pill-btn--ghost min-h-12 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <p className="px-3 font-[family-name:var(--font-condensed)] text-[var(--text-meta)] uppercase tracking-[0.12em] text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
            Page {page} of {pageCount}
          </p>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={page >= pageCount}
            className="pill-btn pill-btn--ghost min-h-12 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function statusPillClass(active: boolean): string {
  return `min-h-12 rounded-[var(--radius-pill)] border px-3.5 font-[family-name:var(--font-condensed)] text-[var(--text-button)] uppercase tracking-[0.08em] transition-colors duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] ${
    active
      ? 'border-[var(--secondary)] bg-[rgba(140,198,65,0.16)] text-[#3F5C18]'
      : 'border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--dark)] hover:text-[var(--ink)]'
  }`;
}
