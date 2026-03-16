"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "@/app/(app)/feed/actions";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";

type Props = {
  followingId: string;
  initialFollowing: boolean;
  compact?: boolean;
  className?: string;
};

export function FollowButton({
  followingId,
  initialFollowing,
  compact = false,
  className = "",
}: Props) {
  const t = useT();
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
      toast.show(localFollowing ? t.profile.unfollow : t.profile.following);
    } else {
      toast.error();
    }
  }

  const base =
    "inline-flex items-center justify-center rounded-button font-medium transition-colors duration-[120ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:opacity-90 disabled:opacity-50";
  const size = compact ? "min-h-[44px] min-w-[44px] px-3 py-2 text-xs" : "min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm";
  const variant = localFollowing
    ? "border border-theme-border bg-transparent text-theme-text hover:bg-theme-surface-2"
    : "bg-theme-primary text-white hover:bg-theme-primary-2 border border-transparent";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`${base} ${size} ${variant} ${className}`.trim()}
      aria-label={localFollowing ? t.profile.unfollow : t.profile.follow}
    >
      {pending ? "…" : localFollowing ? t.profile.unfollow : t.profile.follow}
    </button>
  );
}
