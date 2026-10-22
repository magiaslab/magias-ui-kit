// Client: striscia orizzontale bloccata durante lo scroll, usabile da tastiera (MV07).
"use client";

import { Children, useEffect, useId, useRef, type ReactNode } from "react";
import { loadGsap } from "./gsap";
import { whileMotionAllowed } from "./preferences";

/*
 * - Il markup di partenza è una striscia a scroll nativo con scroll-snap: è la versione
 *   per schermi stretti, movimento ridotto e JavaScript assente.
 * - Da minWidth, con movimento ammesso, la sezione si blocca e la traccia scorre di lato.
 * - Un elemento che riceve il focus da tastiera porta lo scroll al punto in cui la
 *   striscia lo mostra: il focus non finisce mai fuori schermo.
 * - Un link «Salta» porta subito dopo la sezione.
 * - Le card sono voci di un elenco; la traccia nativa si scorre anche con le frecce.
 */

type Props = {
  /** id del titolo della sezione, oppure label se il titolo non c'è. */
  labelledBy?: string;
  label?: string;
  /** Titolo e introduzione, dentro la sezione bloccata. */
  header?: ReactNode;
  /** Azione dopo la traccia (es. «Tutte le camere»). */
  after?: ReactNode;
  /** Una card per figlio. */
  children: ReactNode;
  /** Media query della versione bloccata. */
  pinnedQuery?: string;
  /** Elemento fisso sopra il pin (es. "[data-site-header]"): il pin parte sotto di lui. */
  offsetSelector?: string;
  skipLabel?: string;
  className?: string;
  trackClassName?: string;
  itemClassName?: string;
};

/** Altezza dell'elemento se è sticky o fixed, altrimenti 0. Una prop stringa: passa anche da un componente server. */
function offsetOf(selector?: string): number {
  const el = selector ? document.querySelector<HTMLElement>(selector) : null;
  if (!el) return 0;
  const position = getComputedStyle(el).position;
  return position === "sticky" || position === "fixed" ? el.offsetHeight : 0;
}

export function HorizontalStrip({
  labelledBy,
  label,
  header,
  after,
  children,
  pinnedQuery = "(min-width: 64rem)",
  offsetSelector,
  skipLabel = "Salta questa sezione",
  className,
  trackClassName,
  itemClassName,
}: Props) {
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);

  useEffect(
    () =>
      whileMotionAllowed(async () => {
        const s = section.current;
        const t = track.current;
        if (!s || !t) return;
        const { gsap } = await loadGsap();
        const distance = () => Math.max(0, t.scrollWidth - t.clientWidth);
        if (distance() === 0) return;
        s.dataset.mPinned = "";
        const ctx = gsap.context(() => {
          gsap.set(t, { overflowX: "visible", scrollSnapType: "none" });
          const tween = gsap.to(t, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: { trigger: s, start: () => `top ${offsetOf(offsetSelector)}px`, end: () => `+=${distance()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
          });
          let frame = 0;
          const onFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            const item = [...t.children].find((c) => c.contains(target)) as HTMLElement | undefined;
            if (!item || !target.matches(":focus-visible")) return;
            cancelAnimationFrame(frame);
            // Dopo lo scroll automatico del browser, che altrimenti sovrascriverebbe il nostro.
            frame = requestAnimationFrame(() => {
              const st = tween.scrollTrigger;
              if (!st) return;
              s.scrollLeft = 0;
              const x = Math.min(distance(), Math.max(0, item.offsetLeft - (t.clientWidth - item.offsetWidth) / 2));
              window.scrollTo({ top: st.start + (x / distance()) * (st.end - st.start), behavior: "instant" });
            });
          };
          s.addEventListener("focusin", onFocus);
          return () => {
            cancelAnimationFrame(frame);
            s.removeEventListener("focusin", onFocus);
          };
        }, s);
        return () => {
          ctx.revert();
          delete s.dataset.mPinned;
        };
      }, `(prefers-reduced-motion: no-preference) and ${pinnedQuery}`),
    [pinnedQuery, offsetSelector],
  );

  return (
    <>
      <a href={`#${id}-dopo`} className="m-skip-link">
        {skipLabel}
      </a>
      <section ref={section} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label} className={className} style={{ overflow: "clip" }}>
        {header}
        <ul
          ref={track}
          // Traccia nativa raggiungibile da tastiera e scorrevole con le frecce (2.1.1).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          aria-labelledby={labelledBy}
          aria-label={labelledBy ? undefined : label}
          className={trackClassName}
          style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory" }}
        >
          {Children.map(children, (child) => (
            <li className={itemClassName} style={{ flexShrink: 0, scrollSnapAlign: "start" }}>
              {child}
            </li>
          ))}
        </ul>
        {after}
      </section>
      <span id={`${id}-dopo`} tabIndex={-1} />
    </>
  );
}
