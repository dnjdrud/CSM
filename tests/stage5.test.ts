import { beforeEach, describe, expect, it } from "vitest";
import {
  getEditableContent,
  getRoomBodyAfterGate,
  getRoomPreludeView,
  listEditableContent,
  publishedIntroLetter,
} from "@/content/rooms";
import { __useMemoryDbForTests, getDb } from "@/server/db";
import { publish, resetContent, saveDraft, splitParagraphs, unpublish } from "@/server/content-store";
import { __resetRateLimitsForTests, lockRemainingMs, recordFailure } from "@/server/rate-limit";
import { createAttempt, enterRoom, revokeSession, verifyGrant } from "@/server/room-access";
import { isSessionActive, recordSession, revokeSessionRecord } from "@/server/session-store";
import { createSessionToken } from "@/server/session-token";
import { acceptSonTime, answerProposal, createProposal, listOwnProposals, parseProposalInput } from "@/server/proposals";

beforeEach(() => __useMemoryDbForTests());

describe("content publishing (ContentDraft)", () => {
  const key = "card.2.thanks";
  const body = (k: string) => getRoomBodyAfterGate(2)!.cards.find((c) => c.id === k)!;

  it("drafts are never shown to parents; published text is; unpublish hides it again", () => {
    expect(body("thanks").body).toBeNull();
    saveDraft(key, { body: ["초안 문장"], sections: null });
    expect(body("thanks").body).toBeNull(); // a saved draft is still hidden
    expect(getEditableContent(key)!.draft.body).toEqual(["초안 문장"]);
    publish(key, { body: ["게시 문장"], sections: null });
    expect(body("thanks").body).toEqual(["게시 문장"]);
    saveDraft(key, { body: ["새 초안"], sections: null });
    expect(body("thanks").body).toEqual(["게시 문장"]); // editing the draft does not change what parents see
    unpublish(key, { body: ["새 초안"], sections: null });
    expect(body("thanks").body).toBeNull();
    resetContent(key);
    expect(getEditableContent(key)!.source).toBe("code");
  });

  it("section headings stay fixed; only paragraphs are taken from the edit", () => {
    publish("card.3.repayment", {
      body: null,
      sections: [
        { heading: "확인된 변화", paragraphs: ["기록"] },
        { heading: "가짜 제목", paragraphs: ["무시됨"] },
      ],
    });
    const c = getRoomBodyAfterGate(3)!.cards.find((x) => x.id === "repayment")!;
    expect(c.sections!.map((s) => s.heading)).toEqual(["지금 하고 있는 일", "확인된 변화", "다음 계획"]);
    expect(c.sections![1].paragraphs).toEqual(["기록"]);
    expect(JSON.stringify(c)).not.toContain("무시됨");
  });

  it("letters: room 3 pre-gate letter and first-visit letter follow the same rule", () => {
    expect(publishedIntroLetter().paragraphs).toBeNull();
    publish("letter.intro", { body: ["편지"], sections: null });
    expect(publishedIntroLetter().paragraphs).toEqual(["편지"]);
    publish("letter.room3-pre", { body: ["감사 편지"], sections: null });
    expect(getRoomPreludeView(3, "mother")!.letters["room3-pre"].paragraphs).toEqual(["감사 편지"]);
  });

  it("every card and letter is editable; paragraphs split on blank lines", () => {
    expect(listEditableContent().length).toBe(2 + 6 + 3 + 6 + 5 + 4);
    expect(splitParagraphs("첫 문단\n이어짐\n\n 둘째 \n\n\n")).toEqual(["첫 문단\n이어짐", "둘째"]);
    expect(splitParagraphs("   ")).toBeNull();
  });
});

describe("sessions are server-side records", () => {
  it("logout revokes the record so a copied cookie stops working", () => {
    const { payload } = createSessionToken("father", "x".repeat(40));
    expect(isSessionActive(payload)).toBe(false); // not recorded -> not accepted
    recordSession(payload);
    expect(isSessionActive(payload)).toBe(true);
    expect(isSessionActive({ ...payload, role: "son" })).toBe(false); // role must match the record
    revokeSessionRecord(payload.sid);
    expect(isSessionActive(payload)).toBe(false);
  });
});

describe("security state is persisted (not process memory)", () => {
  it("login lockouts live in the database and never store the raw client address", () => {
    __resetRateLimitsForTests();
    for (let i = 0; i < 5; i++) recordFailure("father", "203.0.113.7");
    expect(lockRemainingMs("father", "203.0.113.7")).toBeGreaterThan(0);
    const rows = getDb().prepare("SELECT key FROM login_buckets").all() as { key: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(JSON.stringify(rows)).not.toContain("203.0.113.7");
  });

  it("gate attempts/grants are stored as hashes, one-time, and revocable", () => {
    const A = { sid: "session-a-aaaaaaaaaaaa", role: "mother" as const };
    const T0 = Date.now();
    recordSession({ v: 1, sid: A.sid, role: A.role, iat: Math.floor(T0 / 1000), exp: Math.floor(T0 / 1000) + 3600 });
    const created = createAttempt(A, 4, "visit-test-aaaa", T0, T0);
    if (!created.ok) throw new Error(created.reason);
    const at = created.attemptId;
    expect(JSON.stringify(getDb().prepare("SELECT * FROM room_attempts").all())).not.toContain(at);
    const r = enterRoom(A, 4, "visit-test-aaaa", at, 2000, T0 + 5000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(JSON.stringify(getDb().prepare("SELECT * FROM room_grants").all())).not.toContain(r.grant);
    expect(enterRoom(A, 4, "visit-test-aaaa", at, 2000, T0 + 6000).ok).toBe(false);
    expect(verifyGrant(A, 4, r.grant, T0 + 7000)).toBe(true);
    revokeSession(A.sid);
    expect(verifyGrant(A, 4, r.grant, T0 + 8000)).toBe(false);
  });

  it("there is no table or column that could hold entry recordings or a recording exemption", () => {
    const tables = (getDb().prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((t) => t.name);
    expect(tables.some((t) => /audio|record|voice/i.test(t))).toBe(false);
    const cols = tables.flatMap((t) => (getDb().prepare(`PRAGMA table_info(${t})`).all() as { name: string }[]).map((c) => c.name));
    expect(cols.some((c) => /audio|blob|voice|exempt|skip/i.test(c))).toBe(false);
  });
});

describe("no sensitive logging", () => {
  it("app code never writes to logs (passwords, writing, addresses cannot leak there)", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.(ts|tsx)$/.test(n) ? [join(d, n)] : []));
    const offenders = walk(join(process.cwd(), "src")).filter((f) => /console\.(log|info|warn|error|debug)|process\.stdout/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("son answers proposals (in-app only)", () => {
  const NOW = Date.UTC(2026, 10, 10, 3, 0);
  const make = () => {
    const i = parseProposalInput({ method: "call", date: "", time: "", location: "", companion: "", message: "", confirm: true }, NOW);
    if (!i.ok) throw new Error();
    const r = createProposal("father", i.input, NOW);
    if (!r.ok) throw new Error();
    return r.proposal.id;
  };

  it("accepting is only from 제안 중; an accepted proposal can still be cancelled by the son", () => {
    const id = make();
    expect(answerProposal(id, { action: "accept", message: "좋아요" }, NOW)).toBe("ok");
    expect(listOwnProposals("father")[0]).toMatchObject({ status: "accepted", sonMessage: "좋아요" });
    expect(answerProposal(id, { action: "accept", message: "" }, NOW)).toBe("not_allowed"); // repeated
    expect(answerProposal(id, { action: "cancel", message: "" }, NOW)).toBe("ok");
    expect(listOwnProposals("father")[0]).toMatchObject({ status: "cancelled", cancelledBy: "son" });
  });

  it("other time must be a valid future Korea time; the parent can accept it", () => {
    const id = make();
    expect(answerProposal(id, { action: "other_time", message: "", date: "", time: "" }, NOW)).toBe("time_required");
    expect(answerProposal(id, { action: "other_time", message: "", date: "2026-11-01", time: "10:00" }, NOW)).toBe("past_time");
    expect(answerProposal(id, { action: "other_time", message: "이때는 어떠세요", date: "2026-11-15", time: "19:00" }, NOW)).toBe("ok");
    expect(acceptSonTime("mother", id, NOW)).toBe("not_found"); // other parent
    expect(acceptSonTime("father", id, NOW)).toBe("ok");
    expect(listOwnProposals("father")[0]).toMatchObject({ status: "accepted", proposedAt: Date.UTC(2026, 10, 15, 10, 0) });
  });

  it("son cancel is shown as the son's answer", () => {
    const id = make();
    answerProposal(id, { action: "cancel", message: "이번엔 어려워요" }, NOW);
    expect(listOwnProposals("father")[0]).toMatchObject({ status: "cancelled", cancelledBy: "son" });
  });
});
