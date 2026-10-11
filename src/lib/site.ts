/**
 * Site-wide configuration.
 * Values that are safe to expose come from NEXT_PUBLIC_* (see .env.example).
 * The design source contained no configuration of any kind (DESIGN-INVENTORY.md §10).
 */

const env = (key: string, fallback = ''): string => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

export const site = {
  name: 'Lydia Auction House',
  shortName: 'Lydia',
  tagline: 'East African Art Deserves a World Stage.',
  description:
    'Live and online auctions of authentic East African paintings, sculpture, and craft. Nairobi, Kenya.',
  url: env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, ''),
  locale: 'en_KE',
  currency: 'KES',
  currencySymbol: 'KES',

  whatsappNumber: env('NEXT_PUBLIC_WHATSAPP_NUMBER', '254112272061'),
  get whatsappLink(): string {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(
      'Hello! I am interested in a lot at Lydia Auction House.',
    )}`;
  },
  whatsappTooltip: 'Ask about a lot or arrange a private viewing',

  phone: env('NEXT_PUBLIC_GALLERY_PHONE', '+254 112 272 061'),
  email: env('NEXT_PUBLIC_GALLERY_EMAIL', 'enquiries@lydiaauctionhouse.co.ke'),
  address: env(
    'NEXT_PUBLIC_GALLERY_ADDRESS',
    'The Loft, 2nd Floor, Kimathi Street, Nairobi CBD, Nairobi, Kenya',
  ),
  addressLines: ['The Loft, 2nd Floor', 'Kimathi Street, Nairobi CBD', 'Nairobi, Kenya'],
  /** Google Maps embed for the gallery address (no API key required). */
  mapsEmbed:
    'https://www.google.com/maps?q=Kimathi%20Street%2C%20Nairobi%2C%20Kenya&output=embed',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=Kimathi+Street+Nairobi+Kenya',

  hours: [
    { days: 'Tuesday – Friday', time: '10:00 – 18:00' },
    { days: 'Saturday', time: '10:00 – 16:00' },
    { days: 'Sunday – Monday', time: 'By appointment' },
  ],

  social: [
    { label: 'Instagram', href: 'https://instagram.com/', icon: 'instagram' },
    { label: 'Facebook', href: 'https://facebook.com/', icon: 'facebook' },
    { label: 'X', href: 'https://x.com/', icon: 'x' },
    { label: 'LinkedIn', href: 'https://linkedin.com/', icon: 'linkedin' },
  ],

  /** Buyer's premium, per the legal brief. Quoted everywhere, sourced once. */
  buyerPremium: 0.15,

  /** Auction credit required by the design source's licence (LICENSE.txt). */
  designCredit: {
    label: 'HTML Codex',
    href: 'https://htmlcodex.com',
    text: 'Design source: PAINTER template by HTML Codex',
  },

  nav: [
    { label: 'Home', href: '/' },
    { label: 'Live Auctions', href: '/live-auctions' },
    { label: 'Upcoming Lots', href: '/upcoming-lots' },
    { label: 'Artists', href: '/artists' },
    { label: 'Catalogue', href: '/catalogue' },
    { label: 'Sell with Us', href: '/sell' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

export function absoluteUrl(path = ''): string {
  const base = site.url;
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function whatsappLotLink(lotTitle: string, currentBid: number, lotUrl?: string): string {
  const bid = `KES ${currentBid.toLocaleString('en-KE')}`;
  const lines = [
    `Hello! I am interested in "${lotTitle}" (current bid ${bid}).`,
    lotUrl ? `Lot page: ${lotUrl}` : '',
    'Could you tell me more about it?',
  ].filter(Boolean);
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}
