"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { composePostAction } from "../actions";
import { uploadPostImageAction } from "../uploadImageAction";
import type { PostCategory } from "@/lib/domain/types";
import { MISSION_COUNTRIES } from "@/lib/mission/countries";
import { CELL_TOPICS } from "@/lib/cells/topics";

/* ─── 게시글 타입 정의 ──────────────────────────────────────── */

type PostType = {
  category: PostCategory;
  label: string;
  icon: string;
  description: string;
  placeholder: string;
  showYoutubeUrl?: boolean;
  showRequestType?: boolean;
  showMissionCountry?: boolean;
  showCellTopic?: boolean;
  showImageUpload?: boolean;
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
    showImageUpload: true,
  },
  {
    category: "PRAYER",
    label: "기도 제목",
    icon: "🙏",
    description: "함께 기도해 주세요",
    placeholder: "기도 제목을 나눠주세요. 함께 기도하겠습니다.",
  },
  {
    category: "CELL",
    label: "셀 나눔",
    icon: "💬",
    description: "셀 모임 나눔과 소식",
    placeholder: "셀 모임에서 나눈 이야기를 적어주세요.",
    showCellTopic: true,
    showImageUpload: true,
  },
  {
    category: "CONTENT",
    label: "컨텐츠",
    icon: "🎬",
    description: "유튜브 영상, 설교, 강의 공유",
    placeholder: "소개하고 싶은 컨텐츠를 설명해주세요.",
    showYoutubeUrl: true,
    showImageUpload: true,
  },
  {
    category: "MISSION",
    label: "선교 업데이트",
    icon: "🌍",
    description: "선교 현장 소식과 기도 요청",
    placeholder: "선교 현장의 소식을 전해주세요.",
    showMissionCountry: true,
  },
  {
    category: "TESTIMONY",
    label: "간증",
    icon: "✨",
    description: "하나님의 일하심을 나눠요",
    placeholder: "하나님께서 하신 일을 나눠주세요.",
  },
  {
    category: "REQUEST",
    label: "제작 요청",
    icon: "📬",
    description: "촬영·편집·기획 협업 요청",
    placeholder: "첫 줄에 요청 제목을 써주세요.\n\n어떤 도움이 필요한지 구체적으로 설명해주세요.\n예) 선교지 영상을 편집해주실 분을 찾고 있습니다.",
    showRequestType: true,
  },
];

/* 타입별 게시 후 이동 경로 */
function getRedirectPath(category: PostCategory, postId: string, cellTopic?: string): string {
  switch (category) {
    case "CONTENT":   return "/contents";
    case "CELL":      return cellTopic ? `/cells/topics/${cellTopic}` : "/cells";
    case "MISSION":   return "/mission";
    case "REQUEST":   return "/contents?tab=request";
    default:          return `/post/${postId}`;
  }
}

/* ─── 메인 컴포넌트 ──────────────────────────────────────────── */

export default function WritePageClient({
  recommendedCategories = [],
  writeHint,
}: {
  recommendedCategories?: PostCategory[];
  writeHint?: string;
}) {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<PostType | null>(null);
  const [initialTag, setInitialTag] = useState("");

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

  return (
    <TypePicker
      onSelect={(t) => { setInitialTag(""); setSelected(t); }}
      recommendedCategories={recommendedCategories}
      writeHint={writeHint}
    />
  );
}

/* ─── 타입 선택 화면 ─────────────────────────────────────────── */

function TypePicker({
  onSelect,
  recommendedCategories = [],
  writeHint,
}: {
  onSelect: (t: PostType) => void;
  recommendedCategories?: PostCategory[];
  writeHint?: string;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-[18px] font-semibold text-theme-text mb-1">
        무엇을 나누실 건가요?
      </h1>
      <p className="text-[13px] text-theme-muted mb-5">
        {writeHint ?? "게시글 종류를 선택하세요"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {POST_TYPES.map((type) => {
          const isRecommended = recommendedCategories.includes(type.category);
          return (
            <button
              key={type.category}
              type="button"
              onClick={() => onSelect(type)}
              className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border bg-theme-surface hover:border-theme-primary/50 hover:bg-theme-surface-2 transition-all text-left group ${
                isRecommended ? "border-theme-primary/30" : "border-theme-border"
              }`}
            >
              {isRecommended && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded-full">
                  추천
                </span>
              )}
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
          );
        })}
      </div>
    </div>
  );
}

/* ─── 이미지 업로더 ──────────────────────────────────────────── */

type ImageUploadState =
  | { status: "idle" }
  | { status: "preview"; file: File; previewUrl: string }
  | { status: "uploading"; previewUrl: string }
  | { status: "done"; previewUrl: string; url: string }
  | { status: "error"; previewUrl?: string; message: string };

function ImageUploader({
  onUrl,
}: {
  onUrl: (url: string | null) => void;
}) {
  const [state, setState] = useState<ImageUploadState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setState({ status: "error", message: "JPG, PNG, WEBP 파일만 업로드 가능합니다." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setState({ status: "error", message: "파일 크기는 5MB 이하여야 합니다." });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setState({ status: "preview", file, previewUrl });
    onUrl(null); // clear previous uploaded url
  }

  async function handleUpload() {
    if (state.status !== "preview") return;
    const { file, previewUrl } = state;
    setState({ status: "uploading", previewUrl });

    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadPostImageAction(fd);

    if ("error" in result) {
      setState({ status: "error", previewUrl, message: result.error });
      onUrl(null);
    } else {
      setState({ status: "done", previewUrl, url: result.url });
      onUrl(result.url);
    }
  }

  function handleRemove() {
    if (state.status === "preview" || state.status === "done" || state.status === "uploading" || state.status === "error") {
      if ("previewUrl" in state && state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    }
    setState({ status: "idle" });
    onUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-[12px] font-medium text-theme-muted mb-1">
        사진 첨부 <span className="font-normal">(선택, JPG·PNG·WEBP, 최대 5MB)</span>
      </label>

      {state.status === "idle" && (
        <label className="flex items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-theme-border bg-theme-surface cursor-pointer hover:border-theme-primary/40 hover:bg-theme-surface-2 transition-all text-[13px] text-theme-muted">
          <span aria-hidden>🖼️</span>
          사진 선택
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}

      {(state.status === "preview" || state.status === "uploading" || state.status === "done" || (state.status === "error" && state.previewUrl)) && (
        <div className="relative rounded-xl overflow-hidden border border-theme-border bg-black">
          <div className="relative w-full aspect-video">
            <Image
              src={"previewUrl" in state ? state.previewUrl! : ""}
              alt="미리보기"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* 상태 오버레이 */}
          {state.status === "uploading" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white text-[13px] font-medium">업로드 중…</p>
            </div>
          )}
          {state.status === "done" && (
            <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
              ✓ 업로드 완료
            </div>
          )}
          {state.status === "error" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center px-4">
              <p className="text-red-400 text-[13px] text-center">{state.message}</p>
            </div>
          )}

          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 text-[14px] leading-none"
            aria-label="사진 제거"
          >
            ✕
          </button>
        </div>
      )}

      {state.status === "error" && !state.previewUrl && (
        <p className="mt-1 text-[12px] text-red-500">{state.message}</p>
      )}

      {state.status === "preview" && (
        <button
          type="button"
          onClick={handleUpload}
          className="mt-2 w-full py-2 rounded-lg bg-theme-primary/10 text-theme-primary text-[13px] font-medium hover:bg-theme-primary/20 transition-colors"
        >
          사진 업로드
        </button>
      )}

      {state.status === "error" && state.previewUrl && (
        <button
          type="button"
          onClick={handleUpload}
          className="mt-2 w-full py-2 rounded-lg bg-theme-primary/10 text-theme-primary text-[13px] font-medium hover:bg-theme-primary/20 transition-colors"
        >
          다시 시도
        </button>
      )}
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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeWarning, setYoutubeWarning] = useState(false);
  const [tags, setTags] = useState(initialTag);
  const [requestType, setRequestType] = useState<string>("");
  const [missionCountry, setMissionCountry] = useState<string>("");
  const [cellTopicSlug, setCellTopicSlug] = useState<string>(() => {
    if (postType.showCellTopic && initialTag) {
      const match = CELL_TOPICS.find((t) => t.tags.includes(initialTag));
      return match?.slug ?? "";
    }
    return "";
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postType.showYoutubeUrl) return;
    const isYouTube = /youtube\.com|youtu\.be/i.test(youtubeUrl);
    setYoutubeWarning(youtubeUrl.trim().length > 0 && !isYouTube);
  }, [youtubeUrl, postType.showYoutubeUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (postType.showRequestType && !requestType) {
      setError("요청 유형을 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const extraTags: string[] = [];
    if (requestType) extraTags.push(requestType);
    if (missionCountry) {
      const country = MISSION_COUNTRIES.find((c) => c.code === missionCountry);
      if (country) extraTags.push(country.tags[0]);
    }
    if (cellTopicSlug) {
      const topic = CELL_TOPICS.find((t) => t.slug === cellTopicSlug);
      if (topic) extraTags.push(topic.tags[0]);
    }
    const userTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const allTags = [...new Set([...extraTags, ...userTags])].slice(0, 5);

    const result = await composePostAction({
      title: title.trim() || undefined,
      content,
      category: postType.category,
      visibility: "MEMBERS",
      tags: allTags,
      youtubeUrl: youtubeUrl.trim() || undefined,
      mediaUrls: imageUrl ? [imageUrl] : [],
    });

    setSubmitting(false);
    if (result.ok) {
      router.push(getRedirectPath(postType.category, result.postId, cellTopicSlug || undefined));
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
        {/* 요청 유형 (REQUEST) */}
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

        {/* 국가 선택 (MISSION) */}
        {postType.showMissionCountry && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-1">
              선교 국가
            </label>
            <select
              value={missionCountry}
              onChange={(e) => setMissionCountry(e.target.value)}
              className="w-full text-[14px] border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
            >
              <option value="">국가 선택 (선택사항)</option>
              {MISSION_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 셀 토픽 (CELL) */}
        {postType.showCellTopic && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-1">
              토픽 연결
            </label>
            <div className="flex flex-wrap gap-2">
              {CELL_TOPICS.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setCellTopicSlug(cellTopicSlug === t.slug ? "" : t.slug)}
                  className={`text-[13px] px-3 py-1.5 rounded-full border transition-all ${
                    cellTopicSlug === t.slug
                      ? "bg-theme-primary/10 border-theme-primary/40 text-theme-primary font-medium"
                      : "bg-theme-surface border-theme-border text-theme-muted hover:border-theme-primary/30"
                  }`}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 유튜브 URL (CONTENT) */}
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
            {youtubeWarning && (
              <p className="mt-1 text-[12px] text-amber-600">
                유튜브 링크가 아닐 수 있어요. 계속 진행하셔도 됩니다.
              </p>
            )}
          </div>
        )}

        {/* 제목 (선택) */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 (선택사항)"
            maxLength={100}
            className="w-full text-[15px] font-medium border-0 border-b border-theme-border px-0 py-2 bg-transparent text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-theme-primary"
          />
        </div>

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

        {/* 사진 업로드 (GENERAL, CELL, CONTENT) */}
        {postType.showImageUpload && (
          <ImageUploader onUrl={setImageUrl} />
        )}

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
