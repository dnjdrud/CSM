"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FeedPanel } from "@/app/(app)/community/_components/FeedPanel";
import { ContentPanel } from "@/app/(app)/community/_components/ContentPanel";
import type { CommunityPost } from "@/lib/data/communityRepository";

const COMMUNITY_BASE = "/feed";

type Tab = "posts" | "community";

interface UnifiedHomeLayoutProps {
  feedChildren: ReactNode;
  posts: CommunityPost[];
  selectedPost: CommunityPost | null;
  selectedId: string | null;
  fetchError: string | null;
  postError: string | null;
  currentUserId: string | null;
}

export function UnifiedHomeLayout({
  feedChildren,
  posts,
  selectedPost,
  selectedId,
  fetchError,
  postError,
  currentUserId,
}: UnifiedHomeLayoutProps) {
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<Tab>("posts");

  const goToCommunityList = () => {
    router.push(COMMUNITY_BASE);
  };

  return (
    <>
      {/* Mobile: tabs */}
      <div
        className="md:hidden flex border-b border-theme-border bg-theme-surface shrink-0"
        role="tablist"
        aria-label="Posts or Community"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "posts"}
          onClick={() => setMobileTab("posts")}
          className="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 -mb-px"
          style={{
            borderBottomColor: mobileTab === "posts" ? "var(--primary)" : "transparent",
            color: mobileTab === "posts" ? "var(--primary)" : "var(--muted)",
          }}
        >
          Posts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "community"}
          onClick={() => setMobileTab("community")}
          className="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 -mb-px"
          style={{
            borderBottomColor: mobileTab === "community" ? "var(--primary)" : "transparent",
            color: mobileTab === "community" ? "var(--primary)" : "var(--muted)",
          }}
        >
          Community
        </button>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[1fr_360px] min-h-0 flex-1 w-full gap-0">
        {/* Feed column */}
        <div
          className={`flex flex-col min-h-0 border-theme-border md:border-r ${
            mobileTab !== "posts" ? "hidden md:flex" : ""
          }`}
        >
          {feedChildren}
        </div>

        {/* Community column: list + content stacked */}
        <section
          className={`flex flex-col min-h-0 overflow-hidden ${
            mobileTab !== "community" ? "hidden md:flex" : ""
          }`}
          aria-label="Community"
        >
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col border-t md:border-t-0 border-theme-border">
            <div className="p-2 border-b border-theme-border bg-theme-surface/80 shrink-0">
              <h2 className="text-sm font-semibold text-theme-text">Community</h2>
              <p className="text-xs text-theme-muted mt-0.5">Videos &amp; content</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <FeedPanel
                posts={posts}
                selectedId={selectedId}
                fetchError={fetchError}
                postLinkBase={COMMUNITY_BASE}
              />
            </div>
            {selectedId && (
              <div className="border-t border-theme-border shrink-0 max-h-[60vh] overflow-y-auto">
                <ContentPanel
                  post={selectedPost}
                  postError={postError}
                  onBackToFeed={goToCommunityList}
                  showBackButton={true}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
