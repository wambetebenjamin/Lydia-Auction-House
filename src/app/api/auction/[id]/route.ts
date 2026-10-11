/**
 * GET /api/auction/[id]
 *
 * Returns the full auction-room state for a lot: current lot detail, live bid
 * values, the last ten bids, watcher counts and server time.
 *
 * This is both the initial hydration endpoint and the 2-second polling fallback
 * required when the WebSocket transport is unavailable.
 */

import { NextResponse } from 'next/server';
import { getAuction } from '@/data/auctions';
import { getLot, lotsByAuction } from '@/data/lots';
import { getBidHistory, getRoomState, storeIsDurable } from '@/lib/store';
import { watchers } from '@/lib/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const lot = getLot(id);
  if (!lot) {
    return NextResponse.json(
      { ok: false, code: 'not_found', message: `No lot with id "${id}".` },
      { status: 404 },
    );
  }

  const [state, history] = await Promise.all([getRoomState(lot), getBidHistory(lot.id, 10)]);
  const auction = getAuction(lot.auctionId);

  return NextResponse.json(
    {
      ok: true,
      lot: {
        id: lot.id,
        slug: lot.slug,
        lotNumber: lot.lotNumber,
        title: lot.title,
        artistName: lot.artistName,
        medium: lot.medium,
        dimensions: lot.dimensions,
        images: lot.images,
        estimateLow: lot.estimateLow,
        estimateHigh: lot.estimateHigh,
        reserve: lot.reserve,
        status: lot.status,
        closesAt: lot.closesAt,
        buyNowPrice: lot.buyNowPrice,
        renderKind: lot.renderKind,
        accent: lot.accent,
      },
      auction: auction
        ? {
            id: auction.id,
            slug: auction.slug,
            title: auction.title,
            startsAt: auction.startsAt,
            endsAt: auction.endsAt,
            venue: auction.venue,
          }
        : null,
      auctionLotCount: auction ? lotsByAuction(auction.id).length : 0,
      state: { ...state, history },
      watchers: watchers(lot.id),
      transport: storeIsDurable ? 'kv' : 'memory',
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Auction-Lot': lot.id,
      },
    },
  );
}
