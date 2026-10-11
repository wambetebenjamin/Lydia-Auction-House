import type { NextConfig } from 'next';

/**
 * Lydia Auction House — Next.js configuration
 *
 * Render strategy (per brief):
 *   /lots/[slug]      SSR   — live bid accuracy       (dynamic, no cache)
 *   /auction/[id]     SSR   — live bid accuracy       (dynamic, no cache)
 *   /artists/[slug]   ISR   — revalidate 600
 *   /results          ISR   — revalidate 3600
 *   /catalogue        ISR   — revalidate 3600
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // The live-preview proxy terminates at *.e2b.app and forwards a foreign Host
  // header. Permit it so `next dev` does not reject cross-origin HMR requests.
  allowedDevOrigins: [
    '*.e2b.app',
    '*.arena.ai',
    '*.vercel.app',
    'localhost',
    '127.0.0.1',
  ],

  images: {
    // All artwork is served from /public/images (see image-credits.md).
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },

  // `_reference/` holds the untouched design-source archive and `image-search/`
  // the raw research downloads. Neither is part of the application.
  outputFileTracingExcludes: {
    '*': ['./_reference/**', './image-search/**'],
  },
};

export default nextConfig;
