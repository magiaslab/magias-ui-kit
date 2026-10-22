// Ponte unico fra i token CSS del movimento e GSAP (ML01).
"use client";

/*
 * Durate ed easing vivono in tokens/theme.css (--duration-*, --ease-*). Qui si leggono
 * una volta sola, così il codice del movimento non scrive numeri suoi: cambiare un token
 * cambia anche le animazioni JavaScript.
 */

export type DurationToken = "fast" | "base" | "slow" | "editorial" | "long";
export type EaseToken = "out-soft" | "editorial" | "inout";

const FALLBACK_MS: Record<DurationToken, number> = { fast: 150, base: 250, slow: 400, editorial: 700, long: 1100 };
const FALLBACK_EASE: Record<EaseToken, string> = {
  "out-soft": "cubic-bezier(0.16, 0.68, 0.28, 1)",
  editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
  inout: "cubic-bezier(0.65, 0, 0.35, 1)",
};

let cache: { ms: Record<DurationToken, number>; ease: Record<EaseToken, string> } | null = null;

function read() {
  if (cache) return cache;
  const style = getComputedStyle(document.documentElement);
  const ms = { ...FALLBACK_MS };
  for (const key of Object.keys(ms) as DurationToken[]) {
    const raw = style.getPropertyValue(`--duration-${key}`).trim();
    const value = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
    if (Number.isFinite(value)) ms[key] = value;
  }
  const ease = { ...FALLBACK_EASE };
  for (const key of Object.keys(ease) as EaseToken[]) {
    const raw = style.getPropertyValue(`--ease-${key}`).trim();
    if (raw) ease[key] = raw;
  }
  cache = { ms, ease };
  return cache;
}

/** Durata in secondi, come la vuole GSAP. */
export function duration(token: DurationToken): number {
  return read().ms[token] / 1000;
}

/** Curva CSS del token, da registrare con CustomEase o da usare in CSS. */
export function easeCss(token: EaseToken): string {
  return read().ease[token];
}

/**
 * Converte un cubic-bezier CSS in una funzione di easing (t → progresso), così GSAP la
 * usa senza il plugin CustomEase. Newton-Raphson come nei browser.
 */
export function easeFn(token: EaseToken): (t: number) => number {
  const m = easeCss(token).match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return (t) => t;
  const [x1, y1, x2, y2] = m[1].split(",").map(Number);
  const bez = (a: number, b: number) => (t: number) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
  const bx = bez(x1, x2);
  const by = bez(y1, y2);
  const dx = (t: number) => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * (1 - t) * t + 3 * (1 - x2) * t ** 2;
  return (x) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (bx(t) - x) / d;
    }
    return by(Math.min(1, Math.max(0, t)));
  };
}

/** Da chiamare se i token cambiano a pagina aperta (raro: tema per sezione no, per sito sì). */
export function resetMotionTokens() {
  cache = null;
}
