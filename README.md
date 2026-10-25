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

1. Copia `tokens/` in `styles/` e sostituisci i valori dei primitivi. Importa `theme.css`, `globals.css` e `motion.css` dopo `tailwindcss`. Su un sito che ha già i suoi token, porta almeno le classi `.m-*` di `motion.css` (link per saltare la striscia, slideshow, barra prenota): senza, il link «Salta» resta sempre visibile.
2. Nel layout monta `<ScrollMotion routeKey={pathname} />` e, per il livello 2 o 3, `<SmoothScroll routeKey={pathname} />`.
3. Nelle sezioni chiedi gli effetti con un attributo: `data-m="split"` su un h2, `data-m-scope` su un contenitore, `data-m-none` sulla prima schermata.
4. Per l'ospitalità scrivi un adattatore del motore con `queryStringAdapter` (o uno tuo) e passalo a `BookingBar` e a ogni link Prenota. Verifica a mano quali parametri il motore accetta davvero, e dichiaralo in `supports`.

I testi dei componenti sono in italiano e si sostituiscono con la prop `labels`.

## Verifiche

- `npm run check`: controllo dei tipi di tutti i file, con stub dei componenti shadcn.
- `node scripts/check-design-doc.mjs docs/DESIGN-SYSTEM.md app components lib styles`: documento del design system contro il codice.

### Validazione su un sito (22 ottobre 2026)

Motore del movimento e striscia orizzontale montati su una bozza di sito per un hotel (Next 16, livello di movimento 2), al posto del motore da cui il kit era nato. Build di produzione, Chrome headless, 13 prove su 13 superate:

- senza JavaScript non resta nulla nascosto;
- con riduci movimento all'avvio Lenis non parte e niente resta in attesa; attivato a pagina aperta, scroll fluido, effetti e video si spengono e tutto torna visibile;
- un blocco in attesa che riceve il focus compare;
- striscia bloccata a 1366 px: il Tab porta in vista ogni card, c'è il link per saltarla; a 390 px è nativa, senza Lenis e senza video;
- video dell'hero fermo fuori vista e mentre si usa il calendario, poi riparte; `preload="metadata"`;
- contatori degli ospiti al limite: niente `disabled`, focus conservato, limite annunciato;
- prima schermata: nessun ritardo oltre 300 ms, titolo intero per i lettori di schermo;
- LCP e CLS in laboratorio su telefono emulato (CPU 4×, 1,6 Mbit/s) sotto le soglie di PF01.

Restano da fare: VoiceOver e NVDA, un telefono vero, Lighthouse e dati di campo. La validazione ha portato a questi cambi nel kit: effetti `curtain` ed `expand`, titoli h2 automatici dentro `data-m-scope` (`autoSplit`), striscia con titolo e azione dentro la sezione e offset da selettore (una funzione non passa da un componente server), sospensione che tiene conto dei popover in un portale, controllo del documento esteso ad attributi e file.

### Seconda validazione (22 ottobre 2026)

Stesso motore su una bozza di sito per appartamenti vacanza (Next 16, tre lingue, video in apertura, piante in SVG), senza striscia orizzontale. 13 prove su 13: oltre a quelle sopra, un solo effetto per foto, maschere dei titoli allargate, niente in attesa in fondo alla pagina, `data-track` mai insieme a `data-m`. Il confronto con il motore che sostituiva ha mostrato tre cose che il kit aveva perso, ora rimesse: la maschera dei titoli allargata (le lettere con la gamba in giù restavano tagliate), i blocchi dell'ultima schermata che partono appena entrano, il CSS di Lenis. Nuova prop `extraBlocks` per far entrare altri blocchi, come i pulsanti del sito. Riprovato anche il primo sito: 14 su 14.

### Terza validazione (22 ottobre 2026)

Stesso motore e striscia orizzontale su una bozza di sito per un agriturismo (Next 16, tre lingue, slideshow con Ken Burns nell'apertura). 16 prove su 16: oltre a quelle sopra, slideshow fermo fuori vista, a scheda nascosta e mentre si scelgono le date, nessun avanzamento automatico sul telefono, nessuna animazione infinita, zoom dell'apertura breve e una volta sola. Nuova prop `offsetExcludeSelector` della striscia, per non contare una riga dell'header che scorre via. Se mancano le classi `.m-*` di `tokens/motion.css`, il link per saltare la striscia resta sempre visibile: va importato.

## Licenza

MIT. Vedi [LICENSE](LICENSE).
