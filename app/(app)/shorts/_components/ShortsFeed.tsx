"use client";

import { useState, useEffect, useRef } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";
import { ShortsCard } from "./ShortsCard";

type Props = {
  posts: PostWithAuthor[];
  currentUserId: string | null;
};

export function ShortsFeed({ posts, currentUserId }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cards.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setCurrentIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-dvh bg-black text-white space-y-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-12 h-12 opacity-60">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 5v14M17 5v14M3 9h4M17 9h4M3 15h4M17 15h4" />
        </svg>
        <p className="text-[15px] font-medium">숏츠가 없습니다</p>
        <p className="text-[13px] text-white/60 text-center px-8 leading-relaxed">
          30초 이내의 짧은 영상을 업로드하면 여기에 나타납니다.
        </p>
        <a
          href="/write?category=SHORTS"
          className="mt-2 px-5 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
        >
          숏츠 올리기
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-dvh overflow-y-scroll no-scrollbar"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {posts.map((post, i) => (
        <div
          key={post.id}
          ref={(el) => { cardRefs.current[i] = el; }}
        >
          {/* Only fully render active ± 2 cards; placeholder otherwise */}
          {Math.abs(i - currentIndex) <= 2 ? (
            <ShortsCard
              post={post}
              isActive={i === currentIndex}
              currentUserId={currentUserId}
            />
          ) : (
            <div
              className="w-full bg-black"
              style={{ height: "100dvh", scrollSnapAlign: "start" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
