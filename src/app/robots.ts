import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/site';

/**
 * robots.txt — everything public is crawlable, the last-resort error shell is
 * not, and the sitemap is advertised absolutely so it resolves correctly from
 * the production host and from any preview deployment.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/global-error',
          '/_next/static/chunks/',
          // Never let a crawler trigger a form or bid endpoint.
          '/*?*captchaToken=',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/lots/', '/artists/', '/results'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
