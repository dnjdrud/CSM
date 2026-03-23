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
import { IconHands, IconHeart, IconLock, IconMessageCircle, IconUsers, IconFeather } from "@/components/ui/Icon";
import { relativeTimeLocale } from "@/lib/utils/time";

type CommentWithAuthor = Comment & { author: User };

type AddCommentAction = (postId: string, content: string, parentId?: string) => Promise<{ ok: boolean; error?: string }>;
type DeleteCommentAction = (commentId: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;
type UpdateCommentAction = (commentId: string, content: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;

/* Shared action button style: subtle, touch target preserved */
const actionBtnBase =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-transparent px-2.5 py-2 text-xs font-medium text-theme-muted transition-colors duration-200 hover:text-theme-text hover:bg-theme-surface-2/60 active:bg-theme-surface-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2";

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
      className={`${actionBtnBase} -ml-1`}
    >
      {copied ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-theme-success shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
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
      className={`${isDailyPrayer && !isTestimony ? "border-theme-accent/30 bg-theme-surface-2/30" : ""}`}
    >
      <CardContent className="p-5 sm:p-6">
      {isTestimony && (
        <div className="mb-4">
          <Badge variant="testimony">{t.postCard.testimony}</Badge>
        </div>
      )}
      {isDailyPrayer && !isTestimony && (
        <p className="mb-4 text-xs text-theme-muted">{t.postCard.dailyPrayer}</p>
      )}

      {/* Author section */}
      <header className="flex items-start gap-3">
        <Link
          href={`/profile/${post.author.id}`}
          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
        >
          <Avatar name={post.author.name} src={post.author.avatarUrl} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <Link
              href={`/profile/${post.author.id}`}
              className="text-base font-medium text-theme-text hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
            >
              {post.author.name}
            </Link>
            <span className="text-xs text-theme-muted">{ROLE_DISPLAY[post.author.role]}</span>
            {post.author.affiliation && (
              <span className="text-xs text-theme-muted truncate max-w-[140px] sm:max-w-[200px]" title={post.author.affiliation}>
                · {post.author.affiliation}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-theme-muted">
            <time dateTime={post.createdAt}>{relativeTimeLocale(post.createdAt, locale)}</time>
            {post.visibility === "PRIVATE" && (
              <span title="나만 보기" aria-label="비공개" className="inline-flex items-center">
                <IconLock className="h-3.5 w-3.5" />
              </span>
            )}
            {post.visibility === "FOLLOWERS" && (
              <span title="팔로워 공개" aria-label="팔로워 공개" className="inline-flex items-center">
                <IconUsers className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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

      {/* Content */}
      <div className="mt-5 space-y-4">
        {post.subscribersOnly && !post.isViewerSubscriber && effectiveUserId !== post.authorId ? (
          <div className="relative rounded-xl overflow-hidden border border-theme-border bg-theme-surface-2/50">
            <div className="px-4 py-3 text-[15px] leading-relaxed text-theme-text whitespace-pre-wrap blur-sm select-none pointer-events-none line-clamp-3 break-words">
              {post.content.slice(0, 120)}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-theme-surface/90 backdrop-blur-sm px-5 py-5 text-center">
              <IconLock className="h-7 w-7 text-theme-muted" aria-hidden />
              <p className="text-sm font-medium text-theme-text">구독 후 열람 가능</p>
              {post.authorSubscriptionPriceKrw && (
                <p className="text-meta text-theme-muted">
                  월 {post.authorSubscriptionPriceKrw.toLocaleString()}원
                </p>
              )}
              <Link
                href={`/profile/${post.authorId}?tab=crow`}
                className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-primary text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
              >
                <IconFeather className="h-4 w-4" aria-hidden />
                구독하기
              </Link>
            </div>
          </div>
        ) : shouldClamp ? (
          <>
            <div className="line-clamp-6 text-[15px] leading-relaxed text-theme-text whitespace-pre-wrap break-words">
              {post.content}
            </div>
            <Link
              href={`/post/${post.id}`}
              className="mt-3 inline-block text-sm font-medium text-theme-muted hover:text-theme-text hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
            >
              {t.postCard.readMore}
            </Link>
          </>
        ) : (
          <div className="text-[15px] leading-relaxed text-theme-text whitespace-pre-wrap break-words">
            {post.content}
          </div>
        )}
      </div>

      {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && post.mediaUrls[0] && (
        <div className="mt-4 relative w-full aspect-video rounded-lg overflow-hidden bg-theme-surface-3 mb-4">
          <Image src={post.mediaUrls[0]} alt={t.postCard.photoAlt} fill className="object-contain" unoptimized />
        </div>
      )}

      {post.youtubeUrl && (() => {
        const ytMatch = post.youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        const videoId = ytMatch?.[1];
        return videoId ? (
          <div className="mt-4 relative w-full aspect-video rounded-lg overflow-hidden bg-black mb-4">
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
        <div className="flex flex-wrap gap-2" aria-label="Topics">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/topics/${encodeURIComponent(tag)}`}
              className="inline-flex items-center rounded-full border border-theme-border bg-theme-surface-2 px-3 py-1 text-meta text-theme-text hover:bg-theme-surface-3 hover:border-theme-border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 transition-colors duration-150"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Reaction & actions bar */}
      <div
        className="mt-6 flex flex-wrap items-center gap-1 pt-5"
        role="group"
        aria-label="Respond to this post"
      >
        {canReact && (
          <>
            <button
              type="button"
              onClick={handlePrayed}
              className={`${actionBtnBase} -ml-1 mr-2 ${justActivated === "prayed" ? "animate-reaction-on " : ""} ${responses.prayed ? "bg-theme-surface-2 text-theme-text" : ""}`}
            >
              <IconHands className="h-3.5 w-3.5" aria-hidden />
              <span>{t.reactions.prayed}</span>
              {counts.prayed > 0 && (
                getReactorsAction ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openReactorsModal("PRAYED"); }}
                    className="ml-0.5 tabular-nums text-inherit opacity-80 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-1 rounded"
                    aria-label={`${counts.prayed} prayed`}
                  >
                    {counts.prayed}
                  </button>
                ) : (
                  <span className="ml-0.5 tabular-nums opacity-80">{counts.prayed}</span>
                )
              )}
            </button>
            <button
              type="button"
              onClick={handleWithYou}
              className={`${actionBtnBase} -ml-1 ${justActivated === "withYou" ? "animate-reaction-on " : ""} ${responses.withYou ? "bg-theme-surface-2 text-theme-text" : ""}`}
            >
              <IconHeart className="h-3.5 w-3.5" aria-hidden />
              <span>{t.reactions.withYou}</span>
              {counts.withYou > 0 && (
                getReactorsAction ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openReactorsModal("WITH_YOU"); }}
                    className="ml-0.5 tabular-nums text-inherit opacity-80 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-1 rounded"
                    aria-label={`${counts.withYou} with you`}
                  >
                    {counts.withYou}
                  </button>
                ) : (
                  <span className="ml-0.5 tabular-nums opacity-80">{counts.withYou}</span>
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
            className={`${actionBtnBase} -ml-1 ${commentsOpen ? "bg-theme-surface-2 text-theme-text" : ""}`}
          >
            <IconMessageCircle className="h-3.5 w-3.5" aria-hidden />
            <span>{t.postCard.comment}</span>
            {commentCount > 0 && (
              <span className="ml-0.5 tabular-nums opacity-80">{commentCount}</span>
            )}
          </button>
        ) : (
          <Link href={`/post/${post.id}`} className={`${actionBtnBase} -ml-1`}>
            <IconMessageCircle className="h-3.5 w-3.5" aria-hidden />
            <span>{t.postCard.comment}</span>
            {commentCount > 0 && (
              <span className="ml-0.5 tabular-nums opacity-80">{commentCount}</span>
            )}
          </Link>
        )}
        <ShareButton postId={post.id} />
        {onToggleBookmark && (
          <button
            type="button"
            onClick={handleBookmark}
            aria-label={bookmarked ? t.postCard.unbookmark : t.postCard.bookmark}
            className={`${actionBtnBase} ml-auto -mr-1 ${bookmarked ? "text-theme-text" : ""}`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>

      {getCommentsForPost && commentsOpen && (
        <div id={`comments-${post.id}`} className="mt-6 pt-5 border-t border-theme-border/50">
          <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-4">
            {t.postCard.comment}
          </h3>
          <div className="rounded-lg bg-theme-surface-2/40 px-4 py-3 sm:px-5 sm:py-4 text-[13px] leading-relaxed text-theme-text">
          {commentsLoading && comments === null ? (
            <>
              {canCommentInline && (
                <CommentForm postId={post.id} onSuccess={handleCommentSuccess} addCommentAction={addCommentActionProp} />
              )}
              <div className="mt-4">
                <CommentList comments={[]} postId={post.id} currentUserId={effectiveUserId} loading contentClampLines={1} onCommentDeleted={() => loadComments()} onCommentUpdated={() => loadComments()} deleteCommentAction={deleteCommentActionProp} updateCommentAction={updateCommentActionProp} addCommentAction={addCommentActionProp} />
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
                <CommentList comments={comments ?? []} postId={post.id} currentUserId={effectiveUserId} contentClampLines={1} onCommentDeleted={() => loadComments()} onCommentUpdated={() => loadComments()} deleteCommentAction={deleteCommentActionProp} updateCommentAction={updateCommentActionProp} addCommentAction={addCommentActionProp} />
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
