"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { composePostAction } from "../actions";
import { uploadPostImageAction } from "../uploadImageAction";
import type { PostCategory } from "@/lib/domain/types";
import { MISSION_COUNTRIES } from "@/lib/mission/countries";
import { CELL_TOPICS } from "@/lib/cells/topics";
import { useT } from "@/lib/i18n";

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

function getRedirectPath(category: PostCategory, postId: string, cellTopic?: string): string {
  switch (category) {
    case "CONTENT":   return "/contents";
    case "CELL":      return cellTopic ? `/cells/topics/${cellTopic}` : "/cells";
    case "MISSION":   return "/mission";
    case "REQUEST":   return "/contents?tab=request";
    default:          return `/post/${postId}`;
  }
}

export default function WritePageClient({
  recommendedCategories = [],
  writeHint,
  stripeAccountEnabled = false,
}: {
  recommendedCategories?: PostCategory[];
  writeHint?: string;
  stripeAccountEnabled?: boolean;
}) {
  const t = useT();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<PostType | null>(null);
  const [initialTag, setInitialTag] = useState("");

  const POST_TYPES: PostType[] = [
    { category: "GENERAL", label: t.write.postTypes.general.label, icon: "✏️", description: t.write.postTypes.general.description, placeholder: t.write.postTypes.general.placeholder, showImageUpload: true },
    { category: "CELL", label: t.write.postTypes.cell.label, icon: "💬", description: t.write.postTypes.cell.description, placeholder: t.write.postTypes.cell.placeholder, showCellTopic: true, showImageUpload: true },
    { category: "CONTENT", label: t.write.postTypes.content.label, icon: "🎬", description: t.write.postTypes.content.description, placeholder: t.write.postTypes.content.placeholder, showYoutubeUrl: true, showImageUpload: true },
    { category: "MISSION", label: t.write.postTypes.mission.label, icon: "🌍", description: t.write.postTypes.mission.description, placeholder: t.write.postTypes.mission.placeholder, showMissionCountry: true, showYoutubeUrl: true, showImageUpload: true },
    { category: "TESTIMONY", label: t.write.postTypes.testimony.label, icon: "✨", description: t.write.postTypes.testimony.description, placeholder: t.write.postTypes.testimony.placeholder },
    { category: "REQUEST", label: t.write.postTypes.request.label, icon: "📬", description: t.write.postTypes.request.description, placeholder: t.write.postTypes.request.placeholder, showRequestType: true },
  ];

  const REQUEST_TYPE_OPTIONS = [
    { value: "촬영", label: t.write.requestTypes.shooting },
    { value: "편집", label: t.write.requestTypes.editing },
    { value: "기획", label: t.write.requestTypes.planning },
    { value: "교육", label: t.write.requestTypes.education },
    { value: "협업", label: t.write.requestTypes.collaboration },
  ] as const;

  useEffect(() => {
    const categoryParam = searchParams.get("category") as PostCategory | null;
    const tagParam = searchParams.get("tag") ?? "";
    if (categoryParam) {
      const match = POST_TYPES.find((tp) => tp.category === categoryParam);
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
        requestTypeOptions={REQUEST_TYPE_OPTIONS}
        stripeAccountEnabled={stripeAccountEnabled}
        onBack={() => { setSelected(null); setInitialTag(""); }}
      />
    );
  }

  return (
    <TypePicker
      postTypes={POST_TYPES}
      onSelect={(tp) => { setInitialTag(""); setSelected(tp); }}
      recommendedCategories={recommendedCategories}
      writeHint={writeHint}
    />
  );
}

function TypePicker({
  postTypes,
  onSelect,
  recommendedCategories = [],
  writeHint,
}: {
  postTypes: PostType[];
  onSelect: (t: PostType) => void;
  recommendedCategories?: PostCategory[];
  writeHint?: string;
}) {
  const t = useT();
  return (
    <div className="px-4 py-6">
      <h1 className="text-[18px] font-semibold text-theme-text mb-1">
        {t.write.typePickerTitle}
      </h1>
      <p className="text-[13px] text-theme-muted mb-5">
        {writeHint ?? t.write.typePickerDesc}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {postTypes.map((type) => {
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
                  {t.write.recommended}
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

type ImageUploadState =
  | { status: "idle" }
  | { status: "preview"; file: File; previewUrl: string }
  | { status: "uploading"; previewUrl: string }
  | { status: "done"; previewUrl: string; url: string }
  | { status: "error"; previewUrl?: string; message: string };

function ImageUploader({ onUrl, onUploading }: { onUrl: (url: string | null) => void; onUploading?: (v: boolean) => void }) {
  const t = useT();
  const [state, setState] = useState<ImageUploadState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    setState({ status: "uploading", previewUrl });
    onUrl(null);
    onUploading?.(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadPostImageAction(fd);
    onUploading?.(false);
    if ("error" in result) {
      setState({ status: "error", previewUrl, message: result.error });
      onUrl(null);
    } else {
      setState({ status: "done", previewUrl, url: result.url });
      onUrl(result.url);
    }
  }

  async function handleRetry() {
    if (state.status !== "error" || !("previewUrl" in state) || !state.previewUrl) return;
    const previewUrl = state.previewUrl;
    setState({ status: "uploading", previewUrl });
    onUploading?.(true);
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadPostImageAction(fd);
    onUploading?.(false);
    if ("error" in result) {
      setState({ status: "error", previewUrl, message: result.error });
      onUrl(null);
    } else {
      setState({ status: "done", previewUrl, url: result.url });
      onUrl(result.url);
    }
  }

  function handleRemove() {
    if ((state.status === "preview" || state.status === "done" || state.status === "uploading" || state.status === "error") && "previewUrl" in state && state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({ status: "idle" });
    onUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-[12px] font-medium text-theme-muted mb-1">
        {t.write.imageAttach} <span className="font-normal">{t.write.imageAttachDesc}</span>
      </label>

      {state.status === "idle" && (
        <label className="flex items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-theme-border bg-theme-surface cursor-pointer hover:border-theme-primary/40 hover:bg-theme-surface-2 transition-all text-[13px] text-theme-muted">
          <span aria-hidden>🖼️</span>
          {t.write.selectPhoto}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} />
        </label>
      )}

      {(state.status === "preview" || state.status === "uploading" || state.status === "done" || (state.status === "error" && state.previewUrl)) && (
        <div className="relative rounded-xl overflow-hidden border border-theme-border bg-black">
          <div className="relative w-full aspect-video">
            <Image src={"previewUrl" in state ? state.previewUrl! : ""} alt={t.write.previewAlt} fill className="object-contain" unoptimized />
          </div>
          {state.status === "uploading" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white text-[13px] font-medium">{t.write.uploading}</p>
            </div>
          )}
          {state.status === "done" && (
            <div className="absolute top-2 left-2 bg-theme-success/90 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
              {t.write.uploadDone}
            </div>
          )}
          {state.status === "error" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center px-4">
              <p className="text-theme-danger text-[13px] text-center">{state.message}</p>
            </div>
          )}
          <button type="button" onClick={handleRemove} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 text-[14px] leading-none" aria-label={t.write.removePhoto}>
            ✕
          </button>
        </div>
      )}

      {state.status === "error" && !state.previewUrl && (
        <p className="mt-1 text-[12px] text-theme-danger">{state.message}</p>
      )}
      {state.status === "error" && state.previewUrl && (
        <button type="button" onClick={handleRetry} className="mt-2 w-full py-2 rounded-lg bg-theme-primary/10 text-theme-primary text-[13px] font-medium hover:bg-theme-primary/20 transition-colors">
          {t.write.retry}
        </button>
      )}
    </div>
  );
}

function ComposeForm({
  postType,
  initialTag = "",
  requestTypeOptions,
  stripeAccountEnabled = false,
  onBack,
}: {
  postType: PostType;
  initialTag?: string;
  requestTypeOptions: readonly { value: string; label: string }[];
  stripeAccountEnabled?: boolean;
  onBack: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeWarning, setYoutubeWarning] = useState(false);
  const [tags, setTags] = useState(initialTag);
  const [requestType, setRequestType] = useState<string>("");
  const [missionCountry, setMissionCountry] = useState<string>("");
  const [cellTopicSlug, setCellTopicSlug] = useState<string>(() => {
    if (postType.showCellTopic && initialTag) {
      const match = CELL_TOPICS.find((tp) => tp.tags.includes(initialTag));
      return match?.slug ?? "";
    }
    return "";
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [subscribersOnly, setSubscribersOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postType.showYoutubeUrl) return;
    const isYouTube = /youtube\.com|youtu\.be/i.test(youtubeUrl);
    setYoutubeWarning(youtubeUrl.trim().length > 0 && !isYouTube);
  }, [youtubeUrl, postType.showYoutubeUrl]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;
    if (postType.showRequestType && !requestType) {
      setError(t.write.requestTypeRequired);
      return;
    }
    if (postType.showMissionCountry && !missionCountry) {
      setError("선교 국가는 필수 선택 항목입니다.");
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
      const topic = CELL_TOPICS.find((tp) => tp.slug === cellTopicSlug);
      if (topic) extraTags.push(topic.tags[0]);
    }
    const userTags = tags.split(",").map((tg) => tg.trim()).filter(Boolean);
    const allTags = [...new Set([...extraTags, ...userTags])].slice(0, 5);

    const result = await composePostAction({
      content,
      category: postType.category,
      visibility: "MEMBERS",
      tags: allTags,
      youtubeUrl: youtubeUrl.trim() || undefined,
      mediaUrls: imageUrl ? [imageUrl] : [],
      subscribersOnly,
    });

    setSubmitting(false);
    if (result.ok) {
      router.push(getRedirectPath(postType.category, result.postId, cellTopicSlug || undefined));
    } else {
      setError(result.error ?? t.common.error);
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <button type="button" onClick={onBack} className="text-[13px] text-theme-muted hover:text-theme-text">
          {t.write.back}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{postType.icon}</span>
          <span className="text-[15px] font-semibold text-theme-text">{postType.label}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {postType.showRequestType && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-2">
              {t.write.requestTypeLabel} <span className="font-normal text-theme-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {requestTypeOptions.map((opt) => (
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

        {postType.showMissionCountry && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-1">
              {t.write.missionCountryLabel} <span className="font-normal text-theme-danger">*</span>
            </label>
            <select
              value={missionCountry}
              onChange={(e) => setMissionCountry(e.target.value)}
              className="w-full text-[14px] border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
            >
              <option value="">{t.write.missionCountryDefault}</option>
              {MISSION_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
        )}

        {postType.showCellTopic && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-1">
              {t.write.cellTopicLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {CELL_TOPICS.map((tp) => (
                <button
                  key={tp.slug}
                  type="button"
                  onClick={() => setCellTopicSlug(cellTopicSlug === tp.slug ? "" : tp.slug)}
                  className={`text-[13px] px-3 py-1.5 rounded-full border transition-all ${
                    cellTopicSlug === tp.slug
                      ? "bg-theme-primary/10 border-theme-primary/40 text-theme-primary font-medium"
                      : "bg-theme-surface border-theme-border text-theme-muted hover:border-theme-primary/30"
                  }`}
                >
                  {tp.icon} {tp.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {postType.showYoutubeUrl && (
          <div>
            <label className="block text-[12px] font-medium text-theme-muted mb-1">
              {t.write.youtubeLinkLabel}
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full text-[14px] border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
            />
            {youtubeWarning && (
              <p className="mt-1 text-[12px] text-theme-warning">{t.write.youtubeLinkWarning}</p>
            )}
          </div>
        )}

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

        {postType.showImageUpload && <ImageUploader onUrl={setImageUrl} onUploading={setImageUploading} />}

        <div>
          <label className="block text-[12px] font-medium text-theme-muted mb-1">
            {t.write.tagLabel} <span className="font-normal">{t.write.tagDesc}</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t.write.tagPlaceholder}
            className="w-full text-[14px] border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
          />
        </div>

        {stripeAccountEnabled && (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              role="switch"
              aria-checked={subscribersOnly}
              onClick={() => setSubscribersOnly((v) => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                subscribersOnly ? "bg-theme-primary" : "bg-theme-border"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-theme-text shadow transition-transform duration-200 ${
                  subscribersOnly ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-[13px] text-theme-text">
              구독자 전용
              {subscribersOnly && (
                <span className="ml-1.5 text-[11px] text-theme-primary font-medium">
                  (유료 구독자만 열람 가능)
                </span>
              )}
            </span>
          </label>
        )}

        {error && (
          <p className="text-[13px] text-theme-danger" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || imageUploading || !content.trim()}
          className="w-full py-3 rounded-xl text-[15px] font-semibold bg-theme-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? t.write.publishing : imageUploading ? "사진 업로드 중…" : t.write.publish}
        </button>
      </form>
    </div>
  );
}
