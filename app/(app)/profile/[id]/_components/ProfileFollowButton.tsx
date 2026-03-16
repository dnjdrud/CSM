"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "../actions";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";

export function ProfileFollowButton({
  profileId,
  following,
}: {
  profileId: string;
  following: boolean;
}) {
  const t = useT();
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
      toast.show(localFollowing ? t.profile.unfollow : t.profile.following);
    } else {
      toast.error();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-button px-4 py-2.5 text-sm font-medium transition-colors duration-[120ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:opacity-90 disabled:opacity-50 ${
        localFollowing
          ? "border border-theme-border bg-transparent text-theme-text hover:bg-theme-surface-2"
          : "bg-theme-primary text-white hover:bg-theme-primary-2"
      }`}
    >
      {pending ? "…" : localFollowing ? t.profile.unfollow : t.profile.follow}
    </button>
  );
}
