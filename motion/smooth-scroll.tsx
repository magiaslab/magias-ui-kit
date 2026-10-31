// Client: scroll fluido con Lenis, agganciato al ticker di GSAP, montato una volta nel layout.
"use client";

// Regole di Lenis (scroll-behavior, pannelli con data-lenis-prevent, pagina ferma).
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { loadGsap } from "./gsap";
import { QUERY_FINE_POINTER, QUERY_MOTION_OK, whileMotionAllowed } from "./preferences";

/*
 * ML03:
 * - solo con puntatore fine e movimento ammesso; sul tocco resta lo scroll del telefono;
 * - si spegne se «riduci movimento» si attiva a pagina aperta (MV01);
 * - dentro dialog, popover e [data-lenis-prevent] la rotella muove il pannello;
 * - quando Radix blocca la pagina (data-scroll-locked) Lenis si ferma;
 * - le àncore le gestisce Lenis e rispettano scroll-padding-top;
 * - stesso ciclo di GSAP: ScrollTrigger legge la posizione che si vede.
 */

type LenisInstance = import("lenis").default;
let instance: LenisInstance | null = null;

/** L'istanza attiva, per chi deve spostare la pagina (null se lo scroll è quello nativo). */
export const getLenis = () => instance;

type Props = {
  /** Cambia a ogni pagina: senza àncora si riparte dall'alto. */
  routeKey?: string;
  /** Interpolazione della rotella: fra 0,09 e 0,11 si sente senza perdere il contatto. */
  lerp?: number;
};

export function SmoothScroll({ routeKey, lerp = 0.1 }: Props) {
  useEffect(
    () =>
      whileMotionAllowed(async (alive) => {
        const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([import("lenis"), loadGsap()]);
        if (!alive()) return;
        const lenis = new Lenis({
          lerp,
          anchors: true,
          prevent: (node) => node.closest?.('[data-lenis-prevent], [role="dialog"], [data-radix-popper-content-wrapper]') != null,
        });
        instance = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        // Senza, tornando su una scheda rimasta in secondo piano lo scroll fa un salto.
        gsap.ticker.lagSmoothing(0);

        const syncLock = () => (document.body.hasAttribute("data-scroll-locked") ? lenis.stop() : lenis.start());
        const observer = new MutationObserver(syncLock);
        observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });

        return () => {
          observer.disconnect();
          gsap.ticker.remove(tick);
          lenis.destroy();
          instance = null;
        };
      }, `${QUERY_MOTION_OK} and ${QUERY_FINE_POINTER}`),
    [lerp],
  );

  useEffect(() => {
    if (!window.location.hash) instance?.scrollTo(0, { immediate: true, force: true });
  }, [routeKey]);

  return null;
}
