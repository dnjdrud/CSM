"use client";

import type { ClipFeedItem } from "@/lib/data/supabaseRepository";

type RenderMode = "active" | "nearby" | "hidden";

type Props = {
  clip: ClipFeedItem;
  renderMode: RenderMode;
};

export function ClipCard({ clip, renderMode }: Props) {
  // Lightweight stub — still needs correct height for scroll-snap to work
  if (renderMode === "hidden") {
    return (
      <div
        className="w-full bg-black"
        style={{ height: "100dvh", scrollSnapAlign: "start" }}
      />
    );
  }

  const embedUrl =
    `https://www.youtube.com/embed/${clip.youtubeId}` +
    `?start=${clip.startSeconds}` +
    `&end=${clip.endSeconds}` +
    `&autoplay=1&mute=1&controls=0&loop=1&playsinline=1` +
    `&playlist=${clip.youtubeId}`;

  return (
    <div
      className="relative w-full shrink-0 bg-black"
      style={{ height: "100dvh", scrollSnapAlign: "start" }}
    >
      {/* Iframe only for active — nearby cards show black placeholder */}
      {renderMode === "active" ? (
        <iframe
          key={clip.id}
          src={embedUrl}
          title={clip.summary ?? "clip"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}

      {/* Bottom overlay — visible for active and nearby */}
      <div
        className="absolute bottom-0 inset-x-0 px-4 pb-8 pt-16 flex flex-col gap-2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
      >
        {clip.summary && (
          <p className="text-white text-[14px] leading-snug line-clamp-3">
            {clip.summary}
          </p>
        )}
        <a
          href={`/post/${clip.postId}`}
          className="self-start text-[12px] font-medium text-white/80 border border-white/30 rounded-full px-3 py-1 hover:bg-white/10 transition-colors"
        >
          원본 영상 보기 →
        </a>
      </div>
    </div>
  );
}
