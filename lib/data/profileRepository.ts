/**
 * Profile data: user by id and posts by author.
 * Delegates to repository (Supabase or in-memory).
 */
import type { User } from "@/lib/domain/types";
import type { PostWithAuthor } from "@/lib/domain/types";
import { getUserById, listPostsByAuthorId } from "@/lib/data/repository";

export async function getProfileById(id: string): Promise<User | null> {
  return getUserById(id);
}

export async function getUserPosts(id: string): Promise<PostWithAuthor[]> {
  return listPostsByAuthorId(id);
}
