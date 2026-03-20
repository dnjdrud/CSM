"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";
import {
  toggleReactionAction,
  toggleBookmarkAction,
} from "@/app/(app)/feed/actions";
import {
  IconHands,
  IconHeart,
  IconMessageCircle,
  IconBookmark,
  IconVolumeX,
  IconVolume2,
} from "@/components/ui/Icon";
import { ShortsCommentsSheet } from "./ShortsCommentsSheet";

type Props = {
  post: PostWithAuthor;
  isActive: boolean;
  currentUserId: string | null;
};

export function ShortsCard({ post, isActive, currentUserId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = post.mediaUrls?.[0] ?? null;

  // Play state
  const [isPaused, setIsPaused] = useState(true);
  const [flashState, setFlashState] = useState<"play" | "pause" | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reactions (optimistic)
  const [reactions, setReactions] = useState(post.reactionsByCurrentUser);
  const [counts, setCounts] = useState(
    post.reactionCounts ?? { prayed: 0, withYou: 0 }
  );

  // Mute state — start muted (required for autoplay), user can unmute
  const [muted, setMuted] = useState(true);

  // Bookmark (optimistic, no initial server state)
  const [bookmarked, setBookmarked] = useState(false);

  // Comments sheet
  const [showComments, setShowComments] = useState(false);

  // Autoplay / pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setIsPaused(false)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPaused(true);
    }
  }, [isActive]);

  // React의 muted prop은 초기값만 반영하므로 DOM을 직접 제어
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  function showFlash(state: "play" | "pause") {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashState(state);
    flashTimerRef.current = setTimeout(() => setFlashState(null), 700);
  }

  const handleVideoTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPaused(false)).catch(() => {});
      showFlash("play");
    } else {
      video.pause();
      setIsPaused(true);
      showFlash("pause");
    }
  }, []);

  async function handleReaction(type: "PRAYED" | "WITH_YOU") {
    if (!currentUserId) return;
    const isPrayed = type === "PRAYED";
    const wasOn = isPrayed ? reactions.prayed : reactions.withYou;
    setReactions((prev) =>
      isPrayed ? { ...prev, prayed: !prev.prayed } : { ...prev, withYou: !prev.withYou }
    );
    setCounts((prev) =>
      isPrayed
        ? { ...prev, prayed: wasOn ? Math.max(0, prev.prayed - 1) : prev.prayed + 1 }
        : { ...prev, withYou: wasOn ? Math.max(0, prev.withYou - 1) : prev.withYou + 1 }
    );
    await toggleReactionAction(post.id, type);
  }

  async function handleBookmark() {
    if (!currentUserId) return;
    setBookmarked((prev) => !prev);
    const result = await toggleBookmarkAction(post.id);
    if (result.ok) setBookmarked(result.bookmarked);
    else setBookmarked((prev) => !prev);
  }

  if (!videoUrl) return null;

  const displayTags = (post.tags ?? [])
    .filter((t) => t !== "shorts")
    .slice(0, 3);

  return (
    <>
      <div
        className="relative w-full shrink-0 bg-black select-none"
        style={{ height: "100dvh", scrollSnapAlign: "start" }}
        onClick={handleVideoTap}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          muted
          playsInline
          preload={isActive ? "auto" : "metadata"}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Mute toggle — top right */}
        <button
          type="button"
          aria-label={muted ? "소리 켜기" : "소리 끄기"}
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          className="absolute top-4 right-4 z-10 rounded-full bg-black/40 p-2 text-white transition-opacity hover:opacity-80"
        >
          {muted ? (
            <IconVolumeX className="w-5 h-5" />
          ) : (
            <IconVolume2 className="w-5 h-5" />
          )}
        </button>

        {/* Tap flash overlay */}
        {flashState && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-black/40 p-4 animate-ping-once">
              {flashState === "pause" ? (
                <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Persistent pause indicator when video is paused by user */}
        {isPaused && !flashState && isActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="rounded-full bg-black/30 p-3">
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 opacity-70">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        )}

        {/* Bottom-left info overlay */}
        <div
          className="absolute bottom-0 left-0 right-20 px-4 pb-24 pt-20 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
          }}
        >
          <a
            href={`/profile/${post.author.id}`}
            className="inline-block text-white text-[14px] font-semibold leading-snug drop-shadow mb-1 pointer-events-auto hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            {post.author.name}
          </a>
          {post.content && (
            <p className="text-white/85 text-[13px] leading-snug line-clamp-2 drop-shadow">
              {post.content}
            </p>
          )}
          {displayTags.length > 0 && (
            <p className="mt-1 text-white/60 text-[12px]">
              {displayTags.map((t) => `#${t}`).join(" ")}
            </p>
          )}
        </div>

        {/* Right-side action stack */}
        <div
          className="absolute right-3 bottom-24 flex flex-col items-center gap-5 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Prayed */}
          <ActionBtn
            onClick={() => handleReaction("PRAYED")}
            label="기도했어요"
            active={reactions.prayed}
            count={counts.prayed}
          >
            <IconHands className="w-7 h-7" />
          </ActionBtn>

          {/* With You */}
          <ActionBtn
            onClick={() => handleReaction("WITH_YOU")}
            label="함께해요"
            active={reactions.withYou}
            count={counts.withYou}
          >
            <IconHeart className="w-7 h-7" />
          </ActionBtn>

          {/* Comments */}
          <ActionBtn
            onClick={() => setShowComments(true)}
            label="댓글"
            active={false}
            count={post.commentCount ?? 0}
          >
            <IconMessageCircle className="w-7 h-7" />
          </ActionBtn>

          {/* Bookmark */}
          <ActionBtn
            onClick={handleBookmark}
            label="저장"
            active={bookmarked}
          >
            <IconBookmark className="w-7 h-7" />
          </ActionBtn>
        </div>
      </div>

      {showComments && (
        <ShortsCommentsSheet
          postId={post.id}
          currentUserId={currentUserId}
          commentCount={post.commentCount ?? 0}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  );
}

function ActionBtn({
  children,
  onClick,
  label,
  active,
  count,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active: boolean;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90"
    >
      <span
        className="text-white drop-shadow"
        style={
          active
            ? { filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))" }
            : { opacity: 0.85 }
        }
      >
        {children}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-white text-[11px] font-medium drop-shadow tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}
