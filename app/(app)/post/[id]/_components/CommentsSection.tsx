import type { Comment } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import { CommentsLive } from "./CommentsLive";
import { addCommentFormAction } from "../actions";
import { getCommentLikeCounts } from "@/lib/data/repository";
import { getServerT } from "@/lib/i18n/server";

type CommentWithAuthor = Comment & { author: User };

type Props = {
  postId: string;
  currentUserId: string | null;
  comments: CommentWithAuthor[];
  allowComments?: boolean;
};

export async function CommentsSection({ postId, currentUserId, comments, allowComments = true }: Props) {
  const t = await getServerT();
  const commentIds = comments.map((c) => c.id);
  const likeData = await getCommentLikeCounts(commentIds, currentUserId);

  return (
    <section className="mt-8 pt-6 border-t border-theme-border" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-4">
        {allowComments ? t.comments.title : t.comments.prayerTitle}
      </h2>

      {!allowComments && (
        <p className="mb-4 text-[13px] text-theme-muted italic">
          {t.comments.prayerNote}
        </p>
      )}

      {allowComments && currentUserId && (
        <form
          action={addCommentFormAction}
          className="mb-4 space-y-2"
        >
          <input type="hidden" name="postId" value={postId} />
          <textarea
            name="content"
            rows={2}
            className="block w-full rounded-input border border-theme-border bg-theme-surface-2/80 px-3 py-2 text-[15px] leading-7 text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:bg-theme-surface focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors resize-y min-h-[4rem]"
            placeholder={t.comments.placeholder}
            aria-label={t.comments.title}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-button bg-theme-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-theme-primary-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 transition-colors"
            >
              {t.comments.post}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4">
        <CommentsLive
          postId={postId}
          currentUserId={allowComments ? currentUserId : null}
          initialComments={comments}
          likeData={likeData}
        />
      </div>
    </section>
  );
}
