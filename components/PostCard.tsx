"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { Comment } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import type { ReactionType } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { CommentForm } from "@/app/(app)/post/[id]/_components/CommentForm";
import { CommentList } from "@/app/(app)/post/[id]/_components/CommentList";
import { PostActionsMenu } from "@/app/(app)/post/[id]/_components/PostActionsMenu";
import { FollowButton } from "@/components/FollowButton";
import { useClientSession } from "@/lib/auth/useClientSession";
import { ReactorsModal } from "@/components/ReactorsModal";
import { useT } from "@/lib/i18n";

function relativeTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (locale === "en") {
    if (diffM < 1) return "just now";
    if (diffM < 60) return `${diffM}m`;
    if (diffH < 24) return `${diffH}h`;
    if (diffD < 7) return `${diffD}d`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (diffM < 1) return "방금";
  if (diffM < 60) return `${diffM}분`;
  if (diffH < 24) return `${diffH}시간`;
  if (diffD < 7) return `${diffD}일`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

type CommentWithAuthor = Comment & { author: User };

type AddCommentAction = (postId: string, content: string, parentId?: string) => Promise<{ ok: boolean; error?: string }>;
type DeleteCommentAction = (commentId: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;
type UpdateCommentAction = (commentId: string, content: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;

function ShareButton({ postId }: { postId: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={t.postCard.shareLink}
      title={copied ? t.postCard.copied : t.postCard.shareLink}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg border border-transparent bg-transparent px-2 py-2 text-theme-muted transition-colors duration-200 hover:bg-theme-surface-2 hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      )}
    </button>
  );
}

type DeletePostAction = (postId: string) => Promise<{ ok: boolean; error?: string }>;
type UpdatePostAction = (postId: string, content: string, category?: string, visibility?: string, tags?: string[]) => Promise<{ ok: boolean; error?: string }>;
type ToggleBookmarkAction = (postId: string) => Promise<{ ok: boolean; bookmarked: boolean } | void>;
type GetReactorsAction = (postId: string, type: ReactionType) => Promise<User[]>;

const CONTENT_CLAMP_LINES = 6;

export function PostCard({
  post,
  currentUserId = null,
  compact = false,
  onToggleReaction,
  onToggleBookmark,
  getReactorsAction,
  initialBookmarked = false,
  getCommentsForPost,
  addCommentAction: addCommentActionProp,
  deleteCommentAction: deleteCommentActionProp,
  updateCommentAction: updateCommentActionProp,
  deletePostAction: deletePostActionProp,
  updatePostAction: updatePostActionProp,
  initialFollowing,
}: {
  post: PostWithAuthor;
  currentUserId?: string | null;
  compact?: boolean;
  initialFollowing?: boolean;
  initialBookmarked?: boolean;
  onToggleReaction?: (postId: string, type: ReactionType) => Promise<{ ok?: boolean; reacted?: boolean } | void>;
  onToggleBookmark?: ToggleBookmarkAction;
  getReactorsAction?: GetReactorsAction;
  getCommentsForPost?: (postId: string) => Promise<CommentWithAuthor[]>;
  addCommentAction?: AddCommentAction;
  deleteCommentAction?: DeleteCommentAction;
  updateCommentAction?: UpdateCommentAction;
  deletePostAction?: DeletePostAction;
  updatePostAction?: UpdatePostAction;
}) {
  const t = useT();
  const router = useRouter();
  const { userId: clientUserId } = useClientSession();
  const effectiveUserId = currentUserId ?? clientUserId;
  const countsFromPost = post.reactionCounts ?? { prayed: 0, withYou: 0 };
  const [responses, setResponses] = useState(post.reactionsByCurrentUser);
  const [counts, setCounts] = useState(countsFromPost);
  const [justActivated, setJustActivated] = useState<"prayed" | "withYou" | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [reactorsModal, setReactorsModal] = useState<{ type: "PRAYED" | "WITH_YOU"; users: User[]; loading: boolean } | null>(null);
  const isAuthor = effectiveUserId != null && effectiveUserId === post.authorId;
  const canReact = Boolean(onToggleReaction);
  const canCommentInline = Boolean(getCommentsForPost && effectiveUserId != null);
  const isDailyPrayer =
    post.isDailyPrayer === true || post.tags?.some((tag) => tag.toLowerCase() === "daily-prayer");
  const isTestimony = post.category === "TESTIMONY";
  const shouldClamp = compact && post.content.split("\n").length > CONTENT_CLAMP_LINES;

  // Detect locale from t (ko has Korean strings)
  const locale = t.common.save === "저장" ? "ko" : "en";

  const loadComments = useCallback(async () => {
    if (!getCommentsForPost) return;
    setCommentsLoading(true);
    try {
      const list = await getCommentsForPost(post.id);
      setComments(list);
    } finally {
      setCommentsLoading(false);
    }
  }, [getCommentsForPost, post.id]);

  function toggleComments() {
    if (commentsOpen) {
      setCommentsOpen(false);
    } else {
      setCommentsOpen(true);
      if (comments === null) loadComments();
    }
  }

  async function handleCommentSuccess() {
    await loadComments();
    setCommentCount((c) => c + 1);
  }

  async function handlePrayed() {
    if (!onToggleReaction) return;
    const turningOn = !responses.prayed;
    const prevResponses = responses;
    const prevCounts = counts;
    setResponses((prev) => ({ ...prev, prayed: !prev.prayed }));
    setCounts((prev) => ({ ...prev, prayed: turningOn ? prev.prayed + 1 : Math.max(0, prev.prayed - 1) }));
    if (turningOn) { setJustActivated("prayed"); setTimeout(() => setJustActivated(null), 320); }
    try {
      const result = await onToggleReaction(post.id, "PRAYED");
      if (result && result.ok === false) { setResponses(prevResponses); setCounts(prevCounts); }
      else router.refresh();
    } catch { setResponses(prevResponses); setCounts(prevCounts); }
  }

  async function handleWithYou() {
    if (!onToggleReaction) return;
    const turningOn = !responses.withYou;
    const prevResponses = responses;
    const prevCounts = counts;
    setResponses((prev) => ({ ...prev, withYou: !prev.withYou }));
    setCounts((prev) => ({ ...prev, withYou: turningOn ? prev.withYou + 1 : Math.max(0, prev.withYou - 1) }));
    if (turningOn) { setJustActivated("withYou"); setTimeout(() => setJustActivated(null), 320); }
    try {
      const result = await onToggleReaction(post.id, "WITH_YOU");
      if (result && result.ok === false) { setResponses(prevResponses); setCounts(prevCounts); }
      else router.refresh();
    } catch { setResponses(prevResponses); setCounts(prevCounts); }
  }

  async function handleBookmark() {
    if (!onToggleBookmark) return;
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const result = await onToggleBookmark(post.id);
      if (result && result.ok === false) setBookmarked(prev);
    } catch { setBookmarked(prev); }
  }

  async function openReactorsModal(type: "PRAYED" | "WITH_YOU") {
    if (!getReactorsAction) return;
    setReactorsModal({ type, users: [], loading: true });
    const users = await getReactorsAction(post.id, type);
    setReactorsModal({ type, users, loading: false });
  }

  return (
    <>
    <Card
      role="article"
      data-post-id={post.id}
      className={isDailyPrayer && !isTestimony ? "border-theme-accent/30 bg-theme-surface-2/30" : undefined}
    >
      <CardContent className="py-4 px-4 sm:px-5">
      {isTestimony && (
        <div className="mb-2">
          <Badge variant="testimony">{t.postCard.testimony}</Badge>
        </div>
      )}
      {isDailyPrayer && !isTestimony && (
        <p className="mb-2 text-[12px] text-theme-muted">{t.postCard.dailyPrayer}</p>
      )}

      <header className="flex items-start gap-3">
        <Avatar name={post.author.name} src={post.author.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <Link
              href={`/profile/${post.author.id}`}
              className="text-[15px] font-medium text-theme-text hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
            >
              {post.author.name}
            </Link>
            <span className="text-[12px] text-theme-muted">{ROLE_DISPLAY[post.author.role]}</span>
            {post.author.affiliation && (
              <span className="text-[12px] text-theme-muted truncate" title={post.author.affiliation}>
                · {post.author.affiliation}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <time dateTime={post.createdAt} className="text-[11px] text-theme-muted">
              {relativeTime(post.createdAt, locale)}
            </time>
            {post.visibility === "PRIVATE" && (
              <span className="text-[11px] text-theme-muted" title="나만 보기" aria-label="비공개">🔒</span>
            )}
            {post.visibility === "FOLLOWERS" && (
              <span className="text-[11px] text-theme-muted" title="팔로워 공개" aria-label="팔로워 공개">👥</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAuthor && (
            <PostActionsMenu
              post={post}
              compact
              onUpdated={() => router.refresh()}
              onDeleted={() => router.refresh()}
              deletePostAction={deletePostActionProp}
              updatePostAction={updatePostActionProp}
            />
          )}
          {!isAuthor && effectiveUserId != null && initialFollowing !== undefined && (
            <FollowButton followingId={post.authorId} initialFollowing={initialFollowing} compact />
          )}
        </div>
      </header>

      <div className="mt-2">
        {post.subscribersOnly && !post.isViewerSubscriber && effectiveUserId !== post.authorId ? (
          <div className="relative rounded-xl overflow-hidden border border-theme-border/60">
            {/* Blurred preview of first ~120 chars */}
            <div className="px-4 py-3 text-[15px] leading-7 text-theme-text whitespace-pre-wrap font-sans blur-sm select-none pointer-events-none line-clamp-3">
              {post.content.slice(0, 120)}
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-theme-surface/80 backdrop-blur-sm px-4 py-4 text-center">
              <span className="text-2xl" aria-hidden>🔒</span>
              <p className="text-[13px] font-medium text-theme-text">구독 후 열람 가능</p>
              {post.authorSubscriptionPriceKrw && (
                <p className="text-[12px] text-theme-muted">
                  월 {post.authorSubscriptionPriceKrw.toLocaleString()}원
                </p>
              )}
              <Link
                href={`/profile/${post.authorId}?tab=crow`}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-theme-primary text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
              >
                <span aria-hidden>🐦</span> 구독하기
              </Link>
            </div>
          </div>
        ) : shouldClamp ? (
          <>
            <div className="line-clamp-6 text-[15px] leading-7 text-theme-text whitespace-pre-wrap font-sans">
              {post.content}
            </div>
            <Link
              href={`/post/${post.id}`}
              className="mt-1 inline-block text-xs font-medium text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
            >
              {t.postCard.readMore}
            </Link>
          </>
        ) : (
          <div className="text-[15px] leading-7 text-theme-text whitespace-pre-wrap font-sans">
            {post.content}
          </div>
        )}
      </div>

      {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && post.mediaUrls[0] && (
        <div className="mt-3 relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <Image src={post.mediaUrls[0]} alt={t.postCard.photoAlt} fill className="object-contain" unoptimized />
        </div>
      )}

      {post.youtubeUrl && (() => {
        const ytMatch = post.youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        const videoId = ytMatch?.[1];
        return videoId ? (
          <div className="mt-3 relative w-full aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        ) : null;
      })()}

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Topics">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/topics/${encodeURIComponent(tag)}`}
              className="inline-flex items-center rounded-full border border-theme-border bg-theme-surface-2 px-2.5 py-0.5 text-[12px] text-theme-text hover:bg-theme-surface hover:border-theme-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div
        className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6 border-t border-theme-border pt-3 text-[12px] text-theme-muted"
        role="group"
        aria-label="Respond to this post"
      >
        {canReact && (
          <>
            <button
              type="button"
              onClick={handlePrayed}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-transparent px-2 py-2 -ml-1 transition-colors duration-200 hover:bg-theme-surface-2 hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:bg-theme-surface-2 ${justActivated === "prayed" ? "animate-reaction-on font-medium text-theme-text" : ""} ${responses.prayed ? "font-medium text-theme-text border-theme-accent/50" : ""}`}
            >
              <span aria-hidden>🙏</span>
              {t.reactions.prayed}
              {counts.prayed > 0 && (
                getReactorsAction ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openReactorsModal("PRAYED"); }}
                    className="ml-1 tabular-nums text-theme-muted underline-offset-2 hover:underline focus:outline-none"
                    aria-label={`${counts.prayed} prayed`}
                  >
                    {counts.prayed}
                  </button>
                ) : (
                  <span className="ml-1 tabular-nums text-theme-muted">{counts.prayed}</span>
                )
              )}
            </button>
            <button
              type="button"
              onClick={handleWithYou}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-transparent px-2 py-2 -ml-1 transition-colors duration-200 hover:bg-theme-surface-2 hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:bg-theme-surface-2 ${justActivated === "withYou" ? "animate-reaction-on font-medium text-theme-text" : ""} ${responses.withYou ? "font-medium text-theme-text border-theme-accent/50" : ""}`}
            >
              <span aria-hidden>🤍</span>
              {t.reactions.withYou}
              {counts.withYou > 0 && (
                getReactorsAction ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openReactorsModal("WITH_YOU"); }}
                    className="ml-1 tabular-nums text-theme-muted underline-offset-2 hover:underline focus:outline-none"
                    aria-label={`${counts.withYou} with you`}
                  >
                    {counts.withYou}
                  </button>
                ) : (
                  <span className="ml-1 tabular-nums text-theme-muted">{counts.withYou}</span>
                )
              )}
            </button>
          </>
        )}
        {getCommentsForPost ? (
          <button
            type="button"
            onClick={toggleComments}
            aria-expanded={commentsOpen}
            aria-controls={`comments-${post.id}`}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-transparent px-2 py-2 -ml-1 transition-colors duration-200 hover:bg-theme-surface-2 hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:bg-theme-surface-2 ${commentsOpen ? "font-medium text-theme-text border-theme-accent/50" : ""}`}
          >
            <span aria-hidden>💬</span>
            {t.postCard.comment}
            {commentCount > 0 && (
              <span className="ml-1 tabular-nums text-theme-muted">{commentCount}</span>
            )}
          </button>
        ) : (
          <Link
            href={`/post/${post.id}`}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-transparent px-2 py-2 -ml-1 transition-colors duration-200 hover:bg-theme-surface-2 hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:bg-theme-surface-2"
          >
            <span aria-hidden>💬</span>
            {t.postCard.comment}
            {commentCount > 0 && (
              <span className="ml-1 tabular-nums text-theme-muted">{commentCount}</span>
            )}
          </Link>
        )}
        <ShareButton postId={post.id} />
        {onToggleBookmark && (
          <button
            type="button"
            onClick={handleBookmark}
            aria-label={bookmarked ? t.postCard.unbookmark : t.postCard.bookmark}
            className={`ml-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-transparent bg-transparent px-2 py-2 transition-colors duration-200 hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 ${bookmarked ? "text-theme-text" : "text-theme-muted"}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>

      {getCommentsForPost && commentsOpen && (
        <div id={`comments-${post.id}`} className="mt-4 border-t border-theme-border pt-4 pb-2">
          <h3 className="text-[11px] font-medium text-theme-muted uppercase tracking-wider mb-3">
            {t.postCard.comment}
          </h3>
          <div className="pl-3 sm:pl-4 text-[13px] leading-6 text-theme-text">
          {commentsLoading && comments === null ? (
            <>
              {canCommentInline && (
                <CommentForm postId={post.id} onSuccess={handleCommentSuccess} addCommentAction={addCommentActionProp} />
              )}
              <div className="mt-4">
                <CommentList comments={[]} postId={post.id} currentUserId={effectiveUserId} loading onCommentDeleted={() => loadComments()} onCommentUpdated={() => loadComments()} deleteCommentAction={deleteCommentActionProp} updateCommentAction={updateCommentActionProp} addCommentAction={addCommentActionProp} />
              </div>
            </>
          ) : (
            <>
              {canCommentInline && (
                <CommentForm postId={post.id} onSuccess={handleCommentSuccess} addCommentAction={addCommentActionProp} />
              )}
              {!canCommentInline && effectiveUserId === null && (
                <p className="mb-3 text-theme-muted text-[13px]">
                  <Link href={`/post/${post.id}`} className="underline hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent rounded">
                    {t.postCard.commentLogin}
                  </Link>
                </p>
              )}
              <div className="mt-4">
                <CommentList comments={comments ?? []} postId={post.id} currentUserId={effectiveUserId} onCommentDeleted={() => loadComments()} onCommentUpdated={() => loadComments()} deleteCommentAction={deleteCommentActionProp} updateCommentAction={updateCommentActionProp} addCommentAction={addCommentActionProp} />
              </div>
            </>
          )}
          </div>
        </div>
      )}
      </CardContent>
    </Card>
    {reactorsModal && (
      <ReactorsModal
        type={reactorsModal.type}
        users={reactorsModal.users}
        loading={reactorsModal.loading}
        onClose={() => setReactorsModal(null)}
      />
    )}
    </>
  );
}
