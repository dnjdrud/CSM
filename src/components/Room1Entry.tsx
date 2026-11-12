"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ParentRole } from "@/lib/roles";
import { EntryComposer } from "./EntryComposer";

/** Room 1 opens without recording or consent. 내 마음 적기 -> EntryComposer. */
export function Room1Entry({ title, paragraphs, role }: { title: string; paragraphs: string[]; role: ParentRole }) {
  const [writing, setWriting] = useState(false);
  // New key per writing session so nothing from a previous draft is carried over.
  const [session, setSession] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  if (writing) {
    return (
      <EntryComposer
        key={session}
        roomId={1}
        role={role}
        heading="내 마음 적기"
        prompt={["마음을 바로 정리하지 않으셔도 괜찮아요. 떠오르는 대로 적어주세요."]}
        onClose={() => {
          setWriting(false);
          requestAnimationFrame(() => headingRef.current?.focus());
        }}
      />
    );
  }

  return (
    <section className="flex flex-1 flex-col">
      <p className="mb-2 text-muted">1번 방</p>
      <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-title font-bold outline-none">
        {title}
      </h1>
      <div className="prose-warm">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-auto grid gap-3 pt-10">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSession((n) => n + 1);
            setWriting(true);
          }}
        >
          내 마음 적기
        </button>
        <Link href="/notes" className="btn btn-secondary">
          내가 적은 글 보기
        </Link>
      </div>
    </section>
  );
}
