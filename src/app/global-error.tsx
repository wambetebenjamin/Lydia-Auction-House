'use client';

/**
 * Last-resort error boundary. Next renders this *instead of* the root layout,
 * so it must ship its own <html> and <body> and cannot rely on the app shell,
 * the header, the footer or Tailwind's cascade in the usual order.
 *
 * Everything below is therefore inline-styled with the design source's four
 * tokens hard-coded — which is also the correct reduced-motion behaviour: a
 * solid, unanimated notice with no dependency on JavaScript that may itself
 * have failed.
 */

import { useEffect } from 'react';

const TOKENS = {
  primary: '#FFE468',
  secondary: '#8CC641',
  light: '#F2F2F2',
  dark: '#272630',
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[lah] global error', error.digest ?? '', error.message);
  }, [error]);

  return (
    <html lang="en-KE">
      <head>
        <title>Something went wrong — Lydia Auction House</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: '#FFFFFF',
          color: TOKENS.dark,
          fontFamily:
            'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          fontSize: '16px',
          lineHeight: 1.6,
          padding: '2rem',
        }}
      >
        <main style={{ maxWidth: '38rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#B3261E',
              margin: 0,
            }}
          >
            Error 500
          </p>

          <span
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '80px',
              height: '80px',
              margin: '1.75rem auto 0',
              transform: 'rotate(-45deg)',
              backgroundColor: '#B3261E',
              color: '#FFFFFF',
              fontSize: '1.75rem',
              fontWeight: 600,
            }}
          >
            <span style={{ transform: 'rotate(45deg)' }}>!</span>
          </span>

          <h1
            role="alert"
            style={{
              marginTop: '2rem',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              lineHeight: 1.15,
              fontWeight: 500,
            }}
          >
            Something went wrong in the auction room.
            <span style={{ display: 'block', marginTop: '0.25rem', color: '#5B5A66' }}>
              We are fixing it.
            </span>
          </h1>

          <p style={{ marginTop: '1.25rem', color: '#5B5A66' }}>
            The site could not start. Nothing you have bid has been lost — bids are stored on the
            server, not in your browser. Please try again, and if this keeps happening, message the
            house and we will take your bid by hand.
          </p>

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: '48px',
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: '2px solid transparent',
                backgroundColor: TOKENS.dark,
                color: TOKENS.primary,
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Try Again
            </button>
            <a
              href="https://wa.me/254112272061?text=Hello!%20The%20Lydia%20Auction%20House%20site%20is%20showing%20an%20error."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                minHeight: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: `2px solid ${TOKENS.dark}`,
                color: TOKENS.dark,
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              WhatsApp the house
            </a>
          </div>

          <p style={{ marginTop: '2rem', fontSize: '11px', color: '#8A8994' }}>
            {error.digest ? (
              <>
                Reference for our engineers:{' '}
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {error.digest}
                </span>
              </>
            ) : (
              'Lydia Auction House, Kimathi Street, Nairobi'
            )}
          </p>
        </main>
      </body>
    </html>
  );
}
