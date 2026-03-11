import type { Comment } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import { CommentList } from "./CommentList";
import { addCommentFormAction } from "../actions";
import { getCommentLikeCounts } from "@/lib/data/repository";

type CommentWithAuthor = Comment & { author: User };

type Props = {
  postId: string;
  currentUserId: string | null;
  comments: CommentWithAuthor[];
};

export async function CommentsSection({ postId, currentUserId, comments }: Props) {
  const commentIds = comments.map((c) => c.id);
  const likeData = await getCommentLikeCounts(commentIds, currentUserId);

  return (
    <section className="mt-8 pt-6 border-t border-gray-200" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
        Comments
      </h2>

      {currentUserId && (
        <form
          action={addCommentFormAction}
          className="mb-4 space-y-2"
        >
          <input type="hidden" name="postId" value={postId} />
          <textarea
            name="content"
            rows={2}
            className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] leading-7 text-gray-900 placeholder:text-neutral-500 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y min-h-[4rem]"
            placeholder="댓글을 입력하세요… @이름 으로 멘션할 수 있습니다"
            aria-label="Comment content"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
            >
              Post
            </button>
          </div>
        </form>
      )}

      <div className="mt-4">
        <CommentList
          comments={comments}
          postId={postId}
          currentUserId={currentUserId}
          likeData={likeData}
        />
      </div>
    </section>
  );
}
