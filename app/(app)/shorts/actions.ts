"use server";

import { listCommentsByPostId } from "@/lib/data/repository";
import type { Comment, User } from "@/lib/domain/types";

export async function getShortCommentsAction(
  postId: string,
): Promise<(Comment & { author: User })[]> {
  return listCommentsByPostId(postId);
}
