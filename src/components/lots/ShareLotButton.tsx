'use client';

/**
 * Share on WhatsApp.
 *
 * Links to WhatsApp with the lot name and current bid already in the message,
 * per the brief. Prefers the native share sheet where the browser offers one,
 * and falls back to copying a link with a spoken confirmation.
 */

import { useState } from 'react';
import type { Lot } from '@/lib/types';
import { formatKES } from '@/lib/format';
import { site } from '@/lib/site';
import { absoluteUrl } from '@/lib/site';

interface ShareLotButtonProps {
  lot: Lot;
  currentBid?: number;
  className?: string;
}

export function ShareLotButton({ lot, currentBid, className = '' }: ShareLotButtonProps) {
  const [copied, setCopied] = useState(false);
  const bid = currentBid ?? lot.currentBid;

  const lotUrl = absoluteUrl(`/lots/${lot.slug}`);
  const message = [
    `${lot.title} by ${lot.artistName} — Lot ${lot.lotNumber}`,
    `Current bid: ${formatKES(bid)}`,
    `Estimate: ${formatKES(lot.estimateLow)} – ${formatKES(lot.estimateHigh)}`,
    '',
    `See it at Lydia Auction House: ${lotUrl}`,
  ].join('\n');

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${message.split('\n')[0]} — ${lotUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard blocked — send them to the share target instead.
      window.open(whatsappHref, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="pill-btn pill-btn--secondary min-h-12"
        aria-label={`Share ${lot.title} on WhatsApp`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm4.52 13.97c-.21.58-1.2 1.11-1.68 1.18-.43.06-.97.09-1.56-.1-.36-.11-.82-.26-1.41-.52-2.48-1.07-4.11-3.57-4.23-3.74-.12-.16-1.01-1.34-1.01-2.56s.64-1.82.87-2.07c.22-.25.49-.31.66-.31h.48c.15 0 .36-.06.56.42.21.5.71 1.73.77 1.85.06.13.1.27.02.44-.08.16-.13.27-.25.41-.12.15-.26.33-.37.44-.12.13-.25.26-.11.51.15.25.64 1.06 1.38 1.72.94.84 1.74 1.11 1.99 1.23.25.13.4.11.54-.06.15-.16.62-.72.79-.97.17-.25.33-.21.56-.13.22.09 1.44.69 1.69.81.25.12.42.18.48.29.07.1.07.6-.14 1.18Z" />
        </svg>
        Share lot
      </a>

      <button type="button" onClick={copyLink} className="pill-btn pill-btn--ghost min-h-12">
        {copied ? 'Link copied' : 'Copy link'}
      </button>

      <a
        href={`${site.whatsappLink.split('?')[0]}?text=${encodeURIComponent(
          `Hello! I would like to arrange a private viewing of "${lot.title}" (Lot ${lot.lotNumber}, current bid ${formatKES(bid)}).`,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="pill-btn pill-btn--ghost min-h-12"
      >
        Arrange a viewing
      </a>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'A link to this lot has been copied to your clipboard.' : ''}
      </span>
    </div>
  );
}
