import "server-only";
import type { CardSection } from "@/content/types";
import { getDb } from "./db";

/**
 * Son's edits of letters and cards (ContentDraft).
 *  - draft_json: what the son is working on (never shown to parents)
 *  - published_json: what parents see; NULL = hidden (준비 중)
 * When an item has no row yet, the default text in src/content is used, and it is
 * shown to parents only if its status there is "approved".
 */

export type ContentJson = { body: string[] | null; sections: CardSection[] | null };

export type ContentRow = { draft: ContentJson; published: ContentJson | null; updatedAt: number; publishedAt: number | null };

export const CONTENT_LIMITS = { paragraphMax: 3000, paragraphsMax: 40, totalMax: 60_000 } as const;

function parse(json: string | null): ContentJson | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as ContentJson;
    return { body: Array.isArray(v.body) ? v.body : null, sections: Array.isArray(v.sections) ? v.sections : null };
  } catch {
    return null;
  }
}

export function getContentRow(key: string): ContentRow | null {
  const r = getDb().prepare("SELECT * FROM content_versions WHERE key = ?").get(key) as
    | { draft_json: string; published_json: string | null; updated_at: number; published_at: number | null }
    | undefined;
  if (!r) return null;
  return { draft: parse(r.draft_json) ?? { body: null, sections: null }, published: parse(r.published_json), updatedAt: r.updated_at, publishedAt: r.published_at };
}

export function saveDraft(key: string, c: ContentJson, now = Date.now()): void {
  getDb()
    .prepare(
      `INSERT INTO content_versions (key, draft_json, published_json, updated_at, published_at) VALUES (?, ?, NULL, ?, NULL)
       ON CONFLICT(key) DO UPDATE SET draft_json = excluded.draft_json, updated_at = excluded.updated_at`,
    )
    .run(key, JSON.stringify(c), now);
}

/** Publishes exactly this text (it also becomes the draft). */
export function publish(key: string, c: ContentJson, now = Date.now()): void {
  const json = JSON.stringify(c);
  getDb()
    .prepare(
      `INSERT INTO content_versions (key, draft_json, published_json, updated_at, published_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET draft_json = excluded.draft_json, published_json = excluded.published_json,
         updated_at = excluded.updated_at, published_at = excluded.published_at`,
    )
    .run(key, json, json, now, now);
}

/** Hides it from parents again (draft kept). */
export function unpublish(key: string, c: ContentJson, now = Date.now()): void {
  getDb()
    .prepare(
      `INSERT INTO content_versions (key, draft_json, published_json, updated_at, published_at) VALUES (?, ?, NULL, ?, NULL)
       ON CONFLICT(key) DO UPDATE SET published_json = NULL, published_at = NULL, updated_at = excluded.updated_at`,
    )
    .run(key, JSON.stringify(c), now);
}

/** Back to the default text in src/content. */
export function resetContent(key: string): void {
  getDb().prepare("DELETE FROM content_versions WHERE key = ?").run(key);
}

/** "first\n\nsecond" -> ["first", "second"]; empty -> null (= 준비 중). */
export function splitParagraphs(text: string): string[] | null {
  const parts = text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

export const joinParagraphs = (p: string[] | null) => (p ?? []).join("\n\n");

export function validateContent(c: ContentJson): boolean {
  const all = [...(c.body ?? []), ...(c.sections ?? []).flatMap((s) => s.paragraphs ?? [])];
  if (all.length > CONTENT_LIMITS.paragraphsMax) return false;
  if (all.some((p) => p.length > CONTENT_LIMITS.paragraphMax)) return false;
  return JSON.stringify(c).length <= CONTENT_LIMITS.totalMax;
}
