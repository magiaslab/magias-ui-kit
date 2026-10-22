// Preferenze che decidono se il movimento parte: riduci movimento, puntatore, risparmio dati.
"use client";

import { useSyncExternalStore } from "react";

/*
 * La preferenza si ascolta per tutta la vita della pagina, non solo all'avvio (MV01):
 * chi attiva «riduci movimento» con la pagina aperta deve vedere fermarsi scroll fluido,
 * loop e scene, senza ricaricare.
 */

export const QUERY_MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const QUERY_FINE_POINTER = "(pointer: fine)";

/** Chiama fn a ogni cambio della media query e restituisce la funzione per smettere. */
export function watchMedia(query: string, fn: (matches: boolean) => void): () => void {
  const mq = window.matchMedia(query);
  const onChange = () => fn(mq.matches);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Rete lenta o «risparmio dati»: niente video d'apertura né scene 3D. */
export function saveData(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ""));
}

function useMedia(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (notify) => watchMedia(query, notify),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/**
 * true se il movimento è ammesso. Sul server vale false: il primo disegno è sempre lo
 * stato fermo, e il movimento si aggiunge dopo l'idratazione.
 */
export function useMotionAllowed(): boolean {
  return useMedia(QUERY_MOTION_OK, false);
}

/** true con mouse o trackpad: lo scroll fluido ha senso solo lì. */
export function useFinePointer(): boolean {
  return useMedia(QUERY_FINE_POINTER, false);
}

/**
 * Avvia start quando il movimento è ammesso e lo ferma quando non lo è più, anche a
 * pagina aperta. start può essere asincrona (import dinamico) e restituire la pulizia.
 */
export function whileMotionAllowed(
  start: () => Promise<(() => void) | void> | (() => void) | void,
  query = QUERY_MOTION_OK,
): () => void {
  let stop: (() => void) | void;
  let generation = 0;
  const run = async (ok: boolean) => {
    const current = ++generation;
    stop?.();
    stop = undefined;
    if (!ok) return;
    const cleanup = await start();
    // Nel frattempo la preferenza è cambiata o il componente è stato smontato.
    if (current !== generation) cleanup?.();
    else stop = cleanup;
  };
  void run(window.matchMedia(query).matches);
  const unwatch = watchMedia(query, (ok) => void run(ok));
  return () => {
    generation++;
    unwatch();
    stop?.();
  };
}
