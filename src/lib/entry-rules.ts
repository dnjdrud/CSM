// Shared (client + server) rules for parents' own writing. No content, no secrets.

/**
 * Rooms where a parent can write: 1 (내 마음 적기), 3 (생각 적어두기),
 * 4-6 (걱정/응원/서운했던 일 등, after the gate), 7 (글로 대화하기, after the gate).
 */
export const WRITABLE_ROOMS = [1, 3, 4, 5, 6, 7] as const;
/**
 * Rooms whose writing exists only inside the room body (after the recording gate).
 * Creating a new entry there needs this visit's grant; rooms 1 and 3 (pre-gate) do not.
 * Editing/deleting one's own existing entry (/notes) never needs a grant.
 */
export const GATED_WRITE_ROOMS = [4, 5, 6, 7] as const;
export const needsGrantToCreate = (roomId: number) => (GATED_WRITE_ROOMS as readonly number[]).includes(roomId);

export const isWritableRoom = (id: unknown): id is number =>
  typeof id === "number" && (WRITABLE_ROOMS as readonly number[]).includes(id);

export const ENTRY_LIMITS = {
  titleMax: 40,
  bodyMax: 5000,
  /** base64 of AES-GCM(JSON payload); generous upper bound for bodyMax of Korean text. */
  ciphertextMax: 40_000,
  /** Entries per parent, to bound storage. */
  perOwnerMax: 300,
} as const;

/**
 * Title choices (optional) for rooms whose writing happens before any gate. Deliberately calm;
 * nothing invites insults. Rooms 4-7 send their choices with the gated room body instead
 * (src/content/rooms.ts), so those words never sit in the public client bundle.
 */
export const TITLE_OPTIONS: Record<number, string[]> = {
  1: ["지금 드는 마음", "서운했던 일", "답답한 마음", "아들에게 하고 싶은 말"],
  3: ["이런 모습을 보면 안심이 될 것 같아", "걱정되는 점", "아들에게 바라는 것"],
};

/** Plaintext payload that gets encrypted for 나만 간직하기 / 초안. */
export type SealedPayload = {
  v: 1;
  title: string;
  body: string;
  /** keep = 나만 간직하기로 저장, draft = 초안 (아직 정하지 않았거나 아들에게 전하기 전). */
  intent: "keep" | "draft";
};

export type EntryKind = "sealed" | "shared";

/** What the owner's browser receives about its own entries. */
export type OwnEntry =
  | { id: string; roomId: number; kind: "sealed"; iv: string; ciphertext: string; createdAt: number; updatedAt: number }
  | { id: string; roomId: number; kind: "shared"; title: string; body: string; sharedAt: number; createdAt: number; updatedAt: number };

export function normalizeText(s: string): string {
  // Unify newlines, drop control characters except newline/tab, trim edges.
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export function validatePlain(title: string, body: string): "ok" | "body_required" | "title_too_long" | "body_too_long" {
  const t = normalizeText(title);
  const b = normalizeText(body);
  if (!b) return "body_required";
  if ([...t].length > ENTRY_LIMITS.titleMax) return "title_too_long";
  if ([...b].length > ENTRY_LIMITS.bodyMax) return "body_too_long";
  return "ok";
}

const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
export function isBase64(s: unknown, maxLen: number): s is string {
  return typeof s === "string" && s.length > 0 && s.length <= maxLen && s.length % 4 === 0 && B64.test(s);
}

/** Display timestamps in Korea time. */
export function formatKoreanDate(ms: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}
