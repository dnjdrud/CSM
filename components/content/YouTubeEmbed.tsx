"use client";

import { useState } from "react";
import Image from "next/image";
import {
  extractYouTubeVideoId,
  toYouTubeThumbnailUrl,
  toYouTubeEmbedUrl,
} from "@/lib/utils/youtube";

type Props = {
  url: string;
  /**
   * "thumbnail" — shows thumbnail only, clicking opens the YouTube page.
   * "player"    — shows thumbnail that swaps to an inline iframe on click (default).
   * "embed"     — renders the iframe directly without thumbnail step.
   */
  mode?: "thumbnail" | "player" | "embed";
  /** Tailwind aspect-ratio class. Defaults to "aspect-video" (16/9). */
  aspectClass?: string;
};

export function YouTubeEmbed({
  url,
  mode = "player",
  aspectClass = "aspect-video",
}: Props) {
  const [playing, setPlaying] = useState(mode === "embed");

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const thumbnail = toYouTubeThumbnailUrl(url, "hqdefault")!;
  const embedSrc = `${toYouTubeEmbedUrl(url)}&autoplay=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (mode === "thumbnail") {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block w-full ${aspectClass} bg-black overflow-hidden rounded-lg group`}
        aria-label="YouTube에서 영상 보기"
      >
        <Image
          src={thumbnail}
          alt="YouTube 썸네일"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        <PlayIcon />
      </a>
    );
  }

  if (playing) {
    return (
      <div className={`relative w-full ${aspectClass} bg-black overflow-hidden`}>
        <iframe
          src={embedSrc}
          title="YouTube 영상"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          // Restrict iframe to YouTube only
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label="영상 재생"
      className={`relative block w-full ${aspectClass} bg-black overflow-hidden group`}
    >
      <Image
        src={thumbnail}
        alt="YouTube 썸네일"
        fill
        className="object-cover"
        unoptimized
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      <PlayIcon />
    </button>
  );
}

function PlayIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-14 h-14 rounded-full bg-black/70 group-hover:bg-black/85 flex items-center justify-center transition-colors shadow-lg">
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className="w-6 h-6 ml-0.5"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}
