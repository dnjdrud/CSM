"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "../actions";
import { useToast } from "@/components/ui/Toast";

export function ProfileFollowButton({
  profileId,
  following,
}: {
  profileId: string;
  following: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(following);
  const toast = useToast();

  async function handleClick() {
    if (pending) return;
    setPending(true);
    const ok = await toggleFollowAction(profileId);
    setPending(false);
    if (ok) {
      setLocalFollowing(!localFollowing);
      router.refresh();
      toast.show(localFollowing ? "Unfollowed." : "Following.");
    } else {
      toast.error();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-90 disabled:opacity-50 ${
        localFollowing
          ? "border border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50"
          : "bg-gray-800 text-gray-50 hover:bg-gray-700"
      }`}
    >
      {pending ? "…" : localFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
