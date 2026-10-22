// Client: slideshow di foto con pausa manuale e sospensione durante i compiti.
"use client";

import { useEffect, useRef, useState } from "react";
import { saveData, useMotionAllowed } from "./preferences";
import { onTaskSuspension } from "./visible-loop";

/*
 * Contratto del movimento:
 * - manual_pause: il pulsante Pausa; resta finché la persona non sceglie Riprendi;
 * - task_suspension: un compito nella vista (barra date, modulo) lo ferma finché è attivo;
 * - reduced_preference: con riduci movimento non avanza da solo, le frecce restano;
 * - resume_policy: riparte solo quando nessun motivo di arresto è attivo.
 * Sul telefono non avanza da solo (H06). Fuori vista e a scheda nascosta si ferma (MV05).
 */

export const SLIDESHOW_LABELS = {
  region: "Foto",
  pause: "Pausa",
  play: "Riprendi",
  prev: "Foto precedente",
  next: "Foto successiva",
  position: (n: number, total: number) => `Foto ${n} di ${total}`,
};

type Slide = { src: string; alt: string };

type Props = {
  slides: Slide[];
  intervalMs?: number;
  /** Larghezza da cui l'avanzamento automatico è ammesso. */
  autoplayQuery?: string;
  labels?: typeof SLIDESHOW_LABELS;
  className?: string;
};

export function Slideshow({ slides, intervalMs = 6000, autoplayQuery = "(min-width: 48rem)", labels = SLIDESHOW_LABELS, className }: Props) {
  const motionOk = useMotionAllowed();
  const [index, setIndex] = useState(0);
  const [manualPause, setManualPause] = useState(false);
  const [task, setTask] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [wide, setWide] = useState(false);
  const [inView, setInView] = useState(true);
  const root = useRef<HTMLElement>(null);

  useEffect(() => onTaskSuspension(setTask), []);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const mq = window.matchMedia(autoplayQuery);
    const sync = () => setWide(mq.matches);
    const vis = () => setHidden(document.hidden);
    sync();
    mq.addEventListener("change", sync);
    document.addEventListener("visibilitychange", vis);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [autoplayQuery]);

  const autoplay = motionOk && wide && !saveData() && slides.length > 1;
  const running = autoplay && !manualPause && !task && !hidden && inView;
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => window.clearInterval(t);
  }, [running, intervalMs, slides.length]);

  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <section ref={root} aria-roledescription="carosello" aria-label={labels.region} className={className} style={{ position: "relative" }}>
      {slides.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          aria-hidden={i !== index}
          fetchPriority={i === 0 ? "high" : "low"}
          loading={i === 0 ? "eager" : "lazy"}
          className="m-slide"
          data-active={i === index || undefined}
        />
      ))}
      <div className="m-slideshow-controls">
        <button type="button" className="tap-min" onClick={() => go(-1)} aria-label={labels.prev}>
          ‹
        </button>
        <p aria-live={running ? "off" : "polite"}>{labels.position(index + 1, slides.length)}</p>
        <button type="button" className="tap-min" onClick={() => go(1)} aria-label={labels.next}>
          ›
        </button>
        {autoplay && (
          <button type="button" className="tap-min" aria-pressed={manualPause} onClick={() => setManualPause((p) => !p)}>
            {manualPause ? labels.play : labels.pause}
          </button>
        )}
      </div>
    </section>
  );
}
