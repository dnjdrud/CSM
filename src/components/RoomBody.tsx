"use client";

import { useEffect, useRef, useState } from "react";
import type { BodyAction, ConversationMethod, RoomBodyView } from "@/content/types";
import type { ParentRole } from "@/lib/roles";
import { EntryComposer } from "./EntryComposer";
import { ProposalForm } from "./ProposalForm";

type Mode =
  | { m: "list" }
  | { m: "card"; id: string }
  | { m: "write"; heading: string; title: string }
  | { m: "dismissed"; message: string }
  | { m: "propose"; method: "call" | "meet" | "with_someone"; label: string };

/**
 * Room body after the gate. Moving between cards, writing, or proposing a
 * conversation is in-app navigation, not a re-entry. Reading every card is never
 * required and nothing is tracked.
 */
export function RoomBody({
  room,
  grant,
  role,
  onRoomsList,
}: {
  room: RoomBodyView;
  /** This visit's entry grant; in-room server actions (writing, proposals) must carry it. */
  grant: string;
  role: ParentRole;
  onRoomsList: () => void;
}) {
  const [mode, setMode] = useState<Mode>({ m: "list" });
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [mode]);

  const toList = () => setMode({ m: "list" });
  const h1 = (t: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-title font-bold outline-none">
      {t}
    </h1>
  );
  const roomsButton = (
    <button type="button" className="btn btn-secondary" onClick={onRoomsList}>
      방 목록으로
    </button>
  );

  if (mode.m === "write") {
    return (
      <EntryComposer
        roomId={room.id}
        role={role}
        heading={mode.heading}
        prompt={[room.actions?.question ?? (room.id === 7 ? "아들에게 하고 싶은 말을 적어주세요." : "")].filter(Boolean)}
        initial={{ title: mode.title, body: "", visibility: null }}
        titleOptions={room.actions?.titleOptions ?? room.conversation?.titleOptions ?? []}
        closeLabel="방으로 돌아가기"
        grant={grant}
        onClose={toList}
      />
    );
  }

  if (mode.m === "propose") return <ProposalForm method={mode.method} heading={mode.label} grant={grant} onClose={toList} />;

  if (mode.m === "dismissed") {
    return (
      <section className="flex flex-1 flex-col">
        <p className="mb-2 text-muted">
          {room.id}번 방 · {room.title}
        </p>
        {h1(mode.message)}
        <p>아무것도 기록하지 않았어요. 언제든 다시 오셔도 돼요.</p>
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-primary" onClick={toList}>
            방으로 돌아가기
          </button>
          {roomsButton}
        </div>
      </section>
    );
  }

  const card = mode.m === "card" ? room.cards.find((c) => c.id === mode.id) : undefined;
  if (card) {
    return (
      <section className="flex flex-1 flex-col">
        <p className="mb-2 text-muted">
          {room.id}번 방 · {room.title}
        </p>
        {h1(card.title)}
        {card.body || card.sections ? (
          <div className="grid gap-4">
            {card.body && (
              <article className="panel prose-warm">
                {card.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </article>
            )}
            {card.sections?.map((s) => (
              <section key={s.heading} className="panel" aria-label={s.heading}>
                <h2 className="mb-3 text-2xl font-bold text-btn">{s.heading}</h2>
                {s.paragraphs ? (
                  <div className="prose-warm">
                    {s.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ) : (
                  // No record yet: say so plainly instead of filling in goals as results.
                  <p className="text-muted">아직 준비 중이에요. 확인된 기록이 생기면 있는 그대로 적을게요.</p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <article className="panel">
            <p>아들이 이 이야기를 준비하고 있어요.</p>
          </article>
        )}
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-primary" onClick={toList}>
            다른 이야기 보기
          </button>
          {roomsButton}
        </div>
      </section>
    );
  }

  const onAction = (a: BodyAction) =>
    a.kind === "write" ? setMode({ m: "write", heading: a.heading, title: a.title }) : setMode({ m: "dismissed", message: a.message });

  const onMethod = (method: ConversationMethod, label: string) => {
    if (method === "write") setMode({ m: "write", heading: label, title: "" });
    else if (method === "more_time") setMode({ m: "dismissed", message: "괜찮아요. 시간이 더 필요하시면 기다릴게요." });
    else setMode({ m: "propose", method, label });
  };

  return (
    <section className="flex flex-1 flex-col">
      <p className="mb-2 text-muted">{room.id}번 방</p>
      {h1(room.title)}

      {room.conversation ? (
        <>
          <div className="prose-warm mb-6">
            {room.conversation.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <section className="panel mb-6" aria-labelledby="principles">
            <h2 id="principles" className="mb-3 text-2xl font-bold text-btn">
              대화할 때 함께 지켜요
            </h2>
            <ul className="grid list-disc gap-2 pl-6">
              {room.conversation.principles.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
          <h2 className="mb-3 text-2xl font-bold">어떻게 이야기할까요?</h2>
          <ul className="grid gap-3">
            {room.conversation.methods.map((m) => (
              <li key={m.method}>
                <button
                  type="button"
                  className="block w-full rounded-2xl border-2 border-line bg-surface p-4 text-left hover:bg-surface-2"
                  onClick={() => onMethod(m.method, m.label)}
                >
                  <span className="block text-2xl font-bold">{m.label}</span>
                  <span className="block text-muted">{m.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="mb-6">읽고 싶은 이야기를 골라주세요. 모두 읽지 않으셔도 괜찮아요.</p>
          <ul className="grid gap-3">
            {room.cards.map((c) => (
              <li key={c.id}>
                <button type="button" className="btn btn-secondary justify-start text-left" onClick={() => setMode({ m: "card", id: c.id })}>
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {room.actions && (
        <section className="mt-8" aria-labelledby="actions-q">
          <h2 id="actions-q" className="mb-3 text-2xl font-bold">
            {room.actions.question}
          </h2>
          <div className="grid gap-3">
            {room.actions.options.map((a) => (
              <button key={a.label} type="button" className="btn btn-secondary" onClick={() => onAction(a)}>
                {a.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-auto grid gap-3 pt-10">{roomsButton}</div>
    </section>
  );
}
