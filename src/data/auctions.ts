/**
 * Auction calendar.
 *
 * Dates are computed as offsets from the moment the module is evaluated, so the
 * demonstration never goes stale: there is always exactly one sale in progress,
 * a run of upcoming sales, and a completed sale behind it. Live lots are SSR
 * (never cached), so their countdowns are always computed against real time.
 * The index pages that embed this data are ISR and revalidate well inside an
 * auction's natural granularity.
 */

import type { AuctionEvent } from '@/lib/types';

const DAY = 86_400_000;

/**
 * Returns an ISO string for a wall-clock time in Africa/Nairobi (UTC+3) on the
 * date `dayOffset` days from today.
 */
function nairobi(dayOffset: number, hour: number, minute = 0): string {
  const target = new Date(Date.now() + dayOffset * DAY);
  return new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      hour - 3,
      minute,
      0,
      0,
    ),
  ).toISOString();
}

/** Offset per sale so the calendar always reads naturally from "today". */
export const AUCTION_OFFSETS = {
  live: 0,
  coastal: 27,
  contemporaries: 48,
  photographic: 69,
  heritage: -23,
} as const;

export const auctions: AuctionEvent[] = [
  {
    id: 'a1',
    slug: 'modern-masters-of-east-africa',
    title: 'Modern Masters of East Africa',
    theme: 'Modern Masters',
    summary:
      'Ninety-four lots spanning four decades of painting, sculpture and studio ceramics from across the region. The house\u2019s flagship sale of the year, conducted live in Nairobi and simulcast online.',
    startsAt: nairobi(AUCTION_OFFSETS.live, 14, 0),
    endsAt: nairobi(AUCTION_OFFSETS.live, 19, 30),
    venue: 'The Loft, Kimathi Street',
    city: 'Nairobi',
    lotsCount: 94,
    topEstimate: 3_500_000,
    coverImage: '/images/hero-gallery.jpg',
    status: 'live',
  },
  {
    id: 'a2',
    slug: 'coastal-voices-lamu-to-zanzibar',
    title: 'Coastal Voices: Lamu to Zanzibar',
    theme: 'Coastal & Swahili',
    summary:
      'The Indian Ocean school, from the Lamu archipelago to the Tanzanian coast. Sixty-one lots of painting, carved door panels and woven textile art, including the first house appearance of Hassan Mwinyi.',
    startsAt: nairobi(AUCTION_OFFSETS.coastal, 15, 0),
    endsAt: nairobi(AUCTION_OFFSETS.coastal, 20, 0),
    venue: 'The Loft, Kimathi Street',
    city: 'Nairobi',
    lotsCount: 61,
    topEstimate: 1_800_000,
    coverImage: '/images/lot-painting-06.jpg',
    status: 'upcoming',
  },
  {
    id: 'a3',
    slug: 'new-contemporaries',
    title: 'New Contemporaries',
    theme: 'Emerging Artists',
    summary:
      'Thirty-eight lots from artists under thirty-five, priced for first-time buyers at auction. Every lot carries a published estimate and no reserve.',
    startsAt: nairobi(AUCTION_OFFSETS.contemporaries, 18, 0),
    endsAt: nairobi(AUCTION_OFFSETS.contemporaries, 21, 0),
    venue: 'The Loft, Kimathi Street',
    city: 'Nairobi',
    lotsCount: 38,
    topEstimate: 450_000,
    coverImage: '/images/lot-painting-03.jpg',
    status: 'upcoming',
  },
  {
    id: 'a4',
    slug: 'the-photographic-eye',
    title: 'The Photographic Eye',
    theme: 'Photography',
    summary:
      'Fifty-two photographs in the documentary and fine-art traditions, with a dedicated section of archival gelatin silver prints from the 1970s Nairobi studios.',
    startsAt: nairobi(AUCTION_OFFSETS.photographic, 19, 0),
    endsAt: nairobi(AUCTION_OFFSETS.photographic, 21, 30),
    venue: 'Online only',
    city: 'Nairobi',
    lotsCount: 52,
    topEstimate: 620_000,
    coverImage: '/images/lot-painting-05.jpg',
    status: 'upcoming',
  },
  {
    id: 'a5',
    slug: 'heritage-and-provenance',
    title: 'Heritage & Provenance',
    theme: 'Results',
    summary:
      'Seventy-nine lots of collector editions, cultural artefacts and estate property. Completed sale — full results and hammer prices are published in the archive.',
    startsAt: nairobi(AUCTION_OFFSETS.heritage, 14, 0),
    endsAt: nairobi(AUCTION_OFFSETS.heritage, 19, 0),
    venue: 'The Loft, Kimathi Street',
    city: 'Nairobi',
    lotsCount: 79,
    topEstimate: 2_400_000,
    coverImage: '/images/lot-sculpture-02.jpg',
    status: 'closed',
  },
];

/** The sale currently in progress — drives the navbar countdown ticker. */
export const liveAuction: AuctionEvent =
  auctions.find((a) => a.status === 'live') ?? auctions[0];

export const upcomingAuctions: AuctionEvent[] = auctions.filter((a) => a.status === 'upcoming');
export const closedAuctions: AuctionEvent[] = auctions.filter((a) => a.status === 'closed');

export const auctionBySlug = new Map(auctions.map((a) => [a.slug, a]));
export const auctionById = new Map(auctions.map((a) => [a.id, a]));

export function getAuction(idOrSlug: string): AuctionEvent | undefined {
  return auctionById.get(idOrSlug) ?? auctionBySlug.get(idOrSlug);
}
