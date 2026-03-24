/**
 * Supabase-backed repository — re-export shim.
 *
 * All domain implementations have been split into dedicated modules.
 * This file exists solely so that existing callers using
 *   import { … } from "@/lib/data/supabaseRepository"
 * continue to work without changes.
 */

export * from "./postRepository";
export * from "./commentRepository";
export * from "./userRepository";
export * from "./followRepository";
export * from "./reactionRepository";
export * from "./notificationRepository";
export * from "./dmRepository";
export * from "./bookmarkRepository";
export * from "./searchRepository";
export * from "./aiRepository";
export * from "./cellsRepository";
export * from "./notesRepository";
export * from "./supportRepository";
export * from "./missionaryRepository";
export * from "./theologyRepository";
export * from "./statsRepository";
