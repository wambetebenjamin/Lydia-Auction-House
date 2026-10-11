'use client';

/**
 * EFFECT-04 — Expressive typography.
 * EFFECT-23 — Hero entrance (this component owns the headline stage).
 *
 * • Per-letter stagger reveal, driven by CSS animation-delay so the whole
 *   sequence is one composite on the GPU.
 * • The keyword "Art" receives a glitch pass once, after the letters settle.
 * • The split glyphs are `aria-hidden`; a clean, screen-reader-only sentence
 *   carries the real text, so assistive technology reads one fluent sentence
 *   rather than forty-one single letters.
 * • Under `prefers-reduced-motion: reduce` the headline is instant and the
 *   glitch never runs (see the `@media` block in components.css and the
 *   `reduced` branch below).
 */

import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';

interface HeroHeadlineProps {
  /** The full, clean sentence. */
  text: string;
  /** Substring that receives the glitch pass. Must appear in `text`. */
  glitch?: string;
  className?: string;
  /** Milliseconds before the first letter appears. */
  startDelay?: number;
  /** Milliseconds between letters. */
  stagger?: number;
  as?: 'h1' | 'h2' | 'p';
}

export function HeroHeadline({
  text,
  glitch = 'Art',
  className = '',
  startDelay = 120,
  stagger = 18,
  as: Tag = 'h1',
}: HeroHeadlineProps) {
  const reduced = usePrefersReducedMotion();
  const [settled, setSettled] = useState(false);

  /* Split into runs so the glitch keyword keeps its own grouping while the
     letters inside it still stagger with everything else. */
  const runs = useMemo(() => {
    const index = glitch ? text.indexOf(glitch) : -1;
    if (index === -1) return [{ text, glitch: false }];
    return [
      { text: text.slice(0, index), glitch: false },
      { text: glitch, glitch: true },
      { text: text.slice(index + glitch.length), glitch: false },
    ].filter((run) => run.text.length > 0);
  }, [text, glitch]);

  const totalLetters = text.length;
  const glitchFrom = glitch ? text.indexOf(glitch) : -1;
  const glitchStart = startDelay + glitchFrom * stagger;

  /* Fire the glitch once, after the last letter has landed. */
  useEffect(() => {
    if (reduced || glitchFrom === -1) return;
    const at = glitchStart + stagger * glitch.length + 260;
    const id = window.setTimeout(() => setSettled(true), at);
    return () => window.clearTimeout(id);
  }, [reduced, glitchFrom, glitchStart, stagger, glitch.length]);

  let letterIndex = -1;

  return (
    <Tag className={className}>
      {/* The real, clean sentence. */}
      <span className="sr-only">{text}</span>

      {/* The decorative, per-letter rendering. */}
      <span aria-hidden="true" data-letters={totalLetters}>
        {runs.map((run, runIndex) =>
          run.glitch ? (
            <span
              key={`glitch-${runIndex}`}
              className="lah-glitch"
              data-settled={settled ? 'true' : 'false'}
            >
              {Array.from(run.text).map((character, i) => {
                letterIndex += 1;
                return (
                  <Letter
                    key={`g-${i}`}
                    character={character}
                    delay={reduced ? 0 : startDelay + letterIndex * stagger}
                    reduced={reduced}
                    animate={!reduced}
                  />
                );
              })}
            </span>
          ) : (
            Array.from(run.text).map((character, i) => {
              letterIndex += 1;
              return (
                <Letter
                  key={`c-${runIndex}-${i}`}
                  character={character}
                  delay={reduced ? 0 : startDelay + letterIndex * stagger}
                  reduced={reduced}
                  animate={!reduced}
                />
              );
            })
          ),
        )}
      </span>
    </Tag>
  );
}

function Letter({
  character,
  delay,
  reduced,
  animate,
}: {
  character: string;
  delay: number;
  reduced: boolean;
  animate: boolean;
}) {
  if (character === ' ') {
    // A non-breaking space keeps the line from collapsing mid-animation, and
    // is never itself animated.
    return <span className="inline-block">&nbsp;</span>;
  }

  return (
    <span
      className={`inline-block ${animate ? 'lah-letter' : ''}`}
      style={
        animate
          ? { animationDelay: `${delay}ms` }
          : reduced
            ? undefined
            : { opacity: 1 }
      }
    >
      {character}
    </span>
  );
}
