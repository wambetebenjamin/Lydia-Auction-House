'use client';

/**
 * Lot image gallery.
 *
 * • Zoom on hover (desktop, hover-capable pointers only)
 * • Keyboard-navigable thumbnails with roving focus
 * • A caption that states medium, dimensions and lot number, so the information
 *   is available to assistive technology rather than only in the visual
 * • No zoom under reduced motion, where the transform would be disorienting
 */

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import type { Lot } from '@/lib/types';
import { useHoverCapable, usePrefersReducedMotion } from '@/lib/hooks';

interface LotGalleryProps {
  lot: Lot;
  className?: string;
}

export function LotGallery({ lot, className = '' }: LotGalleryProps) {
  const [index, setIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const hoverCapable = useHoverCapable();
  const reduced = usePrefersReducedMotion();
  const thumbsRef = useRef<HTMLUListElement>(null);

  const canZoom = hoverCapable && !reduced;
  const active = lot.images[index] ?? lot.images[0];

  const onMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!canZoom) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setOrigin({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      });
    },
    [canZoom],
  );

  const onThumbKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLUListElement>) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = event.key === 'ArrowRight' ? index + 1 : index - 1;
      const clamped = (next + lot.images.length) % lot.images.length;
      setIndex(clamped);
      const buttons = thumbsRef.current?.querySelectorAll<HTMLButtonElement>('button');
      buttons?.[clamped]?.focus();
    },
    [index, lot.images.length],
  );

  return (
    <div className={className}>
      <div
        className="zoom-frame relative aspect-[4/5] w-full md:aspect-[5/6]"
        onMouseEnter={() => canZoom && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={onMove}
      >
        <Image
          src={active}
          alt={`${lot.title} by ${lot.artistName} — ${lot.medium}, ${lot.dimensions}`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
          style={
            canZoom && zooming
              ? { transform: 'scale(1.55)', transformOrigin: `${origin.x}% ${origin.y}%` }
              : undefined
          }
        />

        {canZoom ? (
          <p
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-3 left-3 rounded-[var(--radius-pill)] bg-[var(--surface-ink)]/80 px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.1em] text-white transition-opacity duration-200 ${
              zooming ? 'opacity-0' : 'opacity-100'
            }`}
          >
            Hover to zoom
          </p>
        ) : null}

        {/* The index, for anyone who cannot see the image change. */}
        <p className="sr-only" aria-live="polite">
          Image {index + 1} of {lot.images.length}. {lot.title} by {lot.artistName}, {lot.medium},{' '}
          {lot.dimensions}.
        </p>
      </div>

      {lot.images.length > 1 ? (
        <ul
          ref={thumbsRef}
          onKeyDown={onThumbKeyDown}
          aria-label="Choose an image"
          className="mt-4 flex gap-2 overflow-x-auto pb-1"
        >
          {lot.images.map((image, thumbIndex) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setIndex(thumbIndex)}
                aria-current={thumbIndex === index ? 'true' : undefined}
                aria-label={`Show image ${thumbIndex + 1}`}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] ${
                  thumbIndex === index
                    ? 'border-[var(--dark)]'
                    : 'border-transparent hover:border-[var(--line-strong)]'
                }`}
              >
                <Image src={image} alt="" fill sizes="4rem" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Fixed caption — medium and dimensions always on screen. */}
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-[var(--line)] pt-4 text-[var(--text-meta)]">
        <dt className="meta">Medium</dt>
        <dd className="text-[var(--ink)]">{lot.medium}</dd>
        <dt className="meta">Dimensions</dt>
        <dd className="text-[var(--ink-muted)]">{lot.dimensions}</dd>
        {lot.edition ? (
          <>
            <dt className="meta">Edition</dt>
            <dd className="text-[var(--ink-muted)]">{lot.edition}</dd>
          </>
        ) : null}
        <dt className="meta">Year</dt>
        <dd className="text-[var(--ink-muted)]">{lot.year}</dd>
      </dl>
    </div>
  );
}
