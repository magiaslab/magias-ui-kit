// Date del soggiorno in AAAA-MM-GG, nel fuso locale (nessuna conversione in UTC).

export function toIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Notti fra arrivo e partenza; arrotondato per i cambi d'ora. */
export function nights(arrival?: string, departure?: string): number {
  const a = fromIsoDate(arrival);
  const d = fromIsoDate(departure);
  return a && d ? Math.max(0, Math.round((d.getTime() - a.getTime()) / 86_400_000)) : 0;
}

export function formatShortDate(locale: string, d: Date): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(d);
}
