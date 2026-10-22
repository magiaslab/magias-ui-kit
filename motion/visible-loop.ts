// Ciclo che gira solo quando l'elemento è in vista e la scheda è visibile (MV05, MX08).
"use client";

/*
 * Per scene WebGL, canvas e loop disegnati a mano. Il requestAnimationFrame si ferma
 * davvero fuori schermo e con la scheda nascosta, invece di girare a vuoto. paused
 * permette alla persona di fermarlo (pausa manuale) e al compito di sospenderlo
 * (task_suspension) con due interruttori distinti, come chiede il contratto del movimento.
 */

export type VisibleLoop = {
  /** Un disegno singolo, per quando lo scroll cambia la scena ma il ciclo è fermo. */
  once: () => void;
  /** Pausa scelta dalla persona: resta finché non la toglie. */
  setManualPause: (paused: boolean) => void;
  /** Sospensione durante un compito (pannello date aperto, modulo): si toglie da sola. */
  setTaskSuspension: (suspended: boolean) => void;
  stop: () => void;
};

export function visibleLoop(el: Element, draw: (seconds: number) => void, rootMargin = "120px"): VisibleLoop {
  let visible = false;
  let manual = false;
  let task = false;
  let raf = 0;
  const t0 = performance.now();
  const running = () => visible && !document.hidden && !manual && !task;
  const frame = () => {
    raf = 0;
    if (!running()) return;
    draw((performance.now() - t0) / 1000);
    raf = requestAnimationFrame(frame);
  };
  const resume = () => {
    if (!raf && running()) raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      resume();
    },
    { rootMargin },
  );
  io.observe(el);
  document.addEventListener("visibilitychange", resume);
  return {
    once: () => draw((performance.now() - t0) / 1000),
    setManualPause: (p) => {
      manual = p;
      resume();
    },
    setTaskSuspension: (s) => {
      task = s;
      resume();
    },
    stop: () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", resume);
      if (raf) cancelAnimationFrame(raf);
    },
  };
}

/** Sospensione condivisa: un compito la chiede, slideshow, video e scene la ascoltano. */
const SUSPEND_EVENT = "magias:task-suspension";

export function requestTaskSuspension(source: string, active: boolean) {
  window.dispatchEvent(new CustomEvent(SUSPEND_EVENT, { detail: { source, active } }));
}

/** fn riceve true finché almeno un compito chiede la sospensione. */
export function onTaskSuspension(fn: (suspended: boolean) => void): () => void {
  const active = new Set<string>();
  const handler = (e: Event) => {
    const { source, active: on } = (e as CustomEvent<{ source: string; active: boolean }>).detail;
    if (on) active.add(source);
    else active.delete(source);
    fn(active.size > 0);
  };
  window.addEventListener(SUSPEND_EVENT, handler);
  return () => window.removeEventListener(SUSPEND_EVENT, handler);
}
