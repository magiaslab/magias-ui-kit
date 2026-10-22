// Client: barra date e ospiti che porta al motore di prenotazione.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { requestTaskSuspension } from "../motion/visible-loop";
import { bookingLinkProps, type BookingContext, type EngineAdapter } from "./booking-link";
import { DATE_LABELS, DateRangeField } from "./date-range-field";
import { GUEST_LABELS, GuestsField, type GuestLimits, type RoomGuests } from "./guests-field";

export const BAR_LABELS = {
  search: "Verifica disponibilità",
  newTab: "si apre in una nuova scheda, sul sito di prenotazione",
  missingDates: "Scegli arrivo e partenza per vedere la disponibilità.",
};

type Props = {
  engine: EngineAdapter;
  context: BookingContext;
  limits: GuestLimits;
  labels?: { bar: typeof BAR_LABELS; dates: typeof DATE_LABELS; guests: typeof GUEST_LABELS };
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;
  buttonClassName?: string;
};

/*
 * - Il pulsante non è mai disabled. Senza date riapre il calendario e lo annuncia (H13).
 * - Mentre la persona usa la barra, slideshow, video e scene della pagina si sospendono
 *   (MV06); una pausa manuale resta pausa quando la sospensione finisce.
 * - Il link è un <a> vero costruito da un solo adattatore: date, ospiti, lingua e
 *   attribuzione passano tutti (H08). La nuova scheda è annunciata.
 */
export function BookingBar({ engine, context, limits, labels = { bar: BAR_LABELS, dates: DATE_LABELS, guests: GUEST_LABELS }, className, fieldClassName, labelClassName, buttonClassName }: Props) {
  const id = useId();
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [rooms, setRooms] = useState<RoomGuests[]>([{ adults: 2, childrenAges: [] }]);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [months, setMonths] = useState<1 | 2>(1);
  const [active, setActive] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 48rem)");
    const sync = () => setMonths(mq.matches ? 2 : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Sospensione finché il calendario è aperto o il focus è nella barra.
  const suspended = open || active;
  useEffect(() => {
    requestTaskSuspension(`booking-${id}`, suspended);
    return () => requestTaskSuspension(`booking-${id}`, false);
  }, [suspended, id]);

  const ready = Boolean(arrival && departure);
  const href = engine.url(engine.supports.dates && ready ? { arrival, departure, rooms } : { rooms }, context);

  return (
    <form
      className={className}
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        // I popover stanno in un portale fuori dal form: il focus lì conta come dentro.
        const next = e.relatedTarget as Element | null;
        if (!next || (!e.currentTarget.contains(next) && !next.closest?.("[data-radix-popper-content-wrapper]"))) setActive(false);
      }}
      onSubmit={(e) => e.preventDefault()}
    >
      <DateRangeField
        id={`${id}-dates`}
        locale={context.locale}
        arrival={arrival}
        departure={departure}
        onChange={(a, d) => {
          setArrival(a);
          setDeparture(d);
          if (a && d) setNotice("");
        }}
        open={open}
        onOpenChange={setOpen}
        triggerRef={trigger}
        describedBy={`${id}-notice`}
        months={months}
        labels={labels.dates}
        fieldClassName={fieldClassName}
        labelClassName={labelClassName}
      />
      <GuestsField id={`${id}-guests`} rooms={rooms} onChange={setRooms} limits={limits} labels={labels.guests} fieldClassName={fieldClassName} labelClassName={labelClassName} />
      <a
        href={href}
        {...bookingLinkProps}
        className={buttonClassName}
        onClick={(e) => {
          if (engine.supports.dates && !ready) {
            e.preventDefault();
            setNotice(labels.bar.missingDates);
            setOpen(true);
          }
        }}
      >
        {labels.bar.search}
        <span className="sr-only">, {labels.bar.newTab}</span>
      </a>
      <p id={`${id}-notice`} role="status" aria-live="polite" className="m-notice">
        {notice}
      </p>
    </form>
  );
}
