import type { Comment } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";

type CommentWithAuthor = Comment & { author: User };

type Props = {
  postId: string;
  currentUserId: string | null;
  comments: CommentWithAuthor[];
};

export function CommentsSection({ postId, currentUserId, comments }: Props) {
  return (
    <section className="mt-8 pt-6 border-t border-gray-200" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
        Comments
      </h2>
      {currentUserId && <CommentForm postId={postId} />}
      <div className="mt-4">
        <CommentList
          comments={comments}
          postId={postId}
          currentUserId={currentUserId}
        />
      </div>
    </section>
  );
}
