"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatKoreanDate, type OwnEntry, type SealedPayload } from "@/lib/entry-rules";
import { deleteOwnEntry, errorText, fetchOwnEntries } from "@/lib/entries-client";
import { PARENT_LABEL, type ParentRole } from "@/lib/roles";
import { open, vaultKey } from "@/lib/vault";
import { EntryComposer } from "./EntryComposer";
import { MyProposals } from "./MyProposals";
import { VaultPanel, useVaultKey } from "./VaultPanel";

type Opened = { entry: OwnEntry; payload: SealedPayload | null; broken: boolean };
type View = { v: "list" } | { v: "unlock" } | { v: "read"; id: string } | { v: "edit"; id: string } | { v: "delete"; id: string };
type Decrypted = { epoch: number; map: Record<string, SealedPayload | null> };
const NONE: Decrypted = { epoch: -1, map: {} };

/**
 * The logged-in parent's own writing. Sealed entries stay locked (no title shown)
 * until the personal password is entered in this tab.
 */
export function MyEntries({ role, roomTitles }: { role: ParentRole; roomTitles: Record<number, string> }) {
  const [entries, setEntries] = useState<OwnEntry[] | null>(null);
  const [dec, setDec] = useState<Decrypted>(NONE);
  const [viewState, setViewState] = useState<{ view: View; epoch: number }>({ view: { v: "list" }, epoch: 0 });
  const [error, setError] = useState<string | null>(null);
  const key = useVaultKey();
  const epoch = useSyncExternalStore(vaultKey.subscribe, vaultKey.epoch, () => 0);
  // A view opened before the last wipe (lock / logout / page hide / session expiry) is gone:
  // any read/edit/delete screen showing decrypted text falls back to the locked list at once.
  // (The list and the password screen hold no decrypted text and stay as they are.)
  const showsPlaintext = viewState.view.v === "read" || viewState.view.v === "edit" || viewState.view.v === "delete";
  const view: View = viewState.epoch === epoch || !showsPlaintext ? viewState.view : { v: "list" };
  const setView = (v: View) => setViewState({ view: v, epoch: vaultKey.epoch() });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const other = PARENT_LABEL[role === "mother" ? "father" : "mother"];

  const load = useCallback(async () => {
    try {
      setEntries(await fetchOwnEntries());
      setError(null);
    } catch (e) {
      setError(errorText(e));
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Decrypt in memory with the current key. A result is applied only if the same key and
  // the same epoch are still current after EVERY await, so a slow decryption that finishes
  // after "다시 잠그기" can never unlock the screen again.
  useEffect(() => {
    if (!entries || !key) return;
    const ep = vaultKey.epoch();
    let alive = true;
    const still = () => alive && vaultKey.epoch() === ep && vaultKey.get() === key;
    void (async () => {
      const map: Record<string, SealedPayload | null> = {};
      for (const e of entries) {
        if (e.kind !== "sealed") continue;
        const p = await open(key, e.iv, e.ciphertext);
        if (!still()) return;
        map[e.id] = p;
      }
      if (still()) setDec({ epoch: ep, map });
    })();
    return () => {
      alive = false;
      // Key gone or list reloaded: drop decrypted text from memory too, not just from the screen.
      setDec(NONE);
    };
  }, [entries, key]);

  // What the screen may show: decrypted text only from the current epoch with a key present.
  const live = key && dec.epoch === epoch ? dec.map : {};
  const opened: Record<string, Opened> = {};
  for (const e of entries ?? []) {
    if (e.kind === "shared") opened[e.id] = { entry: e, payload: null, broken: false };
    else {
      const has = e.id in live;
      opened[e.id] = { entry: e, payload: has ? live[e.id] : null, broken: has && !live[e.id] };
    }
  }

  useEffect(() => {
    headingRef.current?.focus();
  }, [viewState, epoch]);

  const h1 = (t: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-title font-bold outline-none">
      {t}
    </h1>
  );

  if (view.v === "unlock") {
    return <VaultPanel onReady={() => setView({ v: "list" })} onCancel={() => setView({ v: "list" })} />;
  }

  const current = "id" in view ? opened[view.id] : undefined;
  if ("id" in view && !current) {
    return (
      <section>
        {h1("글을 찾을 수 없어요")}
        <button type="button" className="btn btn-secondary" onClick={() => setView({ v: "list" })}>
          목록으로
        </button>
      </section>
    );
  }

  const labelOf = (o: Opened) =>
    o.entry.kind === "shared" ? "아들에게 전한 글" : !o.payload ? "잠긴 글" : o.payload.intent === "draft" ? "초안 (아직 전하지 않음)" : "나만 간직하는 글";
  const titleOf = (o: Opened) =>
    o.entry.kind === "shared" ? o.entry.title || "제목 없음" : o.payload ? o.payload.title || "제목 없음" : o.broken ? "열 수 없는 글" : "잠긴 글";

  if (view.v === "edit" && current) {
    const e = current.entry;
    const initial =
      e.kind === "shared"
        ? { id: e.id, title: e.title, body: e.body, visibility: "share" as const }
        : current.payload
          ? { id: e.id, title: current.payload.title, body: current.payload.body, visibility: current.payload.intent === "keep" ? ("keep" as const) : null }
          : null;
    if (!initial) {
      return (
        <section>
          {h1("이 글은 지금 고칠 수 없어요")}
          <p className="mb-6">개인 비밀번호를 입력한 뒤에 고칠 수 있어요.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setView({ v: "list" })}>
            목록으로
          </button>
        </section>
      );
    }
    return (
      <EntryComposer
        roomId={e.roomId}
        role={role}
        heading="고쳐 쓰기"
        prompt={[`${e.roomId}번 방 · ${roomTitles[e.roomId] ?? ""}`]}
        initial={initial}
        closeLabel="목록으로"
        onClose={() => {
          setView({ v: "list" });
          void load();
        }}
      />
    );
  }

  if (view.v === "delete" && current) {
    const shared = current.entry.kind === "shared";
    return (
      <section className="flex flex-1 flex-col">
        {h1("이 글을 지울까요?")}
        <div className="prose-warm panel">
          <p>지운 글은 되돌릴 수 없어요.</p>
          {shared && <p>아들에게 전한 글이라면 아들의 화면에서도 사라져요. 다만 지우기 전에 아들이 이미 읽었을 수 있어요.</p>}
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-error-bg p-4 text-error">
            {error}
          </p>
        )}
        <div className="mt-auto grid gap-3 pt-10">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              try {
                await deleteOwnEntry(current.entry.id);
                setView({ v: "list" });
                await load();
              } catch (err) {
                setError(errorText(err));
              }
            }}
          >
            네, 지울게요
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setView({ v: "read", id: current.entry.id })}>
            지우지 않을게요
          </button>
        </div>
      </section>
    );
  }

  if (view.v === "read" && current) {
    const e = current.entry;
    const text = e.kind === "shared" ? e.body : current.payload?.body;
    return (
      <section className="flex flex-1 flex-col">
        <p className="mb-2 text-muted">
          {labelOf(current)} · {e.roomId}번 방
        </p>
        {h1(titleOf(current))}
        <article className="panel">
          {text ? (
            <p className="whitespace-pre-wrap">{text}</p>
          ) : current.broken ? (
            <p>이 글은 열 수 없어요. 데이터가 손상되었거나 예전 개인 비밀번호로 잠긴 글이에요.</p>
          ) : (
            <p>개인 비밀번호를 입력하면 읽을 수 있어요.</p>
          )}
        </article>
        <p className="mt-4 text-muted">
          {e.kind === "shared" ? `전한 날: ${formatKoreanDate(e.sharedAt)} · ${other}는 볼 수 없어요.` : `저장한 날: ${formatKoreanDate(e.updatedAt)}`}
        </p>
        <div className="mt-auto grid gap-3 pt-10">
          {text && (
            <button type="button" className="btn btn-primary" onClick={() => setView({ v: "edit", id: e.id })}>
              {current.payload?.intent === "draft" ? "이어서 쓰기" : "고쳐 쓰기 · 전할지 바꾸기"}
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setView({ v: "delete", id: e.id })}>
            지우기
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setView({ v: "list" })}>
            목록으로
          </button>
        </div>
      </section>
    );
  }

  // ---- list ----
  const list = entries ? entries.map((e) => opened[e.id]).filter(Boolean) : [];
  const hasSealed = entries?.some((e) => e.kind === "sealed") ?? false;

  return (
    <section className="flex flex-1 flex-col">
      {h1("내가 적은 글")}
      <p className="mb-6">{`이곳의 글은 ${PARENT_LABEL[role]}만 볼 수 있어요. 아들에게 전한 글만 아들이 읽을 수 있고, ${other}는 볼 수 없어요.`}</p>
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-error-bg p-4 text-error">
          {error}
        </p>
      )}
      {entries === null ? (
        <p role="status">불러오는 중이에요…</p>
      ) : list.length === 0 ? (
        <p className="panel">아직 적은 글이 없어요.</p>
      ) : (
        <ul className="grid gap-3">
          {list.map((o) => (
            <li key={o.entry.id}>
              <button
                type="button"
                className="block w-full rounded-2xl border-2 border-line bg-surface p-4 text-left hover:bg-surface-2"
                onClick={() => setView({ v: "read", id: o.entry.id })}
              >
                <span className="block text-lg font-bold text-btn">{labelOf(o)}</span>
                <span className="block text-2xl font-bold">{titleOf(o)}</span>
                <span className="block text-muted">
                  {o.entry.roomId}번 방 · {formatKoreanDate(o.entry.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <MyProposals />
      <div className="mt-auto grid gap-3 pt-10">
        {hasSealed && !key && (
          <button type="button" className="btn btn-primary" onClick={() => setView({ v: "unlock" })}>
            개인 비밀번호로 잠긴 글 열기
          </button>
        )}
        {key && (
          <button type="button" className="btn btn-secondary" onClick={() => vaultKey.wipe()}>
            잠긴 글 다시 잠그기
          </button>
        )}
        <Link href="/rooms/1" className="btn btn-secondary">
          1번 방에서 새로 적기
        </Link>
      </div>
    </section>
  );
}
