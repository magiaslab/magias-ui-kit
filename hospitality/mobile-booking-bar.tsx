// Barra prenota fissa in basso sotto lg (H07). Server component: non si anima.
import type { ReactNode } from "react";

/*
 * - Sempre visibile, non si anima (data-m-none) e non copre il campo attivo: lo spazio
 *   sotto la pagina è riservato da --size-bookingbar-h (tokens/globals.css, PF04).
 * - Rispetta l'area sicura dei telefoni con la tacca.
 * - Il banner del consenso sta sopra: --size-consent-h sposta la barra quando c'è.
 * - Contatti e Prenota nello stesso posto in tutte le pagine. I contatti si passano già
 *   verificati: un numero da confermare non si mostra (G03).
 */

type Props = {
  /** Azioni secondarie (Chiama, Scrivici), già filtrate dai dati da confermare. */
  contacts?: ReactNode;
  /** Il link al motore, costruito con lo stesso adattatore della barra date. */
  book: ReactNode;
  className?: string;
};

export function MobileBookingBar({ contacts, book, className }: Props) {
  return (
    <div data-m-none className={`m-mobile-booking-bar ${className ?? ""}`}>
      <div className="m-mobile-booking-bar-inner">
        {contacts}
        {book}
      </div>
    </div>
  );
}
