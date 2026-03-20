"use client";

import { useState, useEffect, useRef } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";
import { ShortsCard } from "./ShortsCard";

type Props = { posts: PostWithAuthor[] };

export function ShortsFeed({ posts }: Props) {
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
      { root: container, threshold: 0.85 }
    );

    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white space-y-3">
        <span className="text-4xl" aria-hidden>🎬</span>
        <p className="text-[15px] font-medium">숏츠가 없습니다</p>
        <p className="text-[13px] text-white/60 text-center px-8 leading-relaxed">
          60초 이내의 짧은 영상을 업로드하면 여기에 나타납니다.
        </p>
        <a
          href="/write?category=SHORTS"
          className="mt-2 px-5 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
        >
          + 숏츠 올리기
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {posts.map((post, i) => (
        <div
          key={post.id}
          ref={(el) => { cardRefs.current[i] = el; }}
        >
          <ShortsCard post={post} isActive={i === currentIndex} />
        </div>
      ))}
    </div>
  );
}
