// Client: striscia orizzontale bloccata durante lo scroll, usabile da tastiera (MV07).
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { loadGsap } from "./gsap";
import { whileMotionAllowed } from "./preferences";

/*
 * - Il markup di partenza è una striscia a scroll nativo con scroll-snap: è la versione
 *   per schermi stretti, movimento ridotto e JavaScript assente.
 * - Da minWidth, con movimento ammesso, la sezione si blocca e la traccia scorre di lato.
 * - Un elemento che riceve il focus da tastiera porta lo scroll al punto in cui la
 *   striscia lo mostra: il focus non finisce mai fuori schermo.
 * - Un link «Salta» porta subito dopo la sezione.
 */

type Props = {
  label: string;
  children: ReactNode;
  /** Media query della versione bloccata. */
  pinnedQuery?: string;
  /** Distanza dall'alto del pin, es. l'altezza dell'header fisso. */
  offsetTop?: () => number;
  skipLabel?: string;
  className?: string;
  trackClassName?: string;
};

export function HorizontalStrip({
  label,
  children,
  pinnedQuery = "(min-width: 64rem)",
  offsetTop = () => 0,
  skipLabel = "Salta questa sezione",
  className,
  trackClassName,
}: Props) {
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  // In un ref: una funzione nuova a ogni render non deve far ripartire il pin.
  const offset = useRef(offsetTop);
  offset.current = offsetTop;

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
            scrollTrigger: { trigger: s, start: () => `top ${offset.current()}px`, end: () => `+=${distance()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
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
    [pinnedQuery],
  );

  return (
    <>
      <a href={`#${id}-dopo`} className="m-skip-link">
        {skipLabel}
      </a>
      <section ref={section} aria-label={label} className={className} style={{ overflow: "clip" }}>
        <div ref={track} className={trackClassName} style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory" }}>
          {children}
        </div>
      </section>
      <span id={`${id}-dopo`} tabIndex={-1} />
    </>
  );
}
