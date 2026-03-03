/**
 * localStorage-backed PersistenceAdapter. Versioned keys; safe JSON parse.
 * On server (no window), load() returns null and save/clear no-op.
 */
import type { PersistenceAdapter } from "./persistence";

const PREFIX = "csm:v1:";

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // quota exceeded or disabled
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Create an adapter for a versioned key (e.g. "users" → "csm:v1:users").
 * load() returns null on parse error or missing data.
 */
export function createLocalAdapter<T>(key: string): PersistenceAdapter<T> {
  const storageKey = PREFIX + key;

  return {
    load(): T | null {
      const raw = safeGetItem(storageKey);
      if (raw == null) return null;
      try {
        const parsed = JSON.parse(raw) as unknown;
        return parsed as T;
      } catch {
        return null;
      }
    },

    save(data: T): void {
      try {
        safeSetItem(storageKey, JSON.stringify(data));
      } catch {
        // ignore
      }
    },

    clear(): void {
      safeRemoveItem(storageKey);
    },
  };
}
