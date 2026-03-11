/**
 * Cursor type for feed pagination. Stable order: created_at desc, id desc.
 */
export interface FeedCursor {
  createdAt: string; // ISO
  id: string;
}

export interface FeedPageResult<T> {
  items: T[];
  nextCursor: FeedCursor | null;
}

/** Encode cursor to base64 JSON for client/server. */
export function encodeCursor(cursor: FeedCursor): string {
  const json = JSON.stringify({ createdAt: cursor.createdAt, id: cursor.id });
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf-8").toString("base64");
  }
  if (typeof btoa !== "undefined") return btoa(json);
  return "";
}

/** Decode cursor from string. Returns null if invalid. */
export function decodeCursor(str: string | null | undefined): FeedCursor | null {
  if (!str || typeof str !== "string") return null;
  try {
    const decoded =
      typeof Buffer !== "undefined"
        ? Buffer.from(str, "base64").toString("utf-8")
        : typeof atob !== "undefined"
          ? atob(str)
          : "";
    const parsed = JSON.parse(decoded) as { createdAt?: string; id?: string };
    if (typeof parsed?.createdAt === "string" && typeof parsed?.id === "string") {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    // ignore
  }
  return null;
}

/** Compute next cursor from last item in a page. */
export function getNextCursorFromItems<T extends { createdAt: string; id: string }>(
  items: T[]
): FeedCursor | null {
  if (!items.length) return null;
  const last = items[items.length - 1];
  if (!last?.createdAt || !last?.id) return null;
  return { createdAt: last.createdAt, id: last.id };
}
