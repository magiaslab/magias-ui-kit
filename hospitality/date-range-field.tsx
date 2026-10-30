// Client: calendario a intervallo (arrivo–partenza) in un popover, con il calendario di shadcn.
"use client";

import type { Ref } from "react";
import type { DateRange } from "react-day-picker";
import { de, enUS, fr, it, nl } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatShortDate, fromIsoDate, nights as countNights, startOfToday, toIsoDate } from "./dates";

// Lingua del calendario (mesi, giorni, inizio settimana): senza, react-day-picker è in inglese.
const DAY_PICKER_LOCALES = { it, en: enUS, de, fr, nl } as const;

/** Accetta anche «it-IT» o «en_GB»: conta la lingua. */
function dayPickerLocale(locale: string) {
  return DAY_PICKER_LOCALES[locale.slice(0, 2).toLowerCase() as keyof typeof DAY_PICKER_LOCALES] ?? enUS;
}

export const DATE_LABELS = {
  dates: "Date",
  arrival: "Arrivo",
  departure: "Partenza",
  nights: (n: number) => (n === 1 ? "1 notte" : `${n} notti`),
  pickArrival: "Scegli la data di arrivo",
  pickDeparture: "Ora scegli la data di partenza",
  close: "Chiudi",
};

type Props = {
  id: string;
  locale: string;
  arrival: string;
  departure: string;
  onChange: (arrival: string, departure: string) => void;
  /** Aperto e chiuso dal modulo: il pulsante di ricerca lo riapre quando mancano le date. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: Ref<HTMLButtonElement>;
  describedBy?: string;
  /** Mesi affiancati: 2 da tablet, 1 sul telefono. */
  months?: 1 | 2;
  /** Giorni non disponibili, se il sito li conosce (H04). */
  disabledDays?: Date[];
  labels?: typeof DATE_LABELS;
  fieldClassName?: string;
  labelClassName?: string;
};

/*
 * Date passate e partenza non successiva all'arrivo non si scelgono (minimo una notte).
 * Celle di almeno 44 px; sul telefono un mese a tutta larghezza. Il popover non finisce
 * sotto la barra prenota fissa (collisionPadding). Il calendario di shadcn è
 * react-day-picker: si usa da tastiera e annuncia i giorni.
 */
export function DateRangeField({
  id,
  locale,
  arrival,
  departure,
  onChange,
  open,
  onOpenChange,
  triggerRef,
  describedBy,
  months = 2,
  disabledDays = [],
  labels = DATE_LABELS,
  fieldClassName,
  labelClassName,
}: Props) {
  const from = fromIsoDate(arrival);
  const to = fromIsoDate(departure);
  const selected: DateRange | undefined = from ? { from, to } : undefined;
  const n = countNights(arrival, departure);
  const show = (d: Date | undefined, placeholder: string) => <span data-empty={!d || undefined}>{d ? formatShortDate(locale, d) : placeholder}</span>;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className={labelClassName}>
        {labels.dates}
      </span>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button ref={triggerRef} type="button" id={id} aria-labelledby={`${id}-label ${id}`} aria-describedby={describedBy} className={fieldClassName}>
            {show(from, labels.arrival)}
            <span aria-hidden="true">→</span>
            {show(to, labels.departure)}
            {n > 0 && <span>{labels.nights(n)}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={{ top: 16, right: 16, bottom: 88, left: 16 }} data-lenis-prevent>
          <Calendar
            mode="range"
            locale={dayPickerLocale(locale)}
            numberOfMonths={months}
            min={1}
            selected={selected}
            defaultMonth={from ?? startOfToday()}
            startMonth={startOfToday()}
            disabled={[{ before: startOfToday() }, ...disabledDays]}
            onSelect={(range) => {
              const a = range?.from ? toIsoDate(range.from) : "";
              const d = range?.to && range.from && range.to > range.from ? toIsoDate(range.to) : "";
              onChange(a, d);
              if (a && d) onOpenChange(false);
            }}
            className="[--cell-size:--spacing(11)]"
          />
          <div className="m-calendar-footer">
            <p aria-live="polite">{from && !to ? labels.pickDeparture : labels.pickArrival}</p>
            <button type="button" className="tap-min" onClick={() => onOpenChange(false)}>
              {labels.close}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
