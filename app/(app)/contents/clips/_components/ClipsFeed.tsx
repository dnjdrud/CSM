"use client";

import { useState, useEffect, useRef } from "react";
import type { ClipFeedItem } from "@/lib/data/supabaseRepository";
import { ClipCard } from "./ClipCard";

type Props = { clips: ClipFeedItem[] };

export function ClipsFeed({ clips }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── IntersectionObserver: keeps currentIndex in sync with scroll ──────────
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
      // 0.85 threshold → card must be almost fully visible before becoming "active"
      // this prevents flickering when two cards are simultaneously partially visible
      { root: container, threshold: 0.85 }
    );

    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [clips]);

  // ── Auto-advance timer ─────────────────────────────────────────────────────
  useEffect(() => {
    // Clear any previous timer immediately on index change
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const clip = clips[currentIndex];
    const isLast = currentIndex >= clips.length - 1;

    // Stop auto-advance at last clip
    if (!clip || isLast) return;

    const clipDurationMs = (clip.endSeconds - clip.startSeconds) * 1000;
    // Minimum 3 s; add 800 ms for iframe load + YouTube player buffering
    const delayMs = Math.max(3000, clipDurationMs) + 800;

    timerRef.current = setTimeout(() => {
      const nextCard = cardRefs.current[currentIndex + 1];
      nextCard?.scrollIntoView({ behavior: "smooth", block: "start" });
      // setCurrentIndex is handled by IO callback after scroll settles
    }, delayMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, clips]);

  // ── Cancel auto-advance when user initiates a manual swipe ───────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => container.removeEventListener("touchstart", onTouchStart);
  }, []);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white space-y-3">
        <span className="text-4xl" aria-hidden>🎬</span>
        <p className="text-[15px] font-medium">클립이 없습니다</p>
        <p className="text-[13px] text-white/60 text-center px-8 leading-relaxed">
          게시글에서 AI 클립을 생성하면 여기에 나타납니다.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {clips.map((clip, i) => {
        const delta = Math.abs(i - currentIndex);
        // Only current/prev/next get full render; far cards are lightweight stubs
        const renderMode =
          i === currentIndex ? "active" : delta === 1 ? "nearby" : "hidden";

        return (
          <div
            key={clip.id}
            ref={(el) => { cardRefs.current[i] = el; }}
          >
            <ClipCard clip={clip} renderMode={renderMode} />
          </div>
        );
      })}
    </div>
  );
}
