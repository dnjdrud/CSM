"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "@/app/(app)/feed/actions";
import { useToast } from "@/components/ui/Toast";

type Props = {
  /** User id to follow/unfollow (e.g. post author). */
  followingId: string;
  /** Current follow state from server. */
  initialFollowing: boolean;
  /** Optional compact style for post card. */
  compact?: boolean;
  className?: string;
};

export function FollowButton({
  followingId,
  initialFollowing,
  compact = false,
  className = "",
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(initialFollowing);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    const ok = await toggleFollowAction(followingId);
    setPending(false);
    if (ok) {
      setLocalFollowing(!localFollowing);
      router.refresh();
      toast.show(localFollowing ? "Unfollowed." : "Following.");
    } else {
      toast.error();
    }
  }

  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-90 disabled:opacity-50";
  const size = compact ? "min-h-[36px] px-3 py-1.5 text-xs" : "min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm";
  const variant = localFollowing
    ? "border border-theme-border bg-transparent text-theme-text hover:bg-theme-surface-2"
    : "bg-gray-800 text-white hover:bg-gray-700 border border-transparent";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`${base} ${size} ${variant} ${className}`.trim()}
      aria-label={localFollowing ? "Unfollow" : "Follow"}
    >
      {pending ? "…" : localFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
