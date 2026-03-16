"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleReactionAction, getReactorsAction } from "@/app/(app)/feed/actions";
import { ReactorsModal } from "@/components/ReactorsModal";
import type { PostWithAuthor, User } from "@/lib/domain/types";
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
  const [reactorsModal, setReactorsModal] = useState<{ type: "PRAYED" | "WITH_YOU"; users: User[]; loading: boolean } | null>(null);

  async function openReactorsModal(type: "PRAYED" | "WITH_YOU") {
    setReactorsModal({ type, users: [], loading: true });
    const users = await getReactorsAction(post.id, type);
    setReactorsModal({ type, users, loading: false });
  }

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
    <>
    <div
      className="mt-6 pt-6 border-t border-theme-border flex flex-wrap items-center gap-4 text-[12px] text-theme-muted"
      role="group"
      aria-label="Respond to this post"
    >
      <button
        type="button"
        onClick={() => handleToggle("PRAYED")}
        className={`flex items-center gap-1.5 rounded px-2 py-2 -ml-2 transition-colors duration-200 hover:bg-theme-surface-2 hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 ${responses.prayed ? "font-medium text-theme-text" : ""}`}
      >
        <span aria-hidden>🙏</span>
        Prayed
        {counts.prayed > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openReactorsModal("PRAYED"); }}
            className="tabular-nums text-theme-muted underline-offset-2 hover:underline focus:outline-none"
            aria-label={`${counts.prayed}명이 기도했습니다. 클릭하여 목록 보기`}
          >
            {counts.prayed}
          </button>
        )}
      </button>
      <button
        type="button"
        onClick={() => handleToggle("WITH_YOU")}
        className={`flex items-center gap-1.5 rounded px-2 py-2 -ml-2 transition-colors duration-200 hover:bg-theme-surface-2 hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 ${responses.withYou ? "font-medium text-theme-text" : ""}`}
      >
        <span aria-hidden>🤍</span>
        With you
        {counts.withYou > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openReactorsModal("WITH_YOU"); }}
            className="tabular-nums text-theme-muted underline-offset-2 hover:underline focus:outline-none"
            aria-label={`${counts.withYou}명이 함께합니다. 클릭하여 목록 보기`}
          >
            {counts.withYou}
          </button>
        )}
      </button>
    </div>
    {reactorsModal && (
      <ReactorsModal
        type={reactorsModal.type}
        users={reactorsModal.users}
        loading={reactorsModal.loading}
        onClose={() => setReactorsModal(null)}
      />
    )}
    </>
  );
}
