// WCAG 2.x contrast check for the design tokens in src/app/globals.css.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const pairs = [
  ["body text on bg", "#FFF5E8", "#3B261F", 7],
  ["body text on surface", "#FFF5E8", "#4A3228", 7],
  ["body text on surface-2 (hover)", "#FFF5E8", "#5A3E32", 4.5],
  ["muted text on bg", "#ECD9C3", "#3B261F", 7],
  ["muted text on surface", "#ECD9C3", "#4A3228", 4.5],
  ["button text on button", "#2B1B15", "#F2D6AE", 7],
  ["button text on button hover", "#2B1B15", "#F8E3C4", 7],
  ["accent label (btn color) on surface", "#F2D6AE", "#4A3228", 4.5],
  ["error text on error bg", "#FFD0C2", "#5C2A22", 4.5],
  ["focus ring vs bg (non-text >= 3)", "#FFD27A", "#3B261F", 3],
  ["secondary button border vs bg (non-text >= 3)", "#C9A983", "#3B261F", 3],
];
let fail = 0;
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2)}:1 (min ${min}) ${name}`);
}
process.exit(fail ? 1 : 0);
