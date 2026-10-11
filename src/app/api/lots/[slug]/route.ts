/**
 * GET /api/lots/[slug]
 *
 * A single lot's full detail, including live bid state so a client can refresh
 * one card without refetching the catalogue.
 */

import { NextResponse } from 'next/server';
import { getLot } from '@/data/lots';
import { getBidHistory, getRoomState } from '@/lib/store';
import { toApiLot } from '@/lib/lots-query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const lot = getLot(slug);

  if (!lot) {
    return NextResponse.json(
      { ok: false, code: 'not_found', message: `No lot with slug "${slug}".` },
      { status: 404 },
    );
  }

  const [state, history] = await Promise.all([getRoomState(lot), getBidHistory(lot.id, 10)]);

  return NextResponse.json(
    {
      ok: true,
      lot: toApiLot(lot),
      live: {
        currentBid: state.currentBid,
        bidCount: state.bidCount,
        bidderCount: state.bidderCount,
        nextBid: state.nextBid,
        reserveMet: state.reserveMet,
        status: state.status,
        closesAt: state.closesAt,
        buyNowPrice: state.buyNowPrice,
        updatedAt: state.updatedAt,
      },
      history,
      serverTime: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
