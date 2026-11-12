"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ENTRY_LIMITS, TITLE_OPTIONS, normalizeText, validatePlain } from "@/lib/entry-rules";
import { errorText, saveSealed, saveShared } from "@/lib/entries-client";
import { PARENT_LABEL, type ParentRole } from "@/lib/roles";
import { VaultPanel, useVaultKey } from "./VaultPanel";

export type Visibility = "keep" | "share";

export type ComposerInitial = {
  /** Existing entry being edited; absent for new writing with a suggested title. */
  id?: string;
  title: string;
  body: string;
  /** The existing choice. New writing always starts with no choice selected. */
  visibility: Visibility | null;
};

type Step =
  | { s: "write" }
  | { s: "review" }
  | { s: "confirmShare" }
  | { s: "vault"; then: "keep" | "draft" }
  | { s: "saving" }
  | { s: "done"; what: "keep" | "draft" | "share" };

const CUSTOM = "__custom__";
const NONE = "";

/**
 * Parents' own writing. The writer must explicitly pick 나만 간직하기 or 아들에게 전하기
 * (nothing is pre-selected). 나만 간직하기 and 초안 are encrypted in this tab with the
 * personal password; 아들에게 전하기 is sent only after a separate final confirmation.
 * Draft text lives only in this component's memory until saved.
 */
export function EntryComposer({
  roomId,
  role,
  heading,
  prompt,
  initial,
  onClose,
  closeLabel = "앞 화면으로",
  titleOptions,
  grant,
}: {
  roomId: number;
  role: ParentRole;
  heading: string;
  prompt: string[];
  initial?: ComposerInitial;
  onClose: () => void;
  closeLabel?: string;
  /** Rooms 4-7 pass their suggestions from the gated room body. */
  titleOptions?: string[];
  /** Rooms 4-7: this visit's entry grant (the server requires it to create writing there). */
  grant?: string;
}) {
  const options = titleOptions ?? TITLE_OPTIONS[roomId] ?? [];
  const initialTitleChoice = initial?.title ? (options.includes(initial.title) ? initial.title : CUSTOM) : NONE;
  const [titleChoice, setTitleChoice] = useState<string>(initialTitleChoice);
  const [customTitle, setCustomTitle] = useState(initialTitleChoice === CUSTOM ? (initial?.title ?? "") : "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [visibility, setVisibility] = useState<Visibility | null>(initial?.visibility ?? null);
  const [step, setStep] = useState<Step>({ s: "write" });
  const [error, setError] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | undefined>(initial?.id);
  const key = useVaultKey();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const other = PARENT_LABEL[role === "mother" ? "father" : "mother"];

  useEffect(() => {
    headingRef.current?.focus();
  }, [step.s]);

  const title = normalizeText(titleChoice === CUSTOM ? customTitle : titleChoice);
  const bodyLen = [...body].length;

  function check(needChoice: boolean): boolean {
    const v = validatePlain(title, body);
    if (v === "body_required") return setError("내용을 적어주세요."), false;
    if (v !== "ok") return setError(errorText({ code: v })), false;
    if (needChoice && !visibility) return setError("‘나만 간직하기’와 ‘아들에게 전하기’ 중 하나를 골라주세요."), false;
    setError(null);
    return true;
  }

  // One save at a time: repeated taps or a late VaultPanel callback cannot start a second save.
  const saving = useRef(false);

  async function sealAndSave(k: CryptoKey, intent: "keep" | "draft") {
    if (saving.current) return;
    saving.current = true;
    setStep({ s: "saving" });
    try {
      const { entry } = await saveSealed(k, roomId, { v: 1, title, body: normalizeText(body), intent }, entryId, grant);
      setEntryId(entry.id);
      setBody("");
      setStep({ s: "done", what: intent });
    } catch (e) {
      setError(errorText(e instanceof Error && e.name === "OperationError" ? { code: "encrypt_failed" } : e));
      setStep({ s: intent === "draft" ? "write" : "review" });
    } finally {
      saving.current = false;
    }
  }

  function startSealed(intent: "keep" | "draft") {
    if (key) void sealAndSave(key, intent);
    else setStep({ s: "vault", then: intent });
  }

  async function share() {
    if (saving.current) return;
    saving.current = true;
    setStep({ s: "saving" });
    try {
      const { entry } = await saveShared(roomId, title, normalizeText(body), entryId, grant);
      setEntryId(entry.id);
      setBody("");
      setStep({ s: "done", what: "share" });
    } catch (e) {
      setError(errorText(e));
      setStep({ s: "review" });
    } finally {
      saving.current = false;
    }
  }

  const h1 = (t: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-title font-bold outline-none">
      {t}
    </h1>
  );
  const errorBox = error && (
    <p role="alert" className="mt-4 rounded-2xl bg-error-bg p-4 text-error">
      {error}
    </p>
  );

  if (step.s === "vault") {
    return (
      <VaultPanel
        onReady={(k) => void sealAndSave(k, step.then)}
        onCancel={() => setStep({ s: step.then === "draft" ? "write" : "review" })}
        cancelLabel="저장하지 않고 돌아가기"
      />
    );
  }

  if (step.s === "saving") {
    return (
      <section className="flex flex-1 flex-col">
        {h1("저장하는 중이에요")}
        <p role="status">잠시만 기다려 주세요…</p>
      </section>
    );
  }

  if (step.s === "done") {
    const msg = {
      keep: ["나만 간직하는 글로 저장했어요.", "개인 비밀번호로 잠겨 있어서 아들도, 다른 부모님도 읽을 수 없어요."],
      draft: ["초안으로 두었어요.", "개인 비밀번호로 잠가 두었어요. 아직 아무에게도 전해지지 않았어요."],
      share: ["아들에게 전했어요.", `아들이 준비되었을 때 읽을 거예요. ${other}는 볼 수 없어요.`],
    }[step.what];
    return (
      <section className="flex flex-1 flex-col">
        {h1(msg[0])}
        <p role="status">{msg[1]}</p>
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {closeLabel}
          </button>
          <Link href="/notes" className="btn btn-secondary">
            내가 적은 글 보기
          </Link>
        </div>
      </section>
    );
  }

  if (step.s === "confirmShare") {
    return (
      <section className="flex flex-1 flex-col">
        {h1("아들에게 전할까요?")}
        <div className="prose-warm panel">
          <p>전하면 아들이 이 글을 읽을 수 있어요. {other}는 볼 수 없어요.</p>
          <p>전한 뒤에도 고치거나 지울 수 있지만, 그 전에 아들이 이미 읽었을 수도 있어요.</p>
          <p>아들이 언제 읽었는지는 기록하지 않아요.</p>
        </div>
        {errorBox}
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-primary" onClick={() => void share()}>
            네, 아들에게 전할게요
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setStep({ s: "review" })}>
            아직 전하지 않을게요
          </button>
        </div>
      </section>
    );
  }

  if (step.s === "review") {
    return (
      <section className="flex flex-1 flex-col">
        <p className="mb-2 text-muted">다시 읽기</p>
        {h1("이렇게 적으셨어요")}
        <article className="panel">
          {title && <p className="mb-3 text-2xl font-bold">{title}</p>}
          {/* Rendered as text (never HTML). */}
          <p className="whitespace-pre-wrap">{normalizeText(body)}</p>
        </article>
        <p className="mt-4 font-bold">
          {visibility === "keep" ? "나만 간직하기: 개인 비밀번호로 잠가서 저장해요." : "아들에게 전하기: 한 번 더 확인한 뒤에 전해요."}
        </p>
        {errorBox}
        <div className="mt-auto grid gap-3 pt-10">
          {visibility === "keep" ? (
            <button type="button" className="btn btn-primary" onClick={() => startSealed("keep")}>
              나만 간직하기로 저장하기
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setStep({ s: "confirmShare" })}>
              아들에게 전하기
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setStep({ s: "write" })}>
            고쳐 쓰기
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => startSealed("draft")}>
            초안으로 두기
          </button>
        </div>
      </section>
    );
  }

  // ---- write ----
  const radioCls =
    "flex min-h-[3.75rem] cursor-pointer items-start gap-3 rounded-2xl border-2 border-line p-4 has-[:checked]:border-btn has-[:checked]:bg-surface-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus";
  const radio = "mt-1.5 h-6 w-6 shrink-0 accent-[var(--color-btn)]";

  return (
    <section className="flex flex-1 flex-col">
      {h1(heading)}
      <div className="prose-warm mb-6">
        {prompt.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {grant && (
        <p className="mb-6 rounded-2xl bg-surface p-4 text-muted">
          다른 앱으로 넘어가거나 화면이 꺼지면 방에서 나가게 되고, 저장하지 않은 글은 사라져요.
        </p>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (check(true)) setStep({ s: "review" });
        }}
        className="grid gap-6"
      >
        <fieldset className="grid gap-3">
          <legend className="mb-2 font-bold">제목 (고르지 않으셔도 돼요)</legend>
          {[NONE, ...options, CUSTOM].map((o) => (
            <label key={o || "none"} className={radioCls}>
              <input type="radio" name={`${id}-title`} className={radio} checked={titleChoice === o} onChange={() => setTitleChoice(o)} />
              <span>{o === NONE ? "제목 없이" : o === CUSTOM ? "직접 적기" : o}</span>
            </label>
          ))}
          {titleChoice === CUSTOM && (
            <label htmlFor={`${id}-ct`} className="font-bold">
              제목
              <input
                id={`${id}-ct`}
                type="text"
                maxLength={ENTRY_LIMITS.titleMax}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="mt-2 w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-text"
              />
            </label>
          )}
        </fieldset>

        <label htmlFor={`${id}-body`} className="font-bold">
          내용 (꼭 적어주세요)
          <textarea
            id={`${id}-body`}
            rows={8}
            required
            aria-describedby={`${id}-count`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-2 w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 font-normal text-text"
          />
          <span id={`${id}-count`} className="mt-1 block text-right text-lg font-normal text-muted">
            {bodyLen} / {ENTRY_LIMITS.bodyMax}자
          </span>
        </label>

        <fieldset className="grid gap-3">
          <legend className="mb-2 font-bold">이 글을 어떻게 할까요? (하나를 골라주세요)</legend>
          <label className={radioCls}>
            <input type="radio" name={`${id}-vis`} className={radio} checked={visibility === "keep"} onChange={() => setVisibility("keep")} />
            <span>
              <span className="block font-bold">나만 간직하기</span>
              <span className="block text-muted">개인 비밀번호로 잠가서 저장해요. 아들도, {other}도 읽을 수 없어요.</span>
            </span>
          </label>
          <label className={radioCls}>
            <input type="radio" name={`${id}-vis`} className={radio} checked={visibility === "share"} onChange={() => setVisibility("share")} />
            <span>
              <span className="block font-bold">아들에게 전하기</span>
              <span className="block text-muted">마지막으로 한 번 더 확인한 뒤에 전해져요. {other}는 볼 수 없어요.</span>
            </span>
          </label>
        </fieldset>

        {errorBox}

        <div className="grid gap-3 pt-4">
          <button type="submit" className="btn btn-primary">
            다시 읽기
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (check(false)) startSealed("draft");
            }}
          >
            초안으로 두기
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {initial?.id ? "고치지 않고 돌아가기" : "쓰지 않고 돌아가기"}
          </button>
        </div>
      </form>
    </section>
  );
}
