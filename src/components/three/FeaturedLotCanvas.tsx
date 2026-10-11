'use client';

/**
 * EFFECT-01 — Real-time rendering.
 *
 * A Three.js WebGL canvas in the featured lot section, rendering the current top
 * lot as a slowly rotating 3D object:
 *
 *   • `canvas`    → the painting, as a framed canvas rotating in 3D space
 *   • `sculpture` → a carved standing form, lathed from a profile curve
 *   • `object`    → a faceted object (vessel / ornament) as an icosahedron
 *
 * Interaction
 *   • Orbitable by drag (pointer events, with inertia and a damping settle)
 *   • Arrow keys for keyboard users — the canvas is a single focusable control
 *     with a documented key map, and `Shift` + arrow accelerates
 *   • Auto-rotation resumes after 4 seconds of no interaction
 *
 * Fallbacks
 *   • `prefers-reduced-motion: reduce` → the poster image only; WebGL is never
 *     initialised, so no GPU work happens at all
 *   • no WebGL context available → the poster image
 *   • hidden below 768px (per the brief's responsive rules) — the container is
 *     `hidden md:block`, and the renderer is not started while hidden
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Lot } from '@/lib/types';
import { useMediaQuery, usePrefersReducedMotion } from '@/lib/hooks';
import { formatKES } from '@/lib/format';

interface FeaturedLotCanvasProps {
  lot: Lot;
  className?: string;
}

type ThreeModule = typeof import('three');

export function FeaturedLotCanvas({ lot, className = '' }: FeaturedLotCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // WebGL is only attempted where the brief allows it: desktop, motion allowed.
  const shouldRender = isDesktop && !reduced && !failed;

  useEffect(() => {
    if (!shouldRender) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      let THREE: ThreeModule;
      try {
        THREE = await import('three');
      } catch {
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed || !hostRef.current) return;

      /* ── Renderer ─────────────────────────────────────────────────────── */
      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
      } catch {
        setFailed(true);
        return;
      }

      const prefersDarkContrast = window.matchMedia('(prefers-contrast: more)').matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth, host.clientHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        34,
        host.clientWidth / Math.max(host.clientHeight, 1),
        0.1,
        100,
      );
      camera.position.set(0, 0.35, 6.4);
      camera.lookAt(0, 0, 0);

      /* ── Lighting. Warm key, cool fill, a rim to separate the object from
            the ink backdrop. ─────────────────────────────────────────────── */
      scene.add(new THREE.AmbientLight(0xfff4d6, prefersDarkContrast ? 1.5 : 0.85));

      const key = new THREE.DirectionalLight(0xffe9b8, 2.5);
      key.position.set(-4.2, 5.2, 4.4);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xbcd2ff, 0.85);
      fill.position.set(4.5, -1.4, 3.2);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0x8cc641, 1.35);
      rim.position.set(0.6, 2.2, -5.5);
      scene.add(rim);

      /* ── The object. A pivot carries the whole assembly so orbit and
            auto-rotation compose cleanly. ──────────────────────────────── */
      const pivot = new THREE.Group();
      scene.add(pivot);

      const disposables: { dispose: () => void }[] = [];

      if (lot.renderKind === 'canvas') {
        /* A framed canvas: the artwork on the front face, a slim profile
           around the sides, and a frame standing proud of it. */
        const aspect = 1.34;
        const texture = await new THREE.TextureLoader().loadAsync(lot.images[0]);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        disposables.push(texture);

        const bodyGeometry = new THREE.BoxGeometry(3.24 * aspect, 3.24, 0.16);
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: 0xe8e4d6,
          roughness: 0.92,
          metalness: 0,
        });
        // BoxGeometry material order: +x, -x, +y, -y, +z, -z
        const bodyMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.68,
          metalness: 0.02,
        });
        const body = new THREE.Mesh(bodyGeometry, [
          sideMaterial,
          sideMaterial,
          sideMaterial,
          sideMaterial,
          bodyMaterial,
          sideMaterial,
        ]);
        disposables.push(bodyGeometry, sideMaterial, bodyMaterial);
        pivot.add(body);

        // The frame: four mitred bars, in the source's --primary.
        const frameMaterial = new THREE.MeshStandardMaterial({
          color: 0xffe468,
          roughness: 0.44,
          metalness: 0.28,
        });
        disposables.push(frameMaterial);
        const frameWidth = 0.22;
        const outerW = 3.24 * aspect + frameWidth * 2;
        const outerH = 3.24 + frameWidth * 2;
        const bars: [number, number, number, number][] = [
          [outerW, frameWidth, 0, 3.24 / 2 + frameWidth / 2],
          [outerW, frameWidth, 0, -(3.24 / 2 + frameWidth / 2)],
          [frameWidth, outerH - frameWidth * 2, 3.24 * aspect / 2 + frameWidth / 2, 0],
          [frameWidth, outerH - frameWidth * 2, -(3.24 * aspect / 2 + frameWidth / 2), 0],
        ];
        for (const [w, h, x, y] of bars) {
          const geometry = new THREE.BoxGeometry(w, h, 0.26);
          disposables.push(geometry);
          const bar = new THREE.Mesh(geometry, frameMaterial);
          bar.position.set(x, y, 0.03);
          pivot.add(bar);
        }
      } else if (lot.renderKind === 'sculpture') {
        /* A carved standing form: a lathe from a hand-authored profile, with
           a deliberate asymmetry so it reads as carved rather than turned. */
        const profilePoints: [number, number][] = [
          [0.0, -1.85],
          [0.34, -1.82],
          [0.42, -1.6],
          [0.36, -1.2],
          [0.44, -0.72],
          [0.52, -0.2],
          [0.46, 0.34],
          [0.33, 0.78],
          [0.2, 1.05],
          [0.24, 1.2],
          [0.17, 1.36],
          [0.2, 1.46],
          [0.1, 1.56],
          [0.0, 1.6],
        ];
        const profile = profilePoints.map(([x, y]) => new THREE.Vector2(x, y));

        const geometry = new THREE.LatheGeometry(profile, 64);
        const material = new THREE.MeshStandardMaterial({
          color: 0x2a2118,
          roughness: 0.52,
          metalness: 0.12,
        });
        disposables.push(geometry, material);

        const figure = new THREE.Mesh(geometry, material);
        figure.scale.setScalar(1.72);
        // A slight lean, so the form is not perfectly bilaterally symmetric.
        figure.rotation.z = 0.045;
        figure.rotation.x = -0.04;
        pivot.add(figure);

        // Carved facet lines: thin rings at the profile's turning points.
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x8cc641,
          transparent: true,
          opacity: 0.32,
        });
        disposables.push(ringMaterial);
        for (const y of [-0.9, -0.1, 0.62, 1.14]) {
          const ringGeometry = new THREE.TorusGeometry(0.44 + Math.abs(y) * 0.06, 0.006, 6, 48);
          disposables.push(ringGeometry);
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = y * 1.72;
          pivot.add(ring);
        }
      } else {
        /* A faceted object: a vessel or ornament as a subdivided icosahedron,
           with visible facet edges picked out in the source's green. */
        const geometry = new THREE.IcosahedronGeometry(1.62, 1);
        const material = new THREE.MeshStandardMaterial({
          color: 0xf0ead6,
          roughness: 0.38,
          metalness: 0.22,
          flatShading: true,
        });
        disposables.push(geometry, material);
        pivot.add(new THREE.Mesh(geometry, material));

        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x8cc641,
          transparent: true,
          opacity: 0.55,
        });
        disposables.push(edgeGeometry, edgeMaterial);
        pivot.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
      }

      /* ── Orbit state ──────────────────────────────────────────────────── */
      const state = {
        rotY: -0.42,
        rotX: -0.08,
        targetRotY: -0.42,
        targetRotX: -0.08,
        autoSpin: 0.0022,
        idleSince: performance.now(),
        dragging: false,
        lastX: 0,
        lastY: 0,
        velocity: 0,
      };

      const onPointerDown = (event: PointerEvent) => {
        state.dragging = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        state.velocity = 0;
        state.idleSince = performance.now();
        (event.target as Element).setPointerCapture?.(event.pointerId);
        host.style.cursor = 'grabbing';
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!state.dragging) return;
        const dx = event.clientX - state.lastX;
        const dy = event.clientY - state.lastY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        state.targetRotY += dx * 0.0085;
        state.targetRotX = Math.max(-0.85, Math.min(0.85, state.targetRotX + dy * 0.006));
        state.velocity = dx * 0.0085;
        state.idleSince = performance.now();
      };

      const onPointerUp = (event: PointerEvent) => {
        state.dragging = false;
        state.idleSince = performance.now();
        host.style.cursor = 'grab';
        (event.target as Element).releasePointerCapture?.(event.pointerId);
      };

      const onKeyDown = (event: KeyboardEvent) => {
        const step = event.shiftKey ? 0.24 : 0.085;
        let handled = true;
        switch (event.key) {
          case 'ArrowLeft':
            state.targetRotY -= step;
            break;
          case 'ArrowRight':
            state.targetRotY += step;
            break;
          case 'ArrowUp':
            state.targetRotX = Math.max(-0.85, state.targetRotX - step * 0.6);
            break;
          case 'ArrowDown':
            state.targetRotX = Math.min(0.85, state.targetRotX + step * 0.6);
            break;
          case 'Home':
            state.targetRotY = -0.42;
            state.targetRotX = -0.08;
            break;
          default:
            handled = false;
        }
        if (handled) {
          event.preventDefault();
          state.idleSince = performance.now();
          announce(
            `Rotated to ${Math.round((state.targetRotY * 180) / Math.PI) % 360} degrees.`,
          );
        }
      };

      host.style.cursor = 'grab';
      host.style.touchAction = 'pan-y';
      host.addEventListener('pointerdown', onPointerDown);
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerup', onPointerUp);
      host.addEventListener('pointercancel', onPointerUp);
      host.addEventListener('keydown', onKeyDown);

      /* ── Resize ───────────────────────────────────────────────────────── */
      const resize = () => {
        const width = host.clientWidth;
        const height = Math.max(host.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      /* ── Loop ─────────────────────────────────────────────────────────── */
      let frame = 0;
      const clock = new THREE.Clock();

      const tick = () => {
        frame = window.requestAnimationFrame(tick);
        const delta = Math.min(clock.getDelta(), 0.05);

        // Inertia after release, decaying into the idle auto-rotation.
        if (!state.dragging) {
          state.targetRotY += state.velocity;
          state.velocity *= 0.92;
          const idleFor = performance.now() - state.idleSince;
          if (idleFor > 4000) state.targetRotY += state.autoSpin * (delta * 60);
        }

        state.rotY += (state.targetRotY - state.rotY) * 0.09;
        state.rotX += (state.targetRotX - state.rotX) * 0.09;

        pivot.rotation.y = state.rotY;
        pivot.rotation.x = state.rotX;

        // A barely-perceptible vertical float keeps the object alive.
        pivot.position.y = Math.sin(performance.now() * 0.00042) * 0.075;

        renderer.render(scene, camera);
      };
      frame = window.requestAnimationFrame(tick);
      setReady(true);

      /* ── Teardown ─────────────────────────────────────────────────────── */
      cleanup = () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        host.removeEventListener('pointerdown', onPointerDown);
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerup', onPointerUp);
        host.removeEventListener('pointercancel', onPointerUp);
        host.removeEventListener('keydown', onKeyDown);
        disposables.forEach((item) => item.dispose());
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [shouldRender, lot.images, lot.renderKind, lot.id]);

  /* ── Fallback: the poster image ───────────────────────────────────────── */
  const showPoster = !shouldRender;

  return (
    <figure className={`relative ${className}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-ink-raised)] md:aspect-[4/5]">
        {/* Poster — always rendered beneath, so there is never a blank box and
            the poster-only path under reduced motion needs no separate branch. */}
        <Image
          src={lot.images[0]}
          alt={
            showPoster
              ? `${lot.title} by ${lot.artistName}`
              : ''
          }
          aria-hidden={showPoster ? undefined : true}
          fill
          sizes="(min-width: 1024px) 34vw, (min-width: 768px) 40vw, 100vw"
          priority
          className={`object-cover transition-opacity duration-500 ${
            ready && !showPoster ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* The 3D host. Hidden below 768px, per the brief. */}
        <div
          ref={hostRef}
          role="application"
          tabIndex={0}
          aria-label={`Interactive 3D view of ${lot.title} by ${lot.artistName}. Use the arrow keys to rotate, or drag with a pointer. Press Home to reset.`}
          aria-hidden={showPoster ? true : undefined}
          className={`absolute inset-0 hidden outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--primary)] md:block ${
            showPoster ? 'pointer-events-none' : ''
          }`}
        />
      </div>

      <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="meta">
          {showPoster ? 'Poster view' : 'Drag or use arrow keys to rotate'}
        </span>
        <span className="meta text-[var(--primary)]">Featured lot {lot.lotNumber}</span>
      </figcaption>

      {/* A visible, honest caption for the live figure. */}
      <p className="mt-2 text-[var(--text-body-min)] text-white/70">
        Current bid{' '}
        <strong className="font-[family-name:var(--font-display)] text-[var(--text-lead)] text-[var(--primary)] [font-variant-numeric:tabular-nums]">
          {formatKES(lot.currentBid)}
        </strong>{' '}
        · {lot.bidCount} bids from {lot.bidderCount} bidders
      </p>
    </figure>
  );
}

function announce(message: string): void {
  const region = document.getElementById('lah-live-region');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 40);
}
