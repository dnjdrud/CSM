"use server";

import { runFeedPageAction } from "@/backend/features/feed/feedPage";
import type { PostWithAuthor } from "@/lib/domain/types";

const COUNSEL_TAGS = ["고민상담", "신학", "질문", "상담"];

function hasCounselTag(tags: string[]): boolean {
  return COUNSEL_TAGS.some((ct) =>
    tags.some((t) => t.toLowerCase() === ct.toLowerCase())
  );
}

export async function loadMoreCounselAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  return runFeedPageAction(input.cursorStr, {
    pageParams: {
      scope: "ALL",
      limit: 40,
      includeCategories: ["CELL", "GENERAL", "DEVOTIONAL"],
    },
    withVisibilityFilter: true,
    postFilter: (post) => hasCounselTag(post.tags ?? []),
  });
}
