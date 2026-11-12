// Verifies that no authored content (src/content/*.ts) ends up in the public
// client bundle (.next/static). Run after `npm run build`.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const contentDir = join(root, "src", "content");
const staticDir = join(root, ".next", "static");
if (!existsSync(staticDir)) {
  console.error("No .next/static found. Run `npm run build` first.");
  process.exit(2);
}

const probes = new Set();
for (const f of readdirSync(contentDir)) {
  if (!f.endsWith(".ts") || f === "types.ts") continue;
  const src = readFileSync(join(contentDir, f), "utf8");
  for (const m of src.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
    const s = m[1];
    // Only Korean sentences/titles of meaningful length (skip ids, imports).
    if (/[가-힣]/.test(s) && s.replace(/\s/g, "").length >= 6) probes.add(s.replaceAll("{parent}", ""));
  }
}
// Known sensitive figures from the requirements must never be in the client bundle.
["682,500,000", "682500000", "150,000,000", "540,000,000", "1,575,000"].forEach((p) => probes.add(p));
// Login codes are read from the environment (never hard-coded here). Numeric codes are
// matched as whole numbers only, so a code that happens to sit inside a longer number in
// minified library code is not reported as a leak.
const secretProbes = [];
for (const k of ["FATHER_PASSWORD", "MOTHER_PASSWORD", "ADMIN_PASSWORD"]) {
  const v = process.env[k]?.trim();
  if (v) secretProbes.push(v);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|css|json|txt|html|map)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(staticDir);
const blobs = files.map((f) => {
  const raw = readFileSync(f, "utf8");
  // Also decode \uXXXX escapes that minifiers may emit for non-ASCII text.
  const decoded = raw.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return { f, text: raw + "\n" + decoded };
});

const leaks = [];
for (const p of probes) {
  for (const { f, text } of blobs) {
    if (text.includes(p)) leaks.push({ probe: p.slice(0, 40), file: f.replace(root, ".") });
  }
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
for (const [i, p] of secretProbes.entries()) {
  const re = new RegExp(`(?<![0-9A-Za-z])${escapeRe(p)}(?![0-9A-Za-z])`);
  for (const { f, text } of blobs) {
    if (re.test(text)) leaks.push({ probe: `(login secret #${i + 1})`, file: f.replace(root, ".") });
  }
}

console.log(`Checked ${probes.size} content strings against ${files.length} client asset files.`);
if (leaks.length) {
  console.error("LEAK: content found in client bundle:");
  for (const l of leaks) console.error(`  "${l.probe}" in ${l.file}`);
  process.exit(1);
}
console.log("OK: no content strings found in the client bundle.");
