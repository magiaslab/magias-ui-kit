// Client: ospita una scena WebGL con il fallback come contenuto vero.
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { watchMedia, QUERY_MOTION_OK } from "../motion/preferences";
import { afterFirstGesture, sceneAllowed, whenNear } from "./gate";

/*
 * Il fallback (foto o SVG più il testo dei passi) è sempre nel DOM: è quello che leggono
 * lettori di schermo e motori di ricerca, e quello che si vede senza JavaScript, senza
 * WebGL, con risparmio dati o movimento ridotto. La scena si aggiunge sopra.
 *
 * La scena è un modulo caricato con import() solo quando serve. Deve esportare:
 *
 *   export function mount(canvas, options): SceneHandle
 *
 * e gestire da sé densità di pixel con tetto, cicli con visibleLoop e pulizia completa
 * (geometrie, materiali, texture, renderer) in destroy(). Vedi webgl/scene-skeleton.ts.
 */

export type SceneHandle = {
  /** Progresso 0–1, di solito dallo scroll della sezione. */
  progress?: (value: number) => void;
  resize: (width: number, height: number) => void;
  destroy: () => void;
};

export type SceneModule = { mount: (canvas: HTMLCanvasElement, options: { width: number; height: number }) => SceneHandle };

type Props = {
  load: () => Promise<SceneModule>;
  /** Contenuto equivalente alla scena: resta nel DOM anche quando la scena gira. */
  fallback: ReactNode;
  /** Quando la scena gira il fallback visivo si può nascondere, il testo no. */
  hideFallbackVisual?: boolean;
  /** Etichetta se la scena dice qualcosa; senza, il canvas è decorativo (aria-hidden). */
  label?: string;
  onReady?: (scene: SceneHandle) => void;
  className?: string;
};

export function SceneHost({ load, fallback, label, onReady, className }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    let scene: SceneHandle | null = null;
    let disposed = false;
    const offs: (() => void)[] = [];

    const stopScene = () => {
      scene?.destroy();
      scene = null;
      setRunning(false);
    };
    const startScene = () => {
      if (!sceneAllowed()) return;
      offs.push(
        whenNear(el, () =>
          offs.push(
            afterFirstGesture(async () => {
              const mod = await load();
              if (disposed || scene || !sceneAllowed()) return;
              const { width, height } = el.getBoundingClientRect();
              // Il renderer si crea solo con le misure reali della tela.
              if (width === 0 || height === 0) return;
              scene = mod.mount(cv, { width, height });
              setRunning(true);
              onReady?.(scene);
            }),
          ),
        ),
      );
    };
    startScene();

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) scene?.resize(width, height);
    });
    ro.observe(el);
    // Riduci movimento attivato a pagina aperta: la scena si chiude e resta il fallback.
    const unwatch = watchMedia(QUERY_MOTION_OK, (ok) => (ok ? startScene() : stopScene()));

    return () => {
      disposed = true;
      offs.forEach((off) => off());
      ro.disconnect();
      unwatch();
      stopScene();
    };
  }, [load, onReady]);

  return (
    <div ref={box} className={className} data-m-scene={running ? "running" : "fallback"} style={{ position: "relative" }}>
      <div className="m-scene-fallback">{fallback}</div>
      <canvas
        ref={canvas}
        {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: running ? 1 : 0, pointerEvents: "none" }}
      />
    </div>
  );
}
