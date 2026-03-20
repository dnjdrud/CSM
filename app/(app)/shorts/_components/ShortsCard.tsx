"use client";

import { useRef, useEffect } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  post: PostWithAuthor;
  isActive: boolean;
};

export function ShortsCard({ post, isActive }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = post.mediaUrls?.[0] ?? null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  if (!videoUrl) return null;

  return (
    <div
      className="relative w-full shrink-0 bg-black"
      style={{ height: "100dvh", scrollSnapAlign: "start" }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Bottom overlay */}
      <div
        className="absolute bottom-0 inset-x-0 px-4 pb-8 pt-16 flex flex-col gap-2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
      >
        <p className="text-white text-[14px] font-medium leading-snug">
          {post.author.name}
        </p>
        {post.content && (
          <p className="text-white/80 text-[13px] leading-snug line-clamp-3">
            {post.content}
          </p>
        )}
        <a
          href={`/post/${post.id}`}
          className="self-start text-[12px] font-medium text-white/80 border border-white/30 rounded-full px-3 py-1 hover:bg-white/10 transition-colors"
        >
          게시글 보기 →
        </a>
      </div>
    </div>
  );
}
