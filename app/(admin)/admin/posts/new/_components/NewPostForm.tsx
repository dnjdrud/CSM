"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPostAction } from "../actions";
import type { PostCategory, Visibility } from "@/lib/domain/types";

interface NewPostFormProps {
  categories: PostCategory[];
  visibilities: Visibility[];
  categoryLabels: Record<PostCategory, string>;
  visibilityLabels: Record<Visibility, string>;
}

export function NewPostForm({
  categories,
  visibilities,
  categoryLabels,
  visibilityLabels,
}: NewPostFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await createPostAction(formData);
      if (result.ok) {
        router.push(`/feed?post=${result.id}`);
        return;
      }
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6"
      aria-label="새 게시물 작성"
    >
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={500}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          placeholder="제목을 입력하세요"
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          rows={5}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          placeholder="본문 (선택)"
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
          YouTube URL (선택)
        </label>
        <input
          id="youtubeUrl"
          name="youtubeUrl"
          type="url"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={submitting}
        />
        <p className="mt-0.5 text-xs text-gray-500">
          watch, youtu.be, embed 형식 지원. 영상 ID만 저장됩니다.
        </p>
      </div>

      <div>
        <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700">
          썸네일 URL (선택)
        </label>
        <input
          id="thumbnailUrl"
          name="thumbnailUrl"
          type="url"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          placeholder="https://..."
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          카테고리
        </label>
        <select
          id="category"
          name="category"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          disabled={submitting}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
          공개 범위
        </label>
        <select
          id="visibility"
          name="visibility"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          disabled={submitting}
        >
          {visibilities.map((v) => (
            <option key={v} value={v}>
              {visibilityLabels[v]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          태그 (쉼표 구분, 선택)
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          placeholder="예: 기도, 감사"
          disabled={submitting}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-theme-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {submitting ? "저장 중…" : "저장 후 커뮤니티에서 보기"}
        </button>
        <Link
          href="/feed"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
