/*
 * Dati da confermare (G03). Nei contenuti un dato mancante si scrive
 * «[DA CONFERMARE: dettaglio]». In pagina non compare mai il testo grezzo: il componente
 * del progetto lo rende come «da confermare» con un numero che rimanda all'elenco dei
 * dati mancanti in fondo alla pagina.
 *
 * Interruttore: SHOW_TO_CONFIRM. Spento (NEXT_PUBLIC_SHOW_TO_CONFIRM=false) i segni e
 * l'elenco spariscono, e un testo fatto solo di dati mancanti non si mostra.
 *
 * Fuori dalla pagina (JSON-LD, llms.txt, meta description) un testo con un dato
 * mancante non esce mai: usare safeForStructuredData().
 */
export const SHOW_TO_CONFIRM = process.env.NEXT_PUBLIC_SHOW_TO_CONFIRM !== "false";

const MARKER = /\s*\[DA CONFERMARE(?::\s*([^\]]*))?\]/g;

export type TbcPart = { kind: "text"; value: string } | { kind: "tbc"; detail: string };

/** Spezza un testo in parti normali e dati da confermare. */
export function splitToConfirm(text: string, fallbackDetail = "dato da confermare"): TbcPart[] {
  const parts: TbcPart[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKER)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: "text", value: text.slice(last, start) });
    parts.push({ kind: "tbc", detail: (match[1] ?? "").trim() || fallbackDetail });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

export function hasToConfirm(text: string): boolean {
  return text.includes("[DA CONFERMARE");
}

/** true se il testo, tolti i dati da confermare, non dice niente. */
export function onlyToConfirm(text: string): boolean {
  return splitToConfirm(text).every((p) => p.kind === "tbc" || !/[\p{L}\p{N}]/u.test(p.value));
}

/** Il testo senza i segni, per quando l'interruttore è spento. */
export function withoutToConfirm(text: string): string {
  return text
    .replace(MARKER, "")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Ogni stringa contenuta in un valore (oggetti e array, in profondità, nell'ordine). */
export function deepStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => deepStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => deepStrings(v, out));
  return out;
}

/** Il valore se nessuna sua stringa contiene un dato da confermare, altrimenti undefined. */
export function safeForStructuredData<T>(value: T): T | undefined {
  return deepStrings(value).some(hasToConfirm) ? undefined : value;
}

/**
 * Numeri delle note della pagina: ogni dettaglio diverso ha un numero, nell'ordine in
 * cui compare. Si costruisce dagli stessi dati della pagina, così i numeri nei testi e
 * quelli dell'elenco coincidono.
 */
export class ToConfirmNotes {
  private notes = new Map<string, number>();

  constructor(sources: unknown[] = []) {
    for (const text of deepStrings(sources)) {
      for (const part of splitToConfirm(text)) {
        if (part.kind === "tbc" && !this.notes.has(part.detail)) this.notes.set(part.detail, this.notes.size + 1);
      }
    }
  }

  number(detail: string): number | undefined {
    return this.notes.get(detail);
  }

  get list(): { n: number; detail: string }[] {
    return [...this.notes].map(([detail, n]) => ({ n, detail }));
  }
}
