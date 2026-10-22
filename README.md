# Magias UI Kit

Componenti di riferimento per il [Magias UI Protocol](https://github.com/magiaslab/magias-ui-protocol) v0.3: movimento con GSAP e Lenis, scene three.js, token di partenza e componenti per strutture ricettive.

**0.1.0-alpha.1 · licenza MIT.** Il protocollo non richiede il kit: è un modo possibile di rispettarne le regole, già usato in produzione in forma meno ordinata. Non è un pacchetto npm. Si copiano i file che servono nel progetto e si adattano.

## Cosa c'è

| Cartella | Contenuto | Regole |
|---|---|---|
| `motion/` | `ScrollMotion` (effetti dichiarati con `data-m-*`), `SmoothScroll` (Lenis), `HorizontalStrip`, `Slideshow`, `AmbientVideo`, `visibleLoop`, preferenze e ponte dei token | MV01–MV08, ML01–ML03 |
| `webgl/` | `SceneHost` con fallback vero nel DOM, controlli prima di caricare, scheletro di scena three.js | ML04, MV05 |
| `tokens/` | `theme.css` a due livelli, ponte verso shadcn, `motion.css` | G01, PF04, MV03 |
| `hospitality/` | Costruttore unico dei link al motore, `BookingBar`, `DateRangeField`, `GuestsField`, `MobileBookingBar` | H04, H07, H08, H13, MV06 |
| `data/` | Dati da confermare, esclusi dai dati strutturati | G03 |
| `scripts/` | Controllo del documento del design system contro il codice | G04 |

I tredici problemi che il kit corregge rispetto al codice da cui nasce sono in [docs/PROBLEMI-CORRETTI.md](docs/PROBLEMI-CORRETTI.md).

## Requisiti

React 19 e Tailwind 4. Il movimento richiede `gsap` 3.15 o successivo, che include SplitText, e `lenis` 1.3. Le scene richiedono `three`. La barra date richiede i componenti shadcn `Popover` e `Calendar` del progetto in `@/components/ui/`. Le librerie si caricano con `import()` solo quando servono: con «riduci movimento» non si scaricano.

## Come si usa

1. Copia `tokens/` in `styles/` e sostituisci i valori dei primitivi. Importa `theme.css`, `globals.css` e `motion.css` dopo `tailwindcss`.
2. Nel layout monta `<ScrollMotion routeKey={pathname} />` e, per il livello 2 o 3, `<SmoothScroll routeKey={pathname} />`.
3. Nelle sezioni chiedi gli effetti con un attributo: `data-m="split"` su un h2, `data-m-scope` su un contenitore, `data-m-none` sulla prima schermata.
4. Per l'ospitalità scrivi un adattatore del motore con `queryStringAdapter` (o uno tuo) e passalo a `BookingBar` e a ogni link Prenota. Verifica a mano quali parametri il motore accetta davvero, e dichiaralo in `supports`.

I testi dei componenti sono in italiano e si sostituiscono con la prop `labels`.

## Verifiche

- `npm run check`: controllo dei tipi di tutti i file, con stub dei componenti shadcn.
- I componenti non sono ancora stati provati insieme in un sito. La validazione su un progetto reale, con tastiera, lettore di schermo, movimento ridotto cambiato a pagina aperta e misure delle prestazioni, è il prossimo passo e il suo esito andrà scritto qui.

## Licenza

MIT. Vedi [LICENSE](LICENSE).
