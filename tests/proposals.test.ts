import { beforeEach, describe, expect, it } from "vitest";
import { formatSeoul, seoulLocalToUtc, seoulToday, validateProposalFields } from "@/lib/proposal-rules";
import { __useMemoryDbForTests, getDb } from "@/server/db";
import { cancelOwnProposal, createProposal, listOwnProposals, listProposalsForSon, parseProposalInput } from "@/server/proposals";

// 2026-11-10 12:00 Korea time
const NOW = Date.UTC(2026, 10, 10, 3, 0);
const base = { method: "meet", date: "2026-11-20", time: "14:30", location: "집 근처 카페", companion: "", message: "", confirm: true };

function input(raw: unknown) {
  const r = parseProposalInput(raw, NOW);
  if (!r.ok) throw new Error(r.error);
  return r.input;
}

beforeEach(() => __useMemoryDbForTests());

describe("Korea time", () => {
  it("converts Asia/Seoul local time to UTC (UTC+9, no DST)", () => {
    expect(seoulLocalToUtc("2026-11-20", "14:30")).toBe(Date.UTC(2026, 10, 20, 5, 30));
    expect(seoulLocalToUtc("2026-01-01", "00:10")).toBe(Date.UTC(2025, 11, 31, 15, 10));
    expect(formatSeoul(Date.UTC(2026, 10, 20, 5, 30))).toContain("오후 2:30");
  });
  it("rejects impossible dates and malformed input", () => {
    for (const [d, t] of [["2026-02-31", "10:00"], ["2026-13-01", "10:00"], ["2026-11-20", "24:00"], ["20261120", "10:00"], ["2026-11-20", "1030"]])
      expect(seoulLocalToUtc(d, t)).toBeNull();
  });
  it("today is computed in Korea, not UTC", () => {
    expect(seoulToday(Date.UTC(2026, 10, 10, 16, 0))).toBe("2026-11-11"); // 01:00 KST next day
  });
});

describe("proposal validation", () => {
  it("time is optional, but date and time go together, must be future and within a year", () => {
    const f = { date: "", time: "", location: "", companion: "", message: "" };
    expect(validateProposalFields(f, NOW)).toEqual({ ok: true, proposedAt: null });
    expect(validateProposalFields({ ...f, date: "2026-11-20" }, NOW)).toEqual({ ok: false, error: "invalid_time" });
    expect(validateProposalFields({ ...f, date: "2026-11-10", time: "11:59" }, NOW)).toEqual({ ok: false, error: "past_time" });
    expect(validateProposalFields({ ...f, date: "2026-11-10", time: "12:10" }, NOW).ok).toBe(true);
    expect(validateProposalFields({ ...f, date: "2028-01-01", time: "10:00" }, NOW)).toEqual({ ok: false, error: "too_far" });
  });
  it("requires explicit confirmation and a known method; calls have no place", () => {
    expect(parseProposalInput({ ...base, confirm: undefined }, NOW)).toEqual({ ok: false, error: "confirm_required" });
    expect(parseProposalInput({ ...base, method: "sms" }, NOW)).toEqual({ ok: false, error: "invalid_request" });
    expect(parseProposalInput({ ...base, method: "write" }, NOW)).toEqual({ ok: false, error: "invalid_request" });
    expect(input({ ...base, method: "call" }).location).toBe("");
    expect(parseProposalInput({ ...base, message: "가".repeat(1001) }, NOW)).toEqual({ ok: false, error: "message_too_long" });
  });
});

describe("proposal storage", () => {
  it("starts as 제안 중 in Asia/Seoul and is never confirmed automatically", () => {
    const r = createProposal("mother", input(base), NOW);
    if (!r.ok) throw new Error();
    expect(r.proposal).toMatchObject({ status: "proposed", timezone: "Asia/Seoul", proposedAt: Date.UTC(2026, 10, 20, 5, 30) });
  });
  it("parents see only their own; the other parent cannot cancel", () => {
    const m = createProposal("mother", input(base), NOW);
    if (!m.ok) throw new Error();
    expect(listOwnProposals("father")).toHaveLength(0);
    expect(cancelOwnProposal("father", m.proposal.id)).toBe("not_found");
    expect(listOwnProposals("mother")[0].status).toBe("proposed");
    expect(cancelOwnProposal("mother", m.proposal.id)).toBe("ok");
    expect(cancelOwnProposal("mother", m.proposal.id)).toBe("not_allowed"); // repeated cancel
    expect(listProposalsForSon()[0]).toMatchObject({ owner: "mother", status: "cancelled" });
  });
  it("database only accepts the Seoul timezone and known statuses", () => {
    expect(() =>
      getDb()
        .prepare("INSERT INTO proposals (id, owner, method, timezone, status, created_at, updated_at) VALUES ('x','mother','call','UTC','proposed',1,1)")
        .run(),
    ).toThrow();
    expect(() =>
      getDb()
        .prepare("INSERT INTO proposals (id, owner, method, timezone, status, created_at, updated_at) VALUES ('y','mother','call','Asia/Seoul','confirmed',1,1)")
        .run(),
    ).toThrow();
  });
});
