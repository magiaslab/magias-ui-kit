// Client: video d'apertura o d'atmosfera, con il poster come immagine principale.
"use client";

import { useEffect, useRef, useState } from "react";
import { saveData, useMotionAllowed } from "./preferences";
import { onTaskSuspension } from "./visible-loop";

/*
 * - Il poster è un'<img> vera, con priorità: è l'LCP e c'è anche senza JavaScript (PF02).
 * - Il <video> si monta solo dopo il caricamento, con movimento ammesso, senza risparmio
 *   dati e, se minWidth è indicato, solo da quella larghezza: sul telefono non si
 *   scarica un video coperto dal poster (PF03).
 * - preload="none"; si riproduce solo in vista e con la scheda visibile (MV05).
 * - Pulsante di pausa sempre presente mentre il video gira; la pausa manuale resta
 *   pausa anche quando finisce una sospensione del compito (MV06).
 */

type Props = {
  src: string;
  poster: string;
  /** Il video è decorativo: il poster porta l'alt se l'immagine dice qualcosa. */
  posterAlt?: string;
  /** Larghezza minima in px per caricare il video (es. 768). */
  minWidth?: number;
  className?: string;
  labels?: { pause: string; play: string };
};

export function AmbientVideo({ src, poster, posterAlt = "", minWidth, className, labels = { pause: "Metti in pausa il video", play: "Riprendi il video" } }: Props) {
  const motionOk = useMotionAllowed();
  const [mount, setMount] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!motionOk || saveData() || (minWidth && window.innerWidth < minWidth)) {
      setMount(false);
      return;
    }
    const go = () => setMount(true);
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, [motionOk, minWidth]);

  useEffect(() => {
    const el = video.current;
    if (!mount || !el) return;
    let visible = false;
    let task = false;
    const sync = () => {
      if (visible && !document.hidden && !task && !manualPause) void el.play().catch(() => {});
      else el.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    const unTask = onTaskSuspension((s) => {
      task = s;
      sync();
    });
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      unTask();
    };
  }, [mount, manualPause]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <img src={poster} alt={posterAlt} fetchPriority="high" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      {mount && (
        <>
          <video
            ref={video}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button type="button" data-m-pause aria-pressed={manualPause} onClick={() => setManualPause((p) => !p)} className="m-pause-button">
            {manualPause ? labels.play : labels.pause}
          </button>
        </>
      )}
    </div>
  );
}
