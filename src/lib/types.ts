/**
 * Domain types for Lydia Auction House.
 * The design source shipped no data model (DESIGN-INVENTORY.md §9) — there was
 * no backend at all — so this model is authored to the brief.
 */

export const LOT_CATEGORIES = [
  'paintings',
  'sculpture',
  'photography',
  'jewellery',
  'textiles',
  'ceramics',
] as const;

export type LotCategory = (typeof LOT_CATEGORIES)[number];

export const LOT_STATUSES = ['live', 'upcoming', 'buy-now', 'sold'] as const;
export type LotStatus = (typeof LOT_STATUSES)[number];

export const CATEGORY_LABELS: Record<LotCategory, string> = {
  paintings: 'Paintings',
  sculpture: 'Sculpture',
  photography: 'Photography',
  jewellery: 'Jewellery',
  textiles: 'Textiles',
  ceramics: 'Ceramics',
};

export const STATUS_LABELS: Record<LotStatus, string> = {
  live: 'Live',
  upcoming: 'Upcoming',
  'buy-now': 'Buy Now',
  sold: 'Sold',
};

export interface Lot {
  id: string;
  lotNumber: string;
  slug: string;
  title: string;
  artistSlug: string;
  artistName: string;
  artistLocation: string;
  category: LotCategory;
  year: string;
  medium: string;
  dimensions: string;
  edition?: string;
  /** First entry is always the primary/poster image. */
  images: string[];
  description: string;
  provenance: string[];
  condition: string;
  exhibitionHistory: string[];
  /** KES */
  estimateLow: number;
  estimateHigh: number;
  startingBid: number;
  /** KES. 0 means "no reserve". */
  reserve: number;
  buyNowPrice?: number;
  /** Snapshot for SSR/ISR; live values come from the KV store at request time. */
  currentBid: number;
  bidCount: number;
  bidderCount: number;
  status: LotStatus;
  /** ISO 8601 */
  closesAt: string;
  auctionId: string;
  featured?: boolean;
  soldPrice?: number;
  soldAt?: string;
  /** Render hint for EFFECT-01's Three.js scene. */
  renderKind: 'canvas' | 'sculpture' | 'object';
  accent: string;
}

export interface Artist {
  slug: string;
  name: string;
  location: string;
  country: string;
  disciplines: LotCategory[];
  medium: string;
  born: string;
  /** Gallery-forward card visual — a work from the portfolio. */
  portrait: string;
  portraitAlt: string;
  bio: string[];
  statement: string;
  exhibitions: { year: string; title: string; venue: string }[];
  awards?: string[];
  website?: string;
}

export interface AuctionEvent {
  id: string;
  slug: string;
  title: string;
  theme: string;
  summary: string;
  /** ISO 8601 */
  startsAt: string;
  endsAt: string;
  venue: string;
  city: string;
  lotsCount: number;
  /** Highest estimate in the sale, KES. */
  topEstimate: number;
  coverImage: string;
  status: 'live' | 'upcoming' | 'closed';
}

export interface Bid {
  id: string;
  lotId: string;
  amount: number;
  /** Masked public handle, e.g. "Bidder 41" — never a real identity. */
  bidder: string;
  at: string;
  /** True for the locally-optimistic echo before the server confirms. */
  pending?: boolean;
}

export interface AuctionRoomState {
  lotId: string;
  currentBid: number;
  bidCount: number;
  bidderCount: number;
  nextBid: number;
  reserveMet: boolean;
  status: LotStatus;
  closesAt: string;
  buyNowPrice?: number;
  history: Bid[];
  updatedAt: string;
}

/** Wire format for EFFECT-05's broadcast channel. */
export type AuctionMessage =
  | { type: 'hello'; state: AuctionRoomState; serverTime: string }
  | { type: 'bid'; state: AuctionRoomState; bid: Bid }
  | { type: 'state'; state: AuctionRoomState }
  | { type: 'presence'; watchers: number }
  | { type: 'ping'; serverTime: string };

export interface LotQuery {
  category?: LotCategory | 'all';
  status?: LotStatus | 'all';
  minPrice?: number;
  maxPrice?: number;
  artist?: string;
  auction?: string;
  sort?: 'lot' | 'ending-soon' | 'price-asc' | 'price-desc' | 'recent';
  page?: number;
  perPage?: number;
  search?: string;
}
