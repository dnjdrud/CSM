/**
 * Generic persistence abstraction. No domain types.
 * Swap implementations (e.g. localStorage → Supabase) without changing callers.
 */

export interface PersistenceAdapter<T> {
  load(): T | null;
  save(data: T): void;
  clear(): void;
}
