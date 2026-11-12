// Browser helpers for the entry gate: visit ids, a strictly increasing request sequence,
// and a scoped "leave" that only cancels one visit (or one attempt) on the server.

let lastSeq = 0;

/**
 * Strictly increasing per tab, based on the device clock so separate tabs of the same
 * session are ordered too. The server refuses any attempt older than the newest one it saw.
 */
export function nextSeq(): number {
  lastSeq = Math.max(Date.now(), lastSeq + 1);
  return lastSeq;
}

export function newVisitId(): string {
  const b = crypto.getRandomValues(new Uint8Array(18));
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Tells the server this visit (or just this attempt) is over. Fire-and-forget: it also
 * runs while the page is being hidden or closed. The server only deletes rows of this
 * visit, so if it arrives late it cannot cancel a newer visit.
 */
export function leaveVisit(visitId: string, attemptId?: string): void {
  const body = JSON.stringify(attemptId ? { visitId, attemptId } : { visitId });
  try {
    // text/plain keeps sendBeacon a simple request; the server parses the JSON itself.
    const sent = navigator.sendBeacon?.("/api/rooms/leave", new Blob([body], { type: "text/plain;charset=UTF-8" }));
    if (!sent) {
      void fetch("/api/rooms/leave", { method: "POST", body, keepalive: true, credentials: "same-origin" }).catch(() => {});
    }
  } catch {}
}
