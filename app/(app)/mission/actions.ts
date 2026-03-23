"use server";

import { runFeedPageAction } from "@/backend/features/feed/feedPage";
import { hasAnyTag, MISSION_TAGS } from "@/backend/features/feed/feedFilters";
import { findCountryByCode } from "@/lib/mission/countries";
import type { PostWithAuthor } from "@/lib/domain/types";

/** Mission hub feed: posts tagged with mission + optional country tag. */
export async function loadMoreMissionHubAction(input: {
  cursorStr: string | null;
  countryCode?: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const country = input.countryCode ? findCountryByCode(input.countryCode) : undefined;
  const countryTags = country?.tags ?? null;

  return runFeedPageAction(input.cursorStr, {
    pageParams: {
      scope: "ALL",
      limit: 20,
      includeCategories: ["MISSION", "CONTENT", "PHOTO"],
    },
    withVisibilityFilter: true,
    postFilter: (post) => {
      const tags = post.tags ?? [];
      if (!hasAnyTag(tags, MISSION_TAGS) && post.category !== "MISSION") return false;
      if (countryTags && countryTags.length > 0) {
        return hasAnyTag(tags, countryTags);
      }
      return true;
    },
  });
}
