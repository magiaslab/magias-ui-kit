// Unico costruttore dei link al motore di prenotazione (H08).

/*
 * Ogni pulsante «Prenota», la barra date, la barra mobile e le schede camera passano da
 * qui. Il motore cambia da struttura a struttura: si scrive un adattatore che traduce la
 * ricerca nei parametri del motore, e nient'altro nel sito costruisce URL a mano.
 *
 * Date, ospiti e lingua passano sempre quando ci sono; l'attribuzione (es. UTM o un
 * parametro del fornitore) è aggiunta qui, una volta sola. Se il motore ignora date o
 * ospiti nell'URL, l'adattatore lo dichiara (supports) e il sito non promette una
 * ricerca già fatta.
 */

export type Stay = {
  /** AAAA-MM-GG */
  arrival?: string;
  /** AAAA-MM-GG */
  departure?: string;
  rooms?: { adults: number; childrenAges: number[] }[];
  /** Codice della tipologia, se il motore lo accetta. */
  room?: string;
};

export type BookingContext = {
  locale: string;
  /** Da dove parte il clic, per l'attribuzione (es. "home", "camera-suite", "barra-mobile"). */
  source: string;
};

export type EngineAdapter = {
  /** Cosa il motore accetta davvero, verificato a mano sul motore. */
  supports: { dates: boolean; guests: boolean; locale: boolean; room: boolean };
  url: (stay: Stay, context: BookingContext) => string;
};

/** Attributi del link: nuova scheda con noopener ma senza noreferrer, che romperebbe l'attribuzione. */
export const bookingLinkProps = { target: "_blank", rel: "noopener" } as const;

export function createBookingLinks(adapter: EngineAdapter) {
  return {
    supports: adapter.supports,
    url: (stay: Stay, context: BookingContext) => adapter.url(stay, context),
  };
}

/**
 * Adattatore per motori che leggono la ricerca dalla query string. I nomi dei parametri
 * si prendono dalla documentazione del fornitore e si verificano con una prenotazione di prova.
 */
export function queryStringAdapter(options: {
  base: string;
  params: {
    arrival?: string;
    departure?: string;
    adults?: string;
    children?: string;
    childrenAges?: string;
    locale?: string;
    room?: string;
  };
  /** Parametri fissi di attribuzione, costruiti dal contesto. */
  attribution?: (context: BookingContext) => Record<string, string>;
  locales?: string[];
}): EngineAdapter {
  const { base, params, attribution, locales } = options;
  return {
    supports: { dates: !!params.arrival, guests: !!params.adults, locale: !!params.locale, room: !!params.room },
    url: (stay, context) => {
      const q = new URLSearchParams();
      if (params.arrival && params.departure && stay.arrival && stay.departure) {
        q.set(params.arrival, stay.arrival);
        q.set(params.departure, stay.departure);
      }
      if (stay.rooms?.length && params.adults) {
        q.set(params.adults, String(stay.rooms.reduce((n, r) => n + r.adults, 0)));
        const ages = stay.rooms.flatMap((r) => r.childrenAges);
        if (params.children) q.set(params.children, String(ages.length));
        if (params.childrenAges && ages.length) q.set(params.childrenAges, ages.join(","));
      }
      if (params.locale && (!locales || locales.includes(context.locale))) q.set(params.locale, context.locale);
      if (params.room && stay.room) q.set(params.room, stay.room);
      for (const [k, v] of Object.entries(attribution?.(context) ?? {})) q.set(k, v);
      const s = q.toString();
      return s ? `${base}${base.includes("?") ? "&" : "?"}${s}` : base;
    },
  };
}

/** Attribuzione con UTM: la pagina di partenza va in utm_content. */
export const utmAttribution = (context: BookingContext) => ({
  utm_source: "sito",
  utm_medium: "referral",
  utm_campaign: "diretto",
  utm_content: context.source,
});
