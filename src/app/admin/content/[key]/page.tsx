import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Notice, Title } from "@/components/ui";
import { getEditableContent } from "@/content/rooms";
import { formatKoreanDate } from "@/lib/entry-rules";
import { joinParagraphs, type ContentJson } from "@/server/content-store";
import { requireAdmin } from "@/server/session";

const MESSAGES: Record<string, string> = {
  saved: "초안을 저장했어요. 아직 부모님께는 보이지 않아요.",
  published: "게시했어요. 이제 부모님 화면에 보여요.",
  unpublished: "게시를 내렸어요. 부모님 화면에는 “준비 중”으로 보여요.",
  reset: "처음 초안으로 되돌렸어요.",
  invalid: "글이 너무 길어서 저장하지 못했어요.",
};

function Preview({ c, headings }: { c: ContentJson; headings: string[] | null }) {
  const paras = (p: string[] | null) =>
    p ? p.map((x, i) => <p key={i}>{x}</p>) : <p className="text-muted">(비어 있음 → 부모님 화면: 준비 중)</p>;
  return (
    <div className="prose-warm">
      {headings
        ? c.sections?.map((s) => (
            <div key={s.heading}>
              <p className="font-bold text-btn">{s.heading}</p>
              {paras(s.paragraphs)}
            </div>
          ))
        : paras(c.body)}
    </div>
  );
}

/** Edit one letter/card. Plain HTML form (works without JavaScript); text is rendered as text, never HTML. */
export default async function AdminContentEditPage({ params, searchParams }: PageProps<"/admin/content/[key]">) {
  await requireAdmin();
  const key = decodeURIComponent((await params).key);
  const item = getEditableContent(key);
  if (!item) notFound();
  const msg = (await searchParams).m;
  const message = typeof msg === "string" ? MESSAGES[msg] : undefined;
  const area = "mt-2 w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 font-normal text-text";

  return (
    <AppShell backHref="/admin/content" backLabel="목록">
      <p className="mb-2 text-muted">{item.group}</p>
      <Title>{item.title}</Title>
      {message && <Notice tone={msg === "invalid" ? "error" : "info"}>{message}</Notice>}

      <p className="mt-4 font-bold text-btn">
        {item.published
          ? `게시됨${item.publishedAt ? ` (${formatKoreanDate(item.publishedAt)})` : " (코드에서 확정)"}`
          : "게시 전: 부모님께 보이지 않아요"}
      </p>
      {item.reviewNote && <p className="mt-2 text-muted">검토 메모: {item.reviewNote}</p>}

      <form action="/api/admin/content" method="post" className="mt-6 grid gap-5">
        <input type="hidden" name="key" value={item.key} />
        <p>문단 사이는 빈 줄 하나로 나눠요. 비워 두면 부모님 화면에 “준비 중”으로 보여요.</p>
        {item.headings ? (
          item.headings.map((h, i) => (
            <label key={h} className="font-bold">
              {h}
              <textarea
                name={`section_${i}`}
                rows={6}
                defaultValue={joinParagraphs(item.draft.sections?.[i]?.paragraphs ?? null)}
                className={area}
              />
            </label>
          ))
        ) : (
          <label className="font-bold">
            본문
            <textarea name="body" rows={12} defaultValue={joinParagraphs(item.draft.body)} className={area} />
          </label>
        )}
        <div className="grid gap-3">
          <button type="submit" name="action" value="save" className="btn btn-secondary">
            초안 저장 (부모님께 안 보임)
          </button>
          <button type="submit" name="action" value="publish" className="btn btn-primary">
            이 내용으로 게시하기
          </button>
          {item.published && (
            <button type="submit" name="action" value="unpublish" className="btn btn-secondary">
              게시 내리기
            </button>
          )}
          {item.source === "admin" && (
            <button type="submit" name="action" value="reset" className="btn btn-secondary">
              처음 초안으로 되돌리기
            </button>
          )}
        </div>
      </form>

      <section className="panel mt-8" aria-labelledby="pv">
        <h2 id="pv" className="mb-3 text-2xl font-bold">
          지금 부모님께 보이는 내용
        </h2>
        {item.published ? <Preview c={item.published} headings={item.headings} /> : <p>준비 중 (게시 전)</p>}
      </section>
    </AppShell>
  );
}
