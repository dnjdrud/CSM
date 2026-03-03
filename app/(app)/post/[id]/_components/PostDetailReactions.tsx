"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleReactionAction } from "@/app/(app)/feed/actions";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { ReactionType } from "@/lib/domain/types";

type Props = {
  post: PostWithAuthor;
  currentUserId: string | null;
};

export function PostDetailReactions({ post, currentUserId }: Props) {
  const router = useRouter();
  const countsFromPost = post.reactionCounts ?? { prayed: 0, withYou: 0 };
  const [responses, setResponses] = useState(post.reactionsByCurrentUser);
  const [counts, setCounts] = useState(countsFromPost);

  async function handleToggle(type: ReactionType) {
    if (!currentUserId) return;
    const isPrayed = type === "PRAYED";
    const turningOn = isPrayed ? !responses.prayed : !responses.withYou;
    const prevResponses = responses;
    const prevCounts = counts;
    setResponses((prev) =>
      isPrayed ? { ...prev, prayed: !prev.prayed } : { ...prev, withYou: !prev.withYou }
    );
    setCounts((prev) =>
      isPrayed
        ? { ...prev, prayed: turningOn ? prev.prayed + 1 : Math.max(0, prev.prayed - 1) }
        : { ...prev, withYou: turningOn ? prev.withYou + 1 : Math.max(0, prev.withYou - 1) }
    );
    try {
      const result = await toggleReactionAction(post.id, type);
      if (result && result.ok === false) {
        setResponses(prevResponses);
        setCounts(prevCounts);
      } else {
        router.refresh();
      }
    } catch {
      setResponses(prevResponses);
      setCounts(prevCounts);
    }
  }

  if (!currentUserId) return null;

  return (
    <div
      className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-4 text-[12px] text-neutral-400"
      role="group"
      aria-label="Respond to this post"
    >
      <button
        type="button"
        onClick={() => handleToggle("PRAYED")}
        className={`flex items-center gap-1.5 rounded px-2 py-2 -ml-2 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 ${responses.prayed ? "font-medium text-gray-900" : ""}`}
      >
        <span aria-hidden>🙏</span>
        Prayed
        {counts.prayed > 0 && (
          <span className="tabular-nums text-neutral-500" aria-label={`${counts.prayed} prayed`}>
            {counts.prayed}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => handleToggle("WITH_YOU")}
        className={`flex items-center gap-1.5 rounded px-2 py-2 -ml-2 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 ${responses.withYou ? "font-medium text-gray-900" : ""}`}
      >
        <span aria-hidden>🤍</span>
        With you
        {counts.withYou > 0 && (
          <span className="tabular-nums text-neutral-500" aria-label={`${counts.withYou} with you`}>
            {counts.withYou}
          </span>
        )}
      </button>
    </div>
  );
}
