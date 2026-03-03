/**
 * Data source mode: Supabase when env is set, else in-memory (dev fallback).
 */
export const DATA_MODE: "supabase" | "memory" =
  typeof process !== "undefined" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? "supabase"
    : "memory";
