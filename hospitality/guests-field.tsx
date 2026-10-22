// Client: camere e ospiti con contatori in un popover, senza select di sistema (G02).
"use client";

import { useId, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type RoomGuests = { adults: number; childrenAges: number[] };
export type GuestLimits = { rooms: number; adults: number; children: number; childAge: number };

export const GUEST_LABELS = {
  guests: "Ospiti",
  rooms: "Camere",
  room: (n: number) => `Camera ${n}`,
  adults: "Adulti",
  children: "Bambini",
  childrenHint: (maxAge: number) => `Fino a ${maxAge} anni`,
  childAge: (n: number) => `Età del bambino ${n}`,
  years: (n: number) => (n === 1 ? "1 anno" : `${n} anni`),
  summary: (rooms: number, adults: number, children: number) =>
    [rooms === 1 ? "1 camera" : `${rooms} camere`, adults === 1 ? "1 adulto" : `${adults} adulti`, children ? (children === 1 ? "1 bambino" : `${children} bambini`) : ""]
      .filter(Boolean)
      .join(" · "),
  decrease: (label: string) => `Togli: ${label}`,
  increase: (label: string) => `Aggiungi: ${label}`,
  atMin: (label: string, min: number) => `${label}: il minimo è ${min}`,
  atMax: (label: string, max: number) => `${label}: il massimo è ${max}`,
};

type Props = {
  id: string;
  rooms: RoomGuests[];
  onChange: (rooms: RoomGuests[]) => void;
  limits: GuestLimits;
  defaultChildAge?: number;
  labels?: typeof GUEST_LABELS;
  fieldClassName?: string;
  labelClassName?: string;
};

/*
 * Ogni camera ha adulti e bambini con l'età di ciascuno: molti motori la chiedono per il
 * prezzo. Al limite i pulsanti non diventano disabled: restano raggiungibili, sono
 * aria-disabled e annunciano il limite. Così il focus non si perde e chi usa un lettore
 * di schermo sa perché non succede niente (H13).
 */
export function GuestsField({ id, rooms, onChange, limits, defaultChildAge = 6, labels = GUEST_LABELS, fieldClassName, labelClassName }: Props) {
  const adults = rooms.reduce((n, r) => n + r.adults, 0);
  const children = rooms.reduce((n, r) => n + r.childrenAges.length, 0);
  const update = (index: number, next: RoomGuests) => onChange(rooms.map((r, i) => (i === index ? next : r)));
  const setRooms = (count: number) =>
    onChange(count > rooms.length ? [...rooms, ...Array.from({ length: count - rooms.length }, () => ({ adults: 2, childrenAges: [] }))] : rooms.slice(0, count));

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className={labelClassName}>
        {labels.guests}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" id={id} aria-labelledby={`${id}-label ${id}`} className={fieldClassName}>
            {labels.summary(rooms.length, adults, children)}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={{ top: 16, right: 16, bottom: 88, left: 16 }} data-lenis-prevent>
          <Stepper label={labels.rooms} value={rooms.length} min={1} max={limits.rooms} onChange={setRooms} labels={labels} />
          {rooms.map((room, i) => (
            <div key={i} role="group" aria-labelledby={`${id}-room-${i}`}>
              <p id={`${id}-room-${i}`}>{labels.room(i + 1)}</p>
              <Stepper label={labels.adults} value={room.adults} min={1} max={limits.adults} onChange={(n) => update(i, { ...room, adults: n })} labels={labels} />
              <Stepper
                label={labels.children}
                hint={labels.childrenHint(limits.childAge)}
                value={room.childrenAges.length}
                min={0}
                max={limits.children}
                labels={labels}
                onChange={(n) => update(i, { ...room, childrenAges: n > room.childrenAges.length ? [...room.childrenAges, defaultChildAge] : room.childrenAges.slice(0, n) })}
              />
              {room.childrenAges.map((age, c) => (
                <Stepper
                  key={c}
                  label={labels.childAge(c + 1)}
                  value={age}
                  min={0}
                  max={limits.childAge}
                  format={labels.years}
                  labels={labels}
                  onChange={(v) => update(i, { ...room, childrenAges: room.childrenAges.map((a, k) => (k === c ? v : a)) })}
                />
              ))}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

type StepperProps = {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  labels: typeof GUEST_LABELS;
};

function Stepper({ label, hint, value, min, max, onChange, format = String, labels }: StepperProps) {
  const id = useId();
  const [notice, setNotice] = useState("");
  const step = (delta: -1 | 1) => {
    const next = value + delta;
    if (next < min) return setNotice(labels.atMin(label, min));
    if (next > max) return setNotice(labels.atMax(label, max));
    setNotice("");
    onChange(next);
  };
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="m-stepper">
      <div>
        <p id={`${id}-label`}>{label}</p>
        {hint && <p className="m-hint">{hint}</p>}
      </div>
      <div className="m-stepper-controls">
        <button type="button" className="tap-min" aria-disabled={value <= min} aria-label={labels.decrease(label)} onClick={() => step(-1)}>
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <output aria-live="polite">{format(value)}</output>
        <button type="button" className="tap-min" aria-disabled={value >= max} aria-label={labels.increase(label)} onClick={() => step(1)}>
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
      </div>
      <p role="status" className="m-notice">{notice}</p>
    </div>
  );
}
