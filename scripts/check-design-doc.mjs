#!/usr/bin/env node
// Controlla che il documento del design system citi solo cose che esistono nel codice (G04, ML02).
//
// Uso: node check-design-doc.mjs [docs/DESIGN-SYSTEM.md] [cartelle di codice…]
// Nel documento si citano componenti come `NomeComponente`, token come `--color-surface`,
// attributi come `data-m="reveal"` o `data-lenis-prevent` e file come
// `components/ui/button.tsx`. Ogni nome deve comparire nel codice, ogni file deve esistere.
// Le righe che contengono «da fare» o «non ancora fatto» descrivono cose previste e si saltano.
// Esce con 1 se qualcosa manca: si può mettere in CI.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const [doc = "docs/DESIGN-SYSTEM.md", ...dirs] = process.argv.slice(2);
const roots = dirs.length ? dirs : ["app", "components", "lib", "styles"];
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"]);

function* files(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (EXT.has(extname(p))) yield p;
  }
}

const code = roots.flatMap((r) => [...files(r)].map((f) => readFileSync(f, "utf8"))).join("\n");
const text = readFileSync(doc, "utf8")
  .split("\n")
  .filter((line) => !/da fare|non ancora fatto/i.test(line))
  .join("\n");
const cited = new Set();
for (const [, c] of text.matchAll(/`([A-Z][A-Za-z0-9]+)`/g)) cited.add(c);
for (const [, t] of text.matchAll(/`(--[a-z0-9-]+)`/g)) cited.add(t);
for (const [, e] of text.matchAll(/`data-m="([a-z-]+)"`/g)) cited.add(`data-m="${e}"`);
for (const [, a] of text.matchAll(/`(data-[a-z-]+)(?:=[^`]*)?`/g)) if (a !== "data-m") cited.add(a);
const paths = new Set([...text.matchAll(/`((?:app|components|lib|styles|content|scripts)\/[\w./[\]-]+\.(?:tsx?|css|mjs|json))`/g)].map((m) => m[1]));

const missing = [...cited].filter((name) => {
  if (name.startsWith("data-m=")) return !code.includes(name) && !code.includes(`"${name.slice(8, -1)}"`);
  return !code.includes(name);
});
for (const path of paths) if (!existsSync(path)) missing.push(path);
if (missing.length) {
  console.error(`${doc}: citati ma assenti dal codice:\n` + missing.map((m) => `  - ${m}`).join("\n"));
  process.exit(1);
}
console.log(`${doc}: ${cited.size} nomi e ${paths.size} file citati, tutti presenti nel codice.`);
