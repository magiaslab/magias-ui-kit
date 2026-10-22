#!/usr/bin/env node
// Controlla che il documento del design system citi solo cose che esistono nel codice (G04, ML02).
//
// Uso: node check-design-doc.mjs [docs/DESIGN-SYSTEM.md] [cartelle di codice…]
// Nel documento si citano componenti come `NomeComponente`, token come `--color-surface`
// e effetti come `data-m="reveal"`. Ognuno deve comparire almeno una volta nel codice.
// Esce con 1 se qualcosa manca: si può mettere in CI.
import { readFileSync, readdirSync, statSync } from "node:fs";
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
const text = readFileSync(doc, "utf8");
const cited = new Set();
for (const [, c] of text.matchAll(/`([A-Z][A-Za-z0-9]+)`/g)) cited.add(c);
for (const [, t] of text.matchAll(/`(--[a-z0-9-]+)`/g)) cited.add(t);
for (const [, e] of text.matchAll(/`data-m="([a-z-]+)"`/g)) cited.add(`data-m="${e}"`);

const missing = [...cited].filter((name) => {
  if (name.startsWith("data-m=")) return !code.includes(name) && !code.includes(`"${name.slice(8, -1)}"`);
  return !code.includes(name);
});
if (missing.length) {
  console.error(`${doc}: citati ma assenti dal codice:\n` + missing.map((m) => `  - ${m}`).join("\n"));
  process.exit(1);
}
console.log(`${doc}: ${cited.size} nomi citati, tutti presenti nel codice.`);
