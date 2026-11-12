"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "@/lib/entries-client";
import {
  METHOD_LABEL,
  PROPOSAL_LIMITS,
  formatSeoul,
  proposalErrorText,
  seoulLocalToUtc,
  seoulToday,
  validateProposalFields,
  type ProposalMethod,
} from "@/lib/proposal-rules";
import { sendProposal } from "@/lib/proposals-client";

type Step = "form" | "review" | "sending" | "done";

/**
 * Call / meeting / meeting with someone else (room 7). Every field is optional. Time is Korea time.
 * The proposal stays 제안 중 until the son answers; nothing is confirmed or sent outside the app.
 */
export function ProposalForm({
  method,
  heading: title,
  grant,
  onClose,
}: {
  method: ProposalMethod;
  heading: string;
  grant: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [companion, setCompanion] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const fields = { date, time, location: method === "call" ? "" : location, companion, message };
  const when = date && time ? seoulLocalToUtc(date, time) : null;
  const inputCls = "mt-2 w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 font-normal text-text";

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

  async function send() {
    setStep("sending");
    try {
      await sendProposal({ method, ...fields }, grant);
      setStep("done");
    } catch (e) {
      setError(proposalErrorText(e instanceof ApiError ? e.code : "network"));
      setStep("review");
    }
  }

  if (step === "sending") {
    return (
      <section className="flex flex-1 flex-col">
        {h1("보내는 중이에요")}
        <p role="status">잠시만 기다려 주세요…</p>
      </section>
    );
  }

  if (step === "done") {
    return (
      <section className="flex flex-1 flex-col">
        {h1("제안을 남겼어요")}
        <div className="prose-warm" role="status">
          <p>아들이 수락하기 전까지는 ‘제안 중’이에요.</p>
          <p>약속이 저절로 정해지거나 문자가 가지 않아요. ‘내가 적은 글’에서 확인하고 취소할 수 있어요.</p>
        </div>
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            앞 화면으로
          </button>
          <Link href="/notes" className="btn btn-secondary">
            내 제안 보기
          </Link>
        </div>
      </section>
    );
  }

  if (step === "review") {
    const rows: [string, string][] = [
      ["방법", METHOD_LABEL[method]],
      ["희망 일시", when ? `${formatSeoul(when)} (한국 시간)` : "정하지 않음"],
      ...(method !== "call" ? ([["장소", location.trim() || "정하지 않음"]] as [string, string][]) : []),
      ["함께할 분", companion.trim() || "없음"],
      ["하고 싶은 말", message.trim() || "없음"],
    ];
    return (
      <section className="flex flex-1 flex-col">
        {h1("이렇게 제안할까요?")}
        <dl className="panel grid gap-3">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="font-bold text-btn">{k}</dt>
              <dd className="whitespace-pre-wrap">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4">보내면 아들이 볼 수 있어요. 아들이 수락하기 전까지는 ‘제안 중’이고, 언제든 취소할 수 있어요.</p>
        {errorBox}
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-primary" onClick={() => void send()}>
            네, 제안할게요
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setStep("form")}>
            고치기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col">
      {h1(title)}
      <p className="mb-6">모두 적지 않으셔도 괜찮아요. 시간은 한국 시간이에요.</p>
      <form
        noValidate
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          const v = validateProposalFields(fields);
          if (!v.ok) return setError(proposalErrorText(v.error));
          setError(null);
          setStep("review");
        }}
      >
        <fieldset className="grid gap-3">
          <legend className="mb-2 font-bold">희망 날짜와 시간 (선택)</legend>
          <label htmlFor={`${id}-d`} className="font-bold">
            날짜
            <input id={`${id}-d`} type="date" min={seoulToday()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </label>
          <label htmlFor={`${id}-t`} className="font-bold">
            시간
            <input id={`${id}-t`} type="time" step={600} value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </label>
        </fieldset>
        {method !== "call" && (
          <label htmlFor={`${id}-l`} className="font-bold">
            장소 (선택)
            <input id={`${id}-l`} type="text" maxLength={PROPOSAL_LIMITS.locationMax} value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          </label>
        )}
        <label htmlFor={`${id}-c`} className="font-bold">
          {method === "with_someone" ? "함께할 분 (선택, 예: 믿을 수 있는 친척)" : "함께할 분 (선택)"}
          <input id={`${id}-c`} type="text" maxLength={PROPOSAL_LIMITS.companionMax} value={companion} onChange={(e) => setCompanion(e.target.value)} className={inputCls} />
        </label>
        <label htmlFor={`${id}-m`} className="font-bold">
          아들에게 하고 싶은 말 (선택)
          <textarea id={`${id}-m`} rows={4} maxLength={PROPOSAL_LIMITS.messageMax} value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls} />
        </label>
        {errorBox}
        <div className="grid gap-3 pt-4">
          <button type="submit" className="btn btn-primary">
            다시 확인하기
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            제안하지 않고 돌아가기
          </button>
        </div>
      </form>
    </section>
  );
}
