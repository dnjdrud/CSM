"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedPanel } from "./FeedPanel";
import { ContentPanel } from "./ContentPanel";
import type { CommunityPost } from "@/lib/data/communityRepository";

type Tab = "feed" | "contents";

interface CommunityShellProps {
  posts: CommunityPost[];
  selectedPost: CommunityPost | null;
  selectedId: string | null;
  fetchError: string | null;
  postError: string | null;
}

export function CommunityShell({
  posts,
  selectedPost,
  selectedId,
  fetchError,
  postError,
}: CommunityShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileTab, setMobileTab] = useState<Tab>("feed");

  useEffect(() => {
    if (selectedId) setMobileTab("contents");
  }, [selectedId]);

  const goToFeed = () => {
    setMobileTab("feed");
    router.push("/community", { scroll: false });
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-[360px_1fr] min-h-0 flex-1 w-full max-w-6xl mx-auto">
      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-theme-border bg-theme-surface shrink-0" role="tablist" aria-label="Feed or Contents">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "feed"}
          aria-controls="community-feed-panel"
          id="tab-feed"
          onClick={() => setMobileTab("feed")}
          className="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 -mb-px"
          style={{
            borderBottomColor: mobileTab === "feed" ? "var(--primary)" : "transparent",
            color: mobileTab === "feed" ? "var(--primary)" : "var(--muted)",
          }}
        >
          Feed
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "contents"}
          aria-controls="community-content-panel"
          id="tab-contents"
          onClick={() => setMobileTab("contents")}
          className="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 -mb-px"
          style={{
            borderBottomColor: mobileTab === "contents" ? "var(--primary)" : "transparent",
            color: mobileTab === "contents" ? "var(--primary)" : "var(--muted)",
          }}
        >
          Contents
        </button>
      </div>

      {/* Left: Feed panel — on mobile hidden when Contents tab; on md always visible */}
      <section
        id="community-feed-panel"
        role="tabpanel"
        aria-labelledby="tab-feed"
        className={`flex flex-col min-h-0 border-theme-border md:border-r overflow-hidden ${mobileTab === "contents" ? "hidden md:!block" : ""}`}
      >
        <div className="flex-1 overflow-y-auto min-h-0">
          <FeedPanel
            posts={posts}
            selectedId={selectedId}
            fetchError={fetchError}
          />
        </div>
      </section>

      {/* Right: Content panel — on mobile hidden when Feed tab; on md always visible */}
      <section
        id="community-content-panel"
        role="tabpanel"
        aria-labelledby="tab-contents"
        className={`flex flex-col min-h-0 overflow-hidden ${mobileTab === "feed" ? "hidden md:!block" : ""}`}
      >
        <div className="flex-1 overflow-y-auto min-h-0">
          <ContentPanel
            post={selectedPost}
            postError={postError}
            onBackToFeed={goToFeed}
            showBackButton={!!selectedId}
          />
        </div>
      </section>
    </div>
  );
}
