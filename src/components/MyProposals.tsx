"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/entries-client";
import { METHOD_LABEL, canTransition, formatSeoul, proposalErrorText, statusText, type Proposal } from "@/lib/proposal-rules";
import { acceptSonTime, cancelProposal, fetchOwnProposals } from "@/lib/proposals-client";

type Load = { s: "loading" } | { s: "error"; message: string } | { s: "ready"; items: Proposal[] };

/**
 * The parent's own conversation proposals (room 7) on /notes: 취소 and accepting the son's
 * suggested time. Loading, failure (with 다시 불러오기) and "none yet" are shown separately.
 * One write at a time: buttons are disabled while a request is in flight.
 */
export function MyProposals() {
  const [load, setLoad] = useState<Load>({ s: "loading" });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const busy = useRef(false);

  const fetchList = useCallback(
    () =>
      fetchOwnProposals().then(
        (items) => setLoad({ s: "ready", items }),
        (e: unknown) => setLoad({ s: "error", message: proposalErrorText(e instanceof ApiError ? e.code : "network") }),
      ),
    [],
  );

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const retry = () => {
    setLoad({ s: "loading" });
    void fetchList();
  };

  /** Runs one write; ignores further taps until it finishes, then reloads the list. */
  async function run(id: string, fn: () => Promise<unknown>) {
    if (busy.current) return;
    busy.current = true;
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
      setConfirmId(null);
    } catch (e) {
      setActionError(proposalErrorText(e instanceof ApiError ? e.code : "network"));
    } finally {
      busy.current = false;
      setBusyId(null);
      await fetchList(); // show the server's real state, also after a refused/duplicate request
    }
  }

  return (
    <section className="mt-10" aria-labelledby="my-proposals" aria-busy={load.s === "loading"}>
      <h2 id="my-proposals" className="mb-3 text-2xl font-bold">
        내가 한 대화 제안
      </h2>

      {load.s === "loading" && <p role="status">불러오는 중이에요…</p>}

      {load.s === "error" && (
        <div role="alert" className="grid gap-3 rounded-2xl bg-error-bg p-4 text-error">
          <p>대화 제안을 불러오지 못했어요. {load.message}</p>
          <button type="button" className="btn btn-secondary" onClick={retry}>
            다시 불러오기
          </button>
        </div>
      )}

      {load.s === "ready" && load.items.length === 0 && <p className="text-muted">아직 한 대화 제안이 없어요. 7번 방에서 제안할 수 있어요.</p>}

      {load.s === "ready" && load.items.length > 0 && (
        <>
          {actionError && (
            <p role="alert" className="mb-3 rounded-2xl bg-error-bg p-4 text-error">
              {actionError}
            </p>
          )}
          <ul className="grid gap-3">
            {load.items.map((p) => {
              const busyHere = busyId === p.id;
              const anyBusy = busyId !== null;
              return (
                <li key={p.id} className="panel">
                  <p className="font-bold text-btn">{statusText(p)}</p>
                  <p className="text-2xl font-bold">{METHOD_LABEL[p.method]}</p>
                  <p>{p.proposedAt ? `${formatSeoul(p.proposedAt)} (한국 시간)` : "시간은 정하지 않았어요"}</p>
                  {p.location && <p>장소: {p.location}</p>}
                  {p.companion && <p>함께할 분: {p.companion}</p>}
                  {p.message && <p className="whitespace-pre-wrap">하고 싶은 말: {p.message}</p>}
                  {p.status === "other_time" && p.sonProposedAt && (
                    <p className="mt-3 font-bold">아들이 제안한 시간: {formatSeoul(p.sonProposedAt)} (한국 시간)</p>
                  )}
                  {p.sonMessage && <p className="mt-2 whitespace-pre-wrap">아들의 답: {p.sonMessage}</p>}

                  {canTransition("parent", "accept_son_time", p.status) && p.sonProposedAt && confirmId !== p.id && (
                    <button
                      type="button"
                      className="btn btn-primary mt-4"
                      disabled={anyBusy}
                      aria-busy={busyHere}
                      onClick={() => void run(p.id, () => acceptSonTime(p.id))}
                    >
                      {busyHere ? "보내는 중…" : "아들이 제안한 시간으로 할게요"}
                    </button>
                  )}

                  {canTransition("parent", "cancel", p.status) &&
                    (confirmId === p.id ? (
                      <div className="mt-4 grid gap-3">
                        <p>이 제안을 취소할까요? 취소하면 되돌릴 수 없어요.</p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={anyBusy}
                          aria-busy={busyHere}
                          onClick={() => void run(p.id, () => cancelProposal(p.id))}
                        >
                          {busyHere ? "취소하는 중…" : "네, 취소할게요"}
                        </button>
                        <button type="button" className="btn btn-secondary" disabled={anyBusy} onClick={() => setConfirmId(null)}>
                          그대로 둘게요
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-secondary mt-4" disabled={anyBusy} onClick={() => setConfirmId(p.id)}>
                        제안 취소하기
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
