"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hidePostAction, unhidePostAction } from "../actions";
import type { AdminPostRow } from "@/lib/data/adminRepository";

const CATEGORY_LABEL: Record<string, string> = {
  GENERAL: "일반",
  DEVOTIONAL: "묵상",
  MINISTRY: "사역",
  TESTIMONY: "간증",
  PHOTO: "사진",
  PRAYER: "기도",
  CELL: "셀",
  CONTENT: "콘텐츠",
  REQUEST: "요청",
  MISSION: "선교",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = { posts: AdminPostRow[] };

export function AdminContentTable({ posts }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleHide(postId: string) {
    if (pendingId) return;
    setError(null);
    setPendingId(postId);
    const result = await hidePostAction(postId);
    setPendingId(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  async function handleUnhide(postId: string) {
    if (pendingId) return;
    setError(null);
    setPendingId(postId);
    const result = await unhidePostAction(postId);
    setPendingId(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  if (posts.length === 0) {
    return <p className="mt-4 text-sm text-gray-500">게시글이 없습니다.</p>;
  }

  return (
    <>
      {error && (
        <p className="mb-2 text-sm text-red-600" role="alert">{error}</p>
      )}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-3 font-medium text-gray-700 w-20">카테고리</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-700">내용</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-700 w-24">작성자</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-700 w-24">날짜</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-700 w-16">상태</th>
              <th className="text-left py-2 font-medium text-gray-700 w-24">액션</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className={`border-b border-gray-100 ${p.hiddenAt ? "bg-red-50/40" : ""}`}>
                <td className="py-2 pr-3">
                  <span className="inline-block rounded px-1.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600">
                    {CATEGORY_LABEL[p.category] ?? p.category}
                  </span>
                </td>
                <td className="py-2 pr-3 text-gray-700 max-w-xs">
                  <Link
                    href={`/post/${p.id}`}
                    target="_blank"
                    className="hover:underline line-clamp-2"
                  >
                    {p.content}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-gray-600 text-[13px]">
                  <Link href={`/profile/${p.authorId}`} className="hover:underline" target="_blank">
                    {p.authorName}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-gray-500 text-[13px]">{formatDate(p.createdAt)}</td>
                <td className="py-2 pr-3">
                  {p.hiddenAt ? (
                    <span className="text-[11px] font-medium text-red-600">숨김</span>
                  ) : (
                    <span className="text-[11px] text-gray-400">공개</span>
                  )}
                </td>
                <td className="py-2">
                  {p.hiddenAt ? (
                    <button
                      type="button"
                      onClick={() => handleUnhide(p.id)}
                      disabled={pendingId !== null}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {pendingId === p.id ? "…" : "복구"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleHide(p.id)}
                      disabled={pendingId !== null}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {pendingId === p.id ? "…" : "숨김"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
