import type { MetadataRoute } from 'next';

import { lots } from '@/data/lots';
import { artists } from '@/data/artists';
import { auctions } from '@/data/auctions';
import { absoluteUrl } from '@/lib/site';

/**
 * Dynamic sitemap — rebuilt with the deployment and served with a revalidate
 * window, because live lot prices and sale status change without a redeploy.
 *
 * Priorities reflect the brief's commercial goal: bids placed and direct sales.
 * The live auction room and the open lots come first, ahead of the marketing
 * pages, and sold lots are kept but marked low-priority.
 */

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    {
      url: absoluteUrl('/live-auctions'),
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    { url: absoluteUrl('/auction'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/lots'), lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    {
      url: absoluteUrl('/upcoming-lots'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    { url: absoluteUrl('/catalogue'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/artists'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/register'), lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: absoluteUrl('/sell'), lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: absoluteUrl('/results'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    {
      url: absoluteUrl('/legal/terms'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/legal/privacy-policy'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/legal/cookie-policy'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const lotRoutes: MetadataRoute.Sitemap = lots.map((lot) => ({
    url: absoluteUrl(`/lots/${lot.slug}`),
    lastModified: lot.soldAt ? new Date(lot.soldAt) : now,
    changeFrequency: lot.status === 'live' ? 'hourly' : lot.status === 'sold' ? 'yearly' : 'daily',
    priority: lot.status === 'live' ? 0.9 : lot.status === 'upcoming' ? 0.7 : 0.5,
  }));

  const artistRoutes: MetadataRoute.Sitemap = artists.map((artist) => ({
    url: absoluteUrl(`/artists/${artist.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const auctionRoutes: MetadataRoute.Sitemap = auctions.map((auction) => ({
    url: absoluteUrl(`/live-auctions#${auction.slug}`),
    lastModified: now,
    changeFrequency: auction.status === 'live' ? 'hourly' : 'weekly',
    priority: auction.status === 'live' ? 0.9 : 0.5,
  }));

  return [...staticRoutes, ...lotRoutes, ...auctionRoutes, ...artistRoutes];
}
