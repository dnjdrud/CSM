import Link from "next/link";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  post: PostWithAuthor;
};

export function PostDetailBody({ post }: Props) {
  return (
    <>
      <div className="mt-2 text-[15px] leading-7 text-gray-900 whitespace-pre-wrap font-sans">
        {post.content}
      </div>

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-0" aria-label="Topics">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/topics/${encodeURIComponent(tag)}`}
              className="text-[13px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {post.reflectionPrompt && (
        <aside className="mt-6 pt-6 border-t border-gray-200" aria-label="Reflection prompt">
          <p className="text-[13px] font-medium text-gray-700 mb-1">Reflection</p>
          <p className="text-[15px] text-gray-800 leading-relaxed italic font-sans">
            {post.reflectionPrompt}
          </p>
        </aside>
      )}
    </>
  );
}
