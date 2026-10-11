import type { Metadata, Viewport } from 'next';
import './globals.css';

import { site, absoluteUrl } from '@/lib/site';
import { auctions } from '@/data/auctions';
import { lots } from '@/data/lots';
import { artists } from '@/data/artists';

import { SiteHeader } from '@/components/shell/SiteHeader';
import { SiteFooter } from '@/components/shell/SiteFooter';
import { WhatsAppButton } from '@/components/shell/WhatsAppButton';
import { CookieConsent } from '@/components/shell/CookieConsent';
import { LoadingScreen } from '@/components/shell/LoadingScreen';
import { SkipLink } from '@/components/shell/SkipLink';
import { PageTransitionProvider } from '@/components/effects/PageTransitionProvider';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Live & Online Auctions of East African Art`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  generator: 'Next.js',
  keywords: [
    'East African art auction',
    'Nairobi art gallery',
    'Kenyan art auction',
    'African sculpture auction',
    'buy African art online',
    'live art auction Kenya',
    'East African crafts',
    'art collector Nairobi',
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: 'Art & Auctions',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Live & Online Auctions of East African Art`,
    description: site.description,
    images: [
      {
        url: '/images/hero-gallery.jpg',
        width: 1584,
        height: 672,
        alt: 'The Lydia Auction House saleroom in Nairobi, hung with East African paintings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Live & Online Auctions of East African Art`,
    description: site.description,
    images: ['/images/hero-gallery.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: true, address: true, email: true },
  referrer: 'strict-origin-when-cross-origin',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#272630' },
    { media: '(prefers-color-scheme: dark)', color: '#272630' },
  ],
  colorScheme: 'light',
};

/* ── Structured data ────────────────────────────────────────────────────────
   ArtGallery + LocalBusiness on every page; Event per auction; Product per lot
   is emitted on the lot page itself. */

function structuredData() {
  const gallery = {
    '@context': 'https://schema.org',
    '@type': ['ArtGallery', 'LocalBusiness'],
    '@id': `${site.url}/#organisation`,
    name: site.name,
    alternateName: 'Lydia Art Auctions',
    description: site.description,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    image: absoluteUrl('/images/hero-gallery.jpg'),
    logo: absoluteUrl('/images/hero-gallery.jpg'),
    priceRange: 'KES 35,000 – KES 3,500,000',
    currenciesAccepted: 'KES',
    paymentAccepted: 'M-PESA, Bank Transfer, Cash, Card',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'The Loft, 2nd Floor, Kimathi Street',
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi County',
      postalCode: '00100',
      addressCountry: 'KE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -1.2833, longitude: 36.8233 },
    areaServed: [
      { '@type': 'Country', name: 'Kenya' },
      { '@type': 'Country', name: 'Uganda' },
      { '@type': 'Country', name: 'Tanzania' },
      { '@type': 'Country', name: 'Ethiopia' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '10:00',
        closes: '16:00',
      },
    ],
    sameAs: site.social.map((item) => item.href),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Auction categories',
      itemListElement: [
        'Paintings',
        'Sculpture',
        'Photography',
        'Jewellery',
        'Textiles',
        'Ceramics',
      ].map((name) => ({
        '@type': 'OfferCatalog',
        name,
      })),
    },
  };

  const events = auctions.map((auction) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: auction.title,
    description: auction.summary,
    startDate: auction.startsAt,
    endDate: auction.endsAt,
    eventStatus:
      auction.status === 'closed'
        ? 'https://schema.org/EventScheduled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    image: absoluteUrl(auction.coverImage),
    url: absoluteUrl(`/live-auctions#${auction.slug}`),
    isAccessibleForFree: true,
    location: {
      '@type': 'Place',
      name: `${site.name} — ${auction.venue}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'The Loft, 2nd Floor, Kimathi Street',
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
      },
    },
    organizer: { '@type': 'Organization', name: site.name, url: site.url },
    offers: {
      '@type': 'Offer',
      name: 'Bidder registration',
      url: absoluteUrl('/register'),
      price: '0',
      priceCurrency: 'KES',
      availability: 'https://schema.org/InStock',
      validFrom: auction.startsAt,
    },
  }));

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Featured lots',
    numberOfItems: Math.min(lots.length, 12),
    itemListElement: lots.slice(0, 12).map((lot, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/lots/${lot.slug}`),
      name: `${lot.lotNumber} — ${lot.title} by ${lot.artistName}`,
    })),
  };

  const artistList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Represented artists',
    numberOfItems: artists.length,
    itemListElement: artists.map((artist, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/artists/${artist.slug}`),
      name: artist.name,
    })),
  };

  return { gallery, events, itemList, artistList };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { gallery, events, itemList, artistList } = structuredData();
  // Deliberately no `headers()`/`cookies()` here. Reading request data would opt
  // the whole shell into dynamic rendering and silently cancel the ISR windows
  // the brief specifies for /artists/[slug] (600 s), /results, /catalogue and
  // the legal pages (3600 s). The navbar countdown stays accurate because
  // <NavTicker> is a client component that recomputes the remaining time on
  // mount and every second thereafter, so a cached shell is corrected within a
  // frame rather than showing a stale figure.

  return (
    <html lang="en-KE" dir="ltr">
      <head>
        {/* Preload the two faces used above the fold, to avoid a swap flash. */}
        <link
          rel="preload"
          href="/fonts/playfair-display-latin-600-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/roboto-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(gallery) }}
        />
        {events.map((event, index) => (
          <script
            key={`event-${index}`}
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(event) }}
          />
        ))}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(artistList) }}
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-[var(--surface)] antialiased">
        <LoadingScreen />
        <SkipLink />

        {/* Announces client-side navigations for assistive technology (EFFECT-22). */}
        <PageTransitionProvider>
          <SiteHeader />
          <main id="main" className="flex-1 focus-visible:outline-none">
            {children}
          </main>
          <SiteFooter />
          <WhatsAppButton />
          <CookieConsent />
        </PageTransitionProvider>

        {/* Announcement channel used by the auction room, page transitions and
            every optimistic form action. */}
        <div
          id="lah-live-region"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </body>
    </html>
  );
}
