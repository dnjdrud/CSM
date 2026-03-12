"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { composePostAction } from "../actions";
import type { PostCategory } from "@/lib/domain/types";

/* ─── 게시글 타입 정의 ──────────────────────────────────────── */

type PostType = {
  category: PostCategory;
  label: string;
  icon: string;
  description: string;
  placeholder: string;
  showYoutubeUrl?: boolean;
  showRequestType?: boolean;
  tab: string; // where it appears after posting
};

const REQUEST_TYPE_OPTIONS = [
  { value: "촬영", label: "📷 촬영 도움" },
  { value: "편집", label: "✂️ 편집 도움" },
  { value: "기획", label: "📋 기획 도움" },
  { value: "교육", label: "📚 교육/질문" },
  { value: "협업", label: "🤝 협업 제안" },
] as const;

const POST_TYPES: PostType[] = [
  {
    category: "GENERAL",
    label: "일반",
    icon: "✏️",
    description: "일상, 묵상, 나눔 등 자유롭게",
    placeholder: "오늘 하루 나누고 싶은 이야기를 써주세요.",
    tab: "/home",
  },
  {
    category: "PRAYER",
    label: "기도 제목",
    icon: "🙏",
    description: "함께 기도해 주세요",
    placeholder: "기도 제목을 나눠주세요. 함께 기도하겠습니다.",
    tab: "/home?tab=prayer",
  },
  {
    category: "CELL",
    label: "셀 나눔",
    icon: "💬",
    description: "셀 모임 나눔과 소식",
    placeholder: "셀 모임에서 나눈 이야기를 적어주세요.",
    tab: "/cells",
  },
  {
    category: "CONTENT",
    label: "컨텐츠",
    icon: "🎬",
    description: "유튜브 영상, 설교, 강의 공유",
    placeholder: "소개하고 싶은 컨텐츠를 설명해주세요.",
    showYoutubeUrl: true,
    tab: "/contents",
  },
  {
    category: "MISSION",
    label: "선교 업데이트",
    icon: "🌍",
    description: "선교 현장 소식과 기도 요청",
    placeholder: "선교 현장의 소식을 전해주세요.",
    tab: "/mission",
  },
  {
    category: "TESTIMONY",
    label: "간증",
    icon: "✨",
    description: "하나님의 일하심을 나눠요",
    placeholder: "하나님께서 하신 일을 나눠주세요.",
    tab: "/home",
  },
  {
    category: "REQUEST",
    label: "제작 요청",
    icon: "📬",
    description: "촬영·편집·기획 협업 요청",
    placeholder: "첫 줄에 요청 제목을 써주세요.\n\n어떤 도움이 필요한지 구체적으로 설명해주세요.\n예) 선교지 영상을 편집해주실 분을 찾고 있습니다.",
    showRequestType: true,
    tab: "/contents?tab=request",
  },
];

/* ─── 메인 컴포넌트 ──────────────────────────────────────────── */

export default function WritePageClient() {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<PostType | null>(null);
  const [initialTag, setInitialTag] = useState("");

  // ?category=CELL&tag=찬양 → 타입 선택 화면 건너뛰고 바로 작성 폼으로
  useEffect(() => {
    const categoryParam = searchParams.get("category") as PostCategory | null;
    const tagParam = searchParams.get("tag") ?? "";
    if (categoryParam) {
      const match = POST_TYPES.find((t) => t.category === categoryParam);
      if (match) {
        setInitialTag(tagParam);
        setSelected(match);
      }
    }
  // Only run on mount (searchParams stable after hydration)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (selected) {
    return (
      <ComposeForm
        postType={selected}
        initialTag={initialTag}
        onBack={() => { setSelected(null); setInitialTag(""); }}
      />
    );
  }

  return <TypePicker onSelect={(t) => { setInitialTag(""); setSelected(t); }} />;
}

/* ─── 타입 선택 화면 ─────────────────────────────────────────── */

function TypePicker({ onSelect }: { onSelect: (t: PostType) => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-[18px] font-semibold text-theme-text mb-1">
        무엇을 나누실 건가요?
      </h1>
      <p className="text-[13px] text-theme-muted mb-5">
        게시글 종류를 선택하세요
      </p>

      <div className="grid grid-cols-2 gap-3">
        {POST_TYPES.map((type) => (
          <button
            key={type.category}
            type="button"
            onClick={() => onSelect(type)}
            className="flex flex-col items-start gap-2 p-4 rounded-xl border border-theme-border bg-theme-surface hover:border-theme-primary/50 hover:bg-theme-surface-2 transition-all text-left group"
          >
            <span className="text-2xl">{type.icon}</span>
            <div>
              <p className="text-[14px] font-semibold text-theme-text group-hover:text-theme-primary transition-colors">
                {type.label}
              </p>
              <p className="text-[12px] text-theme-muted mt-0.5 leading-snug">
                {type.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── 작성 폼 ────────────────────────────────────────────────── */

function ComposeForm({
  postType,
  initialTag = "",
  onBack,
}: {
  postType: PostType;
  initialTag?: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tags, setTags] = useState(initialTag);
  const [requestType, setRequestType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);

    // 요청 유형 태그를 앞에 자동 삽입
    const extraTags = requestType ? [requestType] : [];
    const userTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const allTags = [...new Set([...extraTags, ...userTags])].slice(0, 5);

    const result = await composePostAction({
      content,
      category: postType.category,
      visibility: "MEMBERS",
      tags: allTags,
      youtubeUrl: youtubeUrl.trim() || undefined,
    });

    setSubmitting(false);
    if (result.ok) {
      router.push(postType.tab);
    } else {
      setError(result.error ?? "오류가 발생했습니다");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] text-theme-muted hover:text-theme-text"
        >
          ← 뒤로
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{postType.icon}</span>
          <span className="text-[15px] font-semibold text-theme-text">
            {postType.label}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 요청 유형 선택 (REQUEST 타입만) */}
        {postType.showRequestType && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-2">
              요청 유형 <span className="font-normal text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {REQUEST_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRequestType(requestType === opt.value ? "" : opt.value)}
                  className={`text-[13px] px-3 py-1.5 rounded-full border transition-all ${
                    requestType === opt.value
                      ? "bg-theme-primary/10 border-theme-primary/40 text-theme-primary font-medium"
                      : "bg-theme-surface border-theme-border text-theme-muted hover:border-theme-primary/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 유튜브 URL (CONTENT 타입만) */}
        {postType.showYoutubeUrl && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-1">
              유튜브 링크
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full text-[14px] border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
            />
          </div>
        )}

        {/* 본문 */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={postType.placeholder}
            rows={7}
            required
            className="w-full text-[15px] border border-theme-border rounded-xl px-4 py-3 bg-theme-surface text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/40 resize-none"
          />
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-[12px] font-medium text-theme-muted mb-1">
            태그 <span className="font-normal">(쉼표로 구분, 최대 5개)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="예) 묵상, 기도, 감사"
            className="w-full text-[14px] border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
          />
        </div>

        {/* 에러 */}
        {error && (
          <p className="text-[13px] text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* 제출 */}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="w-full py-3 rounded-xl text-[15px] font-semibold bg-theme-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? "게시 중…" : "게시하기"}
        </button>
      </form>
    </div>
  );
}
