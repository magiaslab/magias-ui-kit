// Client: coreografia di scroll dichiarata con attributi data-m-*, montata una volta nel layout.
"use client";

import { useEffect } from "react";
import { loadGsap, whenIdle } from "./gsap";
import { whileMotionAllowed } from "./preferences";
import { duration, easeFn } from "./tokens";

/*
 * Le sezioni restano componenti server e chiedono un effetto con un attributo. Un
 * elemento ha un solo attributo data-m, quindi un solo effetto (MV08). Prefisso unico
 * data-m-*: non si scontra con il tracciamento (ML02).
 *
 *   data-m="reveal"         il blocco entra dal basso
 *   data-m="split"          titolo riga per riga (mai l'h1 della prima schermata)
 *   data-m="veil"           il riquadro si scopre dal basso, legato allo scroll
 *   data-m="line"           filetto che si scopre da sinistra
 *   data-m="draw"           <svg>: le <line> dirette si disegnano, poi compare il resto
 *   data-m="parallax"       immagine più lenta del riquadro; data-m-amount="0.12"
 *   data-m="zoom"           zoom che si assesta; data-m-amount="0.16"
 *   data-m="curtain"        riquadro con foto che si apre dal centro
 *   data-m="expand"         foto a tutta larghezza che si allarga ai bordi (da md)
 *   data-m-scope            contenitore: i suoi p, li, figure, h3… entrano come reveal,
 *                           e i suoi h2 riga per riga se autoSplit è attivo
 *   data-m-none             esclude un ramo (prima schermata, dialog)
 *
 * Regole del motore:
 * - ciò che è visibile al caricamento non si anima;
 * - lo stato iniziale lo imposta lo script, mai il CSS: senza JavaScript la pagina è
 *   completa (MV02);
 * - si usa opacity e non visibility: un blocco in attesa resta raggiungibile da
 *   tastiera e dalla ricerca nella pagina, e se riceve il focus compare subito (MV04);
 * - nessuna lettura di layout per ogni immagine: zoom e parallax solo se dichiarati (PF05);
 * - con «riduci movimento», anche attivato a pagina aperta, tutto torna allo stato
 *   finale e GSAP non si scarica (MV01).
 */

const AUTO_BLOCKS = "p, li, figure, details, blockquote, dl, form, table, h3";
const START = "top 88%";
const EXCLUDED = "[data-m-none], [role=dialog], [data-radix-popper-content-wrapper]";

type Props = {
  /** Cambia a ogni pagina (es. il pathname): il motore riparte da capo. */
  routeKey?: string;
  /** Selettore dei titoli da dividere in righe dentro data-m-scope, es. "h2". */
  autoSplit?: string;
};

export function ScrollMotion({ routeKey, autoSplit }: Props) {
  useEffect(() => {
    let stop: (() => void) | undefined;
    const cancelIdle = whenIdle(() => {
      stop = whileMotionAllowed(() => start(autoSplit));
    });
    return () => {
      cancelIdle();
      stop?.();
    };
  }, [routeKey, autoSplit]);

  return null;
}

async function start(autoSplit?: string): Promise<() => void> {
  const { gsap, ScrollTrigger, SplitText } = await loadGsap();
  // SplitText misura le righe con il carattere definitivo.
  await document.fonts.ready;

  const vh = () => document.documentElement.clientHeight;
  const inViewAtLoad = (el: Element) => el.getBoundingClientRect().top < vh() * 0.88;
  const free = (el: Element) => !el.closest(EXCLUDED);
  const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)].filter(free);
  const declared = (name: string) => all(`[data-m="${name}"]`);
  const amount = (el: HTMLElement, fallback: number) => Number(el.dataset.mAmount) || fallback;

  const ease = easeFn("editorial");
  const ctx = gsap.context(() => {
    // --- Titoli riga per riga -------------------------------------------------------
    const autoTitles = autoSplit ? all("[data-m-scope]").flatMap((s) => [...s.querySelectorAll<HTMLElement>(autoSplit)].filter((el) => free(el) && !el.dataset.m)) : [];
    const splitTargets = new Set([...declared("split"), ...autoTitles].filter((el) => el.tagName !== "H1" && !inViewAtLoad(el)));
    [...splitTargets]
      .forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          // aria-label sull'elemento e righe aria-hidden: il lettore di schermo legge
          // il titolo intero, non a pezzi (MV03).
          aria: "auto",
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: duration("long"),
              ease,
              stagger: 0.08,
              scrollTrigger: { trigger: el, start: START, once: true },
            }),
        });
      });

    // --- Blocchi -----------------------------------------------------------------------
    const scoped = all("[data-m-scope]").flatMap((scope) => [...scope.querySelectorAll<HTMLElement>(AUTO_BLOCKS)].filter(free));
    const candidates = [...new Set([...declared("reveal"), ...scoped])].filter(
      // Un elemento con un altro effetto dichiarato non riceve anche il reveal.
      (el) => (!el.dataset.m || el.dataset.m === "reveal") && !splitTargets.has(el) && !el.closest('[data-m="split"]'),
    );
    const set = new Set(candidates);
    // Solo il più esterno di ogni gruppo: una card, non anche il suo testo.
    const blocks = candidates.filter((el) => {
      for (let p = el.parentElement; p; p = p.parentElement) if (set.has(p)) return false;
      return !inViewAtLoad(el);
    });
    gsap.set(blocks, { opacity: 0, y: 40 });
    const shown = new Set<Element>();
    const show = (batch: Element[]) => {
      const fresh = batch.filter((el) => !shown.has(el));
      fresh.forEach((el) => shown.add(el));
      if (!fresh.length) return;
      gsap.to(fresh, {
        opacity: 1,
        y: 0,
        duration: duration("editorial"),
        ease,
        stagger: { amount: Math.min(0.4, (fresh.length - 1) * 0.06) },
        overwrite: true,
      });
    };
    ScrollTrigger.batch(blocks, { start: START, once: true, onEnter: show });
    // Un blocco in attesa che riceve il focus compare subito (MV04).
    const onFocus = (e: FocusEvent) => {
      const block = blocks.find((b) => b.contains(e.target as Node));
      if (block && !shown.has(block)) {
        shown.add(block);
        gsap.set(block, { opacity: 1, y: 0 });
      }
    };
    document.addEventListener("focusin", onFocus);
    // Rete di sicurezza: arrivati in fondo compare tutto ciò che fosse rimasto.
    const atBottom = () => {
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) show(blocks);
    };
    window.addEventListener("scroll", atBottom, { passive: true });

    // --- Velo ----------------------------------------------------------------------------
    declared("veil")
      .filter((el) => !inViewAtLoad(el))
      .forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(20% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "none", clearProps: "clipPath", scrollTrigger: { trigger: el, start: "top 92%", end: "top 55%", scrub: 0.6 } },
        );
      });

    // --- Sipario: il riquadro si apre dal centro -------------------------------------------
    declared("curtain")
      .filter((el) => !inViewAtLoad(el))
      .forEach((el) => {
        // Una lettura per riquadro all'avvio, non a ogni frame.
        const radius = getComputedStyle(el).borderRadius || "0px";
        gsap.fromTo(
          el,
          { clipPath: `inset(12% 10% 12% 10% round ${radius})`, opacity: 0.2 },
          {
            clipPath: `inset(0% 0% 0% 0% round ${radius})`,
            opacity: 1,
            duration: duration("long"),
            ease,
            clearProps: "clipPath,opacity",
            scrollTrigger: { trigger: el, start: START, once: true },
          },
        );
      });

    // --- Foto che si allarga ai bordi (da md: sul telefono è già a tutto schermo) -----------
    if (window.matchMedia("(min-width: 48rem)").matches) {
      declared("expand").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 7% 0% 7% round 10px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 25%", scrub: 0.6 } },
        );
      });
    }

    // --- Filetti ---------------------------------------------------------------------------
    declared("line").forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: duration("long"), ease: easeFn("inout"), clearProps: "clipPath", scrollTrigger: { trigger: el, start: START, once: true } },
      );
    });

    // --- Disegni SVG -----------------------------------------------------------------------
    declared("draw")
      .filter((svg) => svg instanceof SVGSVGElement && !inViewAtLoad(svg))
      .forEach((svg) => {
        const strokes = [...svg.querySelectorAll<SVGGeometryElement>(":scope > line, :scope > path")];
        const rest = [...svg.querySelectorAll<SVGElement>(":scope > g, :scope > text")];
        const length = (el: SVGGeometryElement) => el.getTotalLength() + 4;
        strokes.forEach((el) => gsap.set(el, { strokeDasharray: length(el), strokeDashoffset: length(el) }));
        gsap.set(rest, { opacity: 0 });
        gsap
          .timeline({ scrollTrigger: { trigger: svg, start: START, once: true } })
          .to(strokes, { strokeDashoffset: 0, duration: duration("long"), ease: easeFn("inout"), stagger: 0.04 })
          .to(rest, { opacity: 1, duration: duration("slow"), stagger: 0.03 }, "-=0.4")
          .set(strokes, { clearProps: "strokeDasharray,strokeDashoffset" });
      });

    // --- Parallasse e zoom: solo dichiarati -------------------------------------------------
    declared("parallax").forEach((el) => {
      const a = amount(el, 0.12);
      gsap.fromTo(
        el,
        { yPercent: -a * 100, scale: 1 + a * 2 },
        { yPercent: a * 100, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
      );
    });
    declared("zoom").forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 1 + amount(el, 0.16) },
        { scale: 1, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "center 55%", scrub: true } },
      );
    });

    return () => {
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("scroll", atBottom);
    };
  });

  // Font, immagini e righe dei titoli cambiano l'altezza: si ricalcola quando cambia davvero.
  let frame = 0;
  let lastHeight = document.body.scrollHeight;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastHeight) < 2) return;
      lastHeight = h;
      ScrollTrigger.refresh();
    });
  });
  observer.observe(document.body);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    // Revert: stati iniziali tolti, contenuti nello stato finale.
    ctx.revert();
  };
}
