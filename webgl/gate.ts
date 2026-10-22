// Controlli prima di caricare una scena WebGL (ML04).
"use client";

import { QUERY_MOTION_OK, saveData } from "../motion/preferences";

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

let gestured = false;

/**
 * fn al primo gesto della persona (mouse, tocco, tastiera, rotella, scroll), oppure
 * subito se c'è già stato: il caricamento della pagina resta leggero e la scena arriva
 * appena qualcuno si muove.
 */
export function afterFirstGesture(fn: () => void): () => void {
  if (gestured) {
    fn();
    return () => {};
  }
  const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
  const off = () => events.forEach((e) => window.removeEventListener(e, go));
  const go = () => {
    gestured = true;
    off();
    fn();
  };
  events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
  return off;
}

/** fn quando el arriva vicino alla vista (di default a una schermata e mezza). */
export function whenNear(el: Element, fn: () => void, rootMargin = "150%"): () => void {
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      fn();
    },
    { rootMargin },
  );
  io.observe(el);
  return () => io.disconnect();
}

/** Tutte le condizioni per caricare una scena, nell'ordine dal più economico. */
export function sceneAllowed(): boolean {
  return window.matchMedia(QUERY_MOTION_OK).matches && !saveData() && webglAvailable();
}

/** Densità di pixel con tetto: 2 su schermi grandi, 1,5 sul telefono. */
export function cappedPixelRatio(): number {
  const max = window.matchMedia("(max-width: 48rem)").matches ? 1.5 : 2;
  return Math.min(window.devicePixelRatio || 1, max);
}

/** Sul telefono metà degli elementi. */
export function deviceCount(desktop: number): number {
  return window.matchMedia("(max-width: 48rem)").matches ? Math.round(desktop / 2) : desktop;
}
