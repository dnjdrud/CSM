/**
 * Simple search utilities. No backend; used by repository search functions.
 * Scoring: whole-word match +3, substring +1. Stable sort by score.
 */

/** Normalize query: trim, lowercase, collapse spaces. */
export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Split normalized query into non-empty tokens. */
export function tokenize(q: string): string[] {
  const normalized = normalizeQuery(q);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

const WORD_BOUNDARY = /\b/;

/** Score how well text matches tokens. +3 whole word, +1 substring. */
export function scoreMatch(text: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    const idx = lower.indexOf(token);
    if (idx === -1) continue;
    // Substring match
    score += 1;
    // Whole-word: check character before and after
    const before = idx === 0 ? "" : lower[idx - 1];
    const after = idx + token.length >= lower.length ? "" : lower[idx + token.length];
    const isWordChar = (c: string) => /[a-z0-9]/.test(c);
    if (!isWordChar(before) && !isWordChar(after)) score += 2; // +2 more for whole word → total +3
  }
  return score;
}

/** Stable sort: higher score first; same score keeps original order. */
export function sortByScore<T>(
  items: T[],
  getText: (item: T) => string,
  tokens: string[]
): T[] {
  if (tokens.length === 0) return items;
  const scored = items.map((item) => ({
    item,
    score: scoreMatch(getText(item), tokens),
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return 0; // stable: keep order
  });
  return scored.filter((s) => s.score > 0).map((s) => s.item);
}
