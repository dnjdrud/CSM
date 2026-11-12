"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { RoomBodyView, RoomPreludeView } from "@/content/types";
import { ERROR_TEXT, INITIAL_GATE, gateReducer } from "@/lib/gate-machine";
import { leaveVisit, newVisitId } from "@/lib/gate-visit";
import type { ParentRole } from "@/lib/roles";
import { EntryComposer } from "./EntryComposer";
import { EntryGate } from "./EntryGate";
import { RoomBody } from "./RoomBody";

/**
 * Whole visit to one gated room (2-7):
 *   preparation screens -> entry recording gate -> room body.
 *
 * A VISIT is one stay on this page, with its own id. The server ties attempts and the
 * entry grant to that visit, and "leave" only cancels that visit.
 *
 * Each visit starts from the first preparation screen. The room body exists only
 * in this component's memory after a successful gate. These all end the visit and the
 * next entry needs a new recording: refresh, direct URL, leaving the page, back/forward
 * (bfcache), and the page becoming HIDDEN (tab switch, app switch, screen lock, incoming
 * call on most phones) -- once the gate has started or the room is open. Scrolling and
 * moving between cards inside the room do not end the visit.
 */

type PreludeMode = { kind: "step"; index: number } | { kind: "write"; label: string; index: number; prompt: string[] };

export function RoomFlow({ view, role }: { view: RoomPreludeView; role: ParentRole }) {
  const router = useRouter();
  const [gate, dispatch] = useReducer(gateReducer, INITIAL_GATE);
  const [prelude, setPrelude] = useState<PreludeMode>({ kind: "step", index: 0 });
  const [body, setBody] = useState<{ room: RoomBodyView; grant: string } | null>(null);
  const [visitId, setVisitId] = useState(newVisitId);
  const [notice, setNotice] = useState<string | null>(null);
  const visitRef = useRef(visitId);
  const stageRef = useRef(gate.s);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    visitRef.current = visitId;
    stageRef.current = gate.s;
  });

  /** Ends the current visit on the server (only this visit) and starts a fresh one. */
  const restartVisit = useCallback((toIndex: number, why: string | null) => {
    leaveVisit(visitRef.current);
    const next = newVisitId();
    visitRef.current = next;
    setVisitId(next);
    setBody(null);
    setPrelude({ kind: "step", index: toIndex });
    setNotice(why);
    dispatch({ t: "RESET" });
  }, []);

  // Rooms without preparation screens go straight to the gate.
  useEffect(() => {
    if (view.prelude.length === 0 && gate.s === "prelude") dispatch({ t: "PRELUDE_DONE" });
  }, [view.prelude.length, gate.s]);

  // Page hidden (tab/app switch, lock, call), closed, or restored from bfcache: once the
  // gate has started or the room is open, the visit ends and starts over from the first
  // preparation screen. Reading the preparation screens is not interrupted.
  useEffect(() => {
    const hiddenRestart = () => {
      if (stageRef.current !== "prelude") restartVisit(0, ERROR_TEXT.hidden);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenRestart();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) restartVisit(0, null);
    };
    window.addEventListener("pagehide", hiddenRestart);
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", hiddenRestart);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [restartVisit]);

  // Unmount (navigation away): end this visit on the server -- this visit only.
  // Under StrictMode's extra mount/unmount this runs once before anything exists; harmless.
  useEffect(() => () => leaveVisit(visitRef.current), []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (gate.s === "prelude") headingRef.current?.focus();
  }, [prelude, gate.s]);

  const toRooms = useCallback(() => router.push("/rooms"), [router]);

  // ---- Room body (only after a successful gate) ----
  if (gate.s === "room" && body) return <RoomBody room={body.room} grant={body.grant} role={role} onRoomsList={toRooms} />;

  // ---- Entry gate ----
  if (gate.s !== "prelude" && gate.s !== "room") {
    return (
      <EntryGate
        key={visitId}
        roomId={view.id}
        visitId={visitId}
        phrase={view.entryPhrase ?? ""}
        state={gate}
        dispatch={dispatch}
        onEntered={(room, grant) => setBody({ room, grant })}
        onBack={view.prelude.length ? () => restartVisit(view.prelude.length - 1, null) : null}
        onRoomsList={toRooms}
      />
    );
  }

  // ---- Preparation screens ----
  const heading = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-title font-bold outline-none">
      {text}
    </h1>
  );

  const goNext = (index: number) => {
    setNotice(null);
    if (index + 1 < view.prelude.length) setPrelude({ kind: "step", index: index + 1 });
    else dispatch({ t: "PRELUDE_DONE" });
  };

  // Optional writing during preparation (room 3 생각 적어두기). It never opens the room:
  // afterwards the parent returns to the same question and still needs the recording.
  if (prelude.kind === "write") {
    return (
      <EntryComposer
        roomId={view.id}
        role={role}
        heading={prelude.label}
        prompt={prelude.prompt}
        closeLabel="앞 화면으로 돌아가기"
        onClose={() => setPrelude({ kind: "step", index: prelude.index })}
      />
    );
  }

  const index = Math.min(prelude.index, view.prelude.length - 1);
  const step = view.prelude[index];
  if (!step) return null;
  const letter = step.kind === "letter" ? view.letters[step.letterKey] : null;

  return (
    <section className="flex flex-1 flex-col">
      <p className="mb-2 text-muted">
        {view.id}번 방 · 준비 {index + 1} / {view.prelude.length}
      </p>
      {notice && (
        <p role="status" className="mb-6 rounded-2xl bg-surface p-4">
          {notice}
        </p>
      )}

      {step.kind === "letter" ? (
        <>
          {heading(letter?.title || "편지")}
          <article className="panel">
            {letter?.paragraphs ? (
              <div className="prose-warm">
                {letter.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <p>편지를 준비하고 있어요.</p>
            )}
          </article>
        </>
      ) : (
        <>
          {heading(view.title)}
          <div className="prose-warm">
            {step.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto grid gap-3 pt-10">
        {step.kind === "choice" ? (
          step.options.map((o) =>
            o.action === "rooms" ? (
              <Link key={o.label} href="/rooms" className="btn btn-secondary">
                {o.label}
              </Link>
            ) : (
              <button
                key={o.label}
                type="button"
                className={o.action === "continue" ? "btn btn-primary" : "btn btn-secondary"}
                onClick={() =>
                  o.action === "write"
                    ? setPrelude({ kind: "write", label: o.label, index, prompt: step.paragraphs })
                    : goNext(index)
                }
              >
                {o.label}
              </button>
            ),
          )
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => goNext(index)}>
            {step.nextLabel}
          </button>
        )}
        {index > 0 && (
          <button type="button" className="btn btn-secondary" onClick={() => setPrelude({ kind: "step", index: index - 1 })}>
            앞 화면으로
          </button>
        )}
      </div>
    </section>
  );
}
