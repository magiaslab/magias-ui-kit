# Problemi corretti nel kit

Il kit nasce dal codice di alcuni siti recenti costruiti con lo stesso design system. In quei siti sono emersi tredici problemi ricorrenti. Qui c'è dove il kit li corregge e quale regola del protocollo ([Magias UI Protocol](https://github.com/magiaslab/magias-ui-protocol) v0.3) li copre.

| # | Problema | Dove si corregge | Regola |
|---|---|---|---|
| 1 | Blocchi in attesa del reveal nascosti con `visibility:hidden`: niente focus, niente ricerca nella pagina | `motion/scroll-motion.tsx`: solo `opacity`, e un blocco che riceve il focus compare subito | MV04 |
| 2 | Scroll fluido che legge «riduci movimento» solo all'avvio | `motion/preferences.ts` (`whileMotionAllowed`), usato da tutti i componenti | MV01 |
| 3 | Durate ed easing scritti nel codice JavaScript | `motion/tokens.ts`: li legge da `--duration-*` e `--ease-*` | ML01 |
| 4 | Titolo spezzato per parola letto a pezzi dai lettori di schermo | `motion/scroll-motion.tsx`: SplitText con `aria: "auto"`; mai sull'h1 d'apertura | MV03 |
| 5 | Testo d'apertura nascosto fino a quasi 2 secondi | `tokens/motion.css`: apertura solo CSS, testo sempre visibile | MV03, PF02 |
| 6 | Striscia bloccata: il Tab porta fuori schermo, non si salta | `motion/horizontal-strip.tsx`: focus portato in vista, link per saltare, versione nativa | MV07 |
| 7 | Più effetti sommati sulla stessa foto | Un solo attributo `data-m` per elemento | MV08 |
| 8 | Loop continui senza pausa | `motion/visible-loop.ts`: pausa manuale e sospensione distinte, stop fuori vista | MV05 |
| 9 | Video precaricato e in riproduzione fuori schermo | `motion/ambient-video.tsx`: poster come LCP, `preload="none"`, play solo in vista, pausa | PF03, MV05 |
| 10 | Zoom automatico che legge il layout di ogni immagine | Zoom e parallax solo dichiarati, nessuna lettura per immagine | PF05 |
| 11 | Attributi del movimento in conflitto con quelli del tracciamento | Prefisso unico `data-m-*` | ML02 |
| 12 | Documento del design system che cita componenti inesistenti | `scripts/check-design-doc.mjs`, da mettere in CI | G04 |
| 13 | Contatori degli ospiti `disabled` al limite: il focus si perde | `hospitality/guests-field.tsx`: `aria-disabled` e annuncio del limite | H13 |
