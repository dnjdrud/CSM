import { beforeEach, describe, expect, it } from "vitest";
import { PROPOSAL_TRANSITIONS, canTransition, type ProposalStatus } from "@/lib/proposal-rules";
import { __useMemoryDbForTests } from "@/server/db";
import { acceptSonTime, answerProposal, cancelOwnProposal, createProposal, listOwnProposals, parseProposalInput } from "@/server/proposals";
import { readJsonObject } from "@/server/request-guard";

// 2026-11-10 12:00 Korea time
const NOW = Date.UTC(2026, 10, 10, 3, 0);
const MIN = 60_000;
const seoul = (t: number) => {
  const iso = new Date(t + 9 * 3600_000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
};

function make(owner: "mother" | "father", at: number | null, now = NOW) {
  const when = at === null ? { date: "", time: "" } : seoul(at);
  const i = parseProposalInput({ method: "meet", ...when, location: "", companion: "", message: "", confirm: true }, now);
  if (!i.ok) throw new Error(i.error);
  const r = createProposal(owner, i.input, now);
  if (!r.ok) throw new Error();
  return r.proposal.id;
}
const statusOf = (owner: "mother" | "father", id: string) => listOwnProposals(owner).find((p) => p.id === id)!;

beforeEach(() => __useMemoryDbForTests());

describe("transition table", () => {
  it("cancelled is final for everyone; accept/other_time only from proposed", () => {
    for (const actor of ["son", "parent"] as const)
      for (const action of Object.keys(PROPOSAL_TRANSITIONS[actor]) as (keyof (typeof PROPOSAL_TRANSITIONS)[typeof actor])[])
        expect(canTransition(actor, action, "cancelled")).toBe(false);
    const states: ProposalStatus[] = ["proposed", "accepted", "other_time"];
    expect(states.filter((s) => canTransition("son", "accept", s))).toEqual(["proposed"]);
    expect(states.filter((s) => canTransition("son", "other_time", s))).toEqual(["proposed"]);
    expect(states.filter((s) => canTransition("son", "cancel", s))).toEqual(states);
    expect(states.filter((s) => canTransition("parent", "cancel", s))).toEqual(states);
    expect(states.filter((s) => canTransition("parent", "accept_son_time", s))).toEqual(["other_time"]);
    expect(canTransition("parent", "accept", "proposed")).toBe(false); // only the son accepts a parent's proposal
  });
});

describe("son accepting re-checks the time against the server clock", () => {
  it("proposal for NOW+1min, accepted at NOW+2min -> past_time, stays 제안 중", () => {
    const id = make("father", NOW + MIN);
    expect(answerProposal(id, { action: "accept", message: "" }, NOW + 2 * MIN)).toBe("past_time");
    expect(statusOf("father", id).status).toBe("proposed");
  });
  it("a proposal without a time can be accepted any time", () => {
    const id = make("father", null);
    expect(answerProposal(id, { action: "accept", message: "" }, NOW + 365 * 24 * 60 * MIN)).toBe("ok");
    expect(statusOf("father", id).status).toBe("accepted");
  });
  it("a future proposal can be accepted", () => {
    const id = make("father", NOW + 60 * MIN);
    expect(answerProposal(id, { action: "accept", message: "" }, NOW + MIN)).toBe("ok");
  });
});

describe("cancelling", () => {
  it("future proposal -> son accepts -> son cancels: cancelled by son", () => {
    const id = make("mother", NOW + 60 * MIN);
    expect(answerProposal(id, { action: "accept", message: "" }, NOW)).toBe("ok");
    expect(answerProposal(id, { action: "cancel", message: "미안해요" }, NOW)).toBe("ok");
    expect(statusOf("mother", id)).toMatchObject({ status: "cancelled", cancelledBy: "son", sonMessage: "미안해요" });
  });
  it("son can cancel after proposing another time", () => {
    const id = make("mother", NOW + 60 * MIN);
    expect(answerProposal(id, { action: "other_time", message: "", ...seoul(NOW + 24 * 60 * MIN) }, NOW)).toBe("ok");
    expect(answerProposal(id, { action: "cancel", message: "" }, NOW)).toBe("ok");
    expect(statusOf("mother", id)).toMatchObject({ status: "cancelled", cancelledBy: "son" });
  });
  it("the other parent cannot cancel (looks like a missing proposal)", () => {
    const id = make("mother", null);
    expect(cancelOwnProposal("father", id, NOW)).toBe("not_found");
    expect(statusOf("mother", id).status).toBe("proposed");
  });
  it("a cancelled proposal never comes back; repeated requests are refused the same way", () => {
    const id = make("mother", NOW + 60 * MIN);
    expect(cancelOwnProposal("mother", id, NOW)).toBe("ok");
    expect(cancelOwnProposal("mother", id, NOW)).toBe("not_allowed");
    expect(answerProposal(id, { action: "accept", message: "" }, NOW)).toBe("not_allowed");
    expect(answerProposal(id, { action: "other_time", message: "", ...seoul(NOW + 24 * 60 * MIN) }, NOW)).toBe("not_allowed");
    expect(answerProposal(id, { action: "cancel", message: "" }, NOW)).toBe("not_allowed");
    expect(acceptSonTime("mother", id, NOW)).toBe("not_allowed");
    expect(statusOf("mother", id)).toMatchObject({ status: "cancelled", cancelledBy: "parent" });
  });
  it("parent can cancel an accepted proposal", () => {
    const id = make("father", null);
    answerProposal(id, { action: "accept", message: "" }, NOW);
    expect(cancelOwnProposal("father", id, NOW)).toBe("ok");
    expect(statusOf("father", id)).toMatchObject({ status: "cancelled", cancelledBy: "parent" });
  });
});

describe("parent accepting the son's time", () => {
  it("only while that time is still in the future", () => {
    const id = make("father", null);
    answerProposal(id, { action: "other_time", message: "", ...seoul(NOW + 30 * MIN) }, NOW);
    expect(acceptSonTime("father", id, NOW + 31 * MIN)).toBe("past_time");
    expect(statusOf("father", id).status).toBe("other_time");
    expect(acceptSonTime("father", id, NOW + 10 * MIN)).toBe("ok");
    expect(acceptSonTime("father", id, NOW + 10 * MIN)).toBe("not_allowed"); // repeated
  });
});

describe("JSON request bodies", () => {
  const req = (body: string, headers: Record<string, string> = {}) =>
    new Request("http://localhost/api/x", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

  it("only a plain object is accepted; null / array / primitives / malformed are a normal 400", async () => {
    expect(await readJsonObject(req('{"role":"father"}'))).toEqual({ ok: true, value: { role: "father" } });
    for (const b of ["null", "[]", '[{"role":"father"}]', '"text"', "123", "true", "{bad", ""])
      expect(await readJsonObject(req(b))).toEqual({ ok: false, status: 400 });
  });
  it("too large: refused by Content-Length before reading, and while streaming", async () => {
    expect(await readJsonObject(req("{}", { "content-length": "999999" }), 1000)).toEqual({ ok: false, status: 413 });
    const big = JSON.stringify({ x: "가".repeat(2000) });
    expect(await readJsonObject(req(big), 1000)).toEqual({ ok: false, status: 413 });
  });
});
