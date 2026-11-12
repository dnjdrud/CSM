import { describe, expect, it } from "vitest";
import {
  getEditableContent,
  getRoomBodyAfterGate,
  getRoomDefinition,
  getRoomPreludeView,
  listRooms,
  parseRoomId,
} from "@/content/rooms";

describe("room registry", () => {
  it("has seven rooms; only room 1 opens without recording", () => {
    const rooms = listRooms();
    expect(rooms.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(rooms.filter((r) => !r.requiresRecording).map((r) => r.id)).toEqual([1]);
    for (const id of [2, 3, 4, 5, 6, 7]) expect(getRoomDefinition(id)?.entryPhrase).toBeTruthy();
  });

  it("pre-gate view never contains cards (room body) but includes the entry phrase", () => {
    for (const { id } of listRooms()) {
      const view = getRoomPreludeView(id, "mother")!;
      const json = JSON.stringify(view);
      expect(view).not.toHaveProperty("cards");
      const def = getRoomDefinition(id)!;
      for (const c of def.cards) expect(json).not.toContain(c.title);
      expect(view.entryPhrase).toBe(def.entryPhrase);
    }
  });

  it("resolves role-specific wording on the server", () => {
    const m = JSON.stringify(getRoomPreludeView(3, "mother"));
    const f = JSON.stringify(getRoomPreludeView(3, "father"));
    expect(m).toContain("어머니는");
    expect(f).toContain("아버지는");
    expect(m).not.toContain("{parent}");
  });

  it("rejects malformed room ids", () => {
    expect(parseRoomId("2")).toBe(2);
    for (const bad of ["0", "8", "02", "2a", "", "../1"]) expect(parseRoomId(bad)).toBeNull();
  });

  it("never gives parents draft (needs_review) text: cards and pre-gate letters", () => {
    for (const { id } of listRooms()) {
      const def = getRoomDefinition(id)!;
      const body = getRoomBodyAfterGate(id)!;
      for (const c of def.cards) {
        const out = body.cards.find((x) => x.id === c.id)!;
        if (c.status !== "approved") expect(out).toEqual({ id: c.id, title: c.title, body: null, sections: null });
        expect(JSON.stringify(out)).not.toContain("reviewNote");
      }
      for (const l of Object.values(getRoomPreludeView(id, "father")!.letters)) {
        expect(l).not.toHaveProperty("reviewNote");
        expect(l).not.toHaveProperty("status");
      }
    }
    const letter = getEditableContent("letter.room3-pre")!;
    if (!letter.published) expect(getRoomPreludeView(3, "mother")!.letters["room3-pre"].paragraphs).toBeNull();
  });

  it("room 2 drafts keep the requested points and avoid banned framings", () => {
    const text = JSON.stringify(getRoomDefinition(2)!.cards);
    expect(text).toContain("외모를 깎아내리는 말");
    expect(text).toContain("여자친구를 향한 욕설");
    expect(text).toContain("사과를 받고 싶어요");
    expect(text).toContain("2026년 6월 6일");
    expect(text).toContain("외도");
    expect(text).not.toMatch(/체면|죽|살을 빼야|잘못해서 파혼/);
  });

  it("room 3 effort cards: 지금/확인된 변화/다음 계획, no invented records or totals", () => {
    const cards = getRoomDefinition(3)!.cards;
    expect(cards.map((c) => c.id)).toEqual(["health", "finance", "repayment"]);
    for (const c of cards) {
      expect(c.sections?.map((s) => s.heading)).toEqual(["지금 하고 있는 일", "확인된 변화", "다음 계획"]);
      // No confirmed records exist yet, so 확인된 변화 must stay empty (= 준비 중).
      expect(c.sections![1].paragraphs).toBeNull();
    }
    const all = JSON.stringify([getRoomDefinition(2), getRoomDefinition(3)]);
    // Only figures confirmed in the requirements; never a combined "loss" total.
    for (const m of all.match(/[0-9][0-9,]{3,}/g) ?? []) expect(["540,000,000", "1,575,000", "2026"]).toContain(m);
    expect(all).not.toMatch(/682,500,000|690,000,000|손실/);
  });

  it("rooms 4-7 cards follow docs/04 and avoid invented facts", () => {
    const ids = (n: number) => getRoomDefinition(n)!.cards.map((c) => c.title);
    expect(ids(4)).toEqual(["부모님께 빌린 돈", "새로운 결혼 비용", "결혼 이후의 생활", "친척들에게 설명하는 일", "계획이 어려워질 때", "함께 지키고 싶은 선"]);
    expect(ids(5)).toEqual(["다시 결혼을 생각하게 된 이유", "서로 알고 있는 현실", "함께 준비할 생활", "아직 결정하지 않은 것", "부모님께 바라는 참여"]);
    expect(ids(6)).toEqual(["제가 미안한 일", "제가 사과받고 싶은 일", "앞으로 함께 지키고 싶은 것", "부모님의 마음도 듣고 싶어요"]);
    const all = JSON.stringify([4, 5, 6, 7].map((n) => getRoomDefinition(n)));
    // Only confirmed figures; never a combined total or a "loss".
    for (const m of all.match(/[0-9][0-9,]{3,}/g) ?? []) expect(["540,000,000", "1,575,000", "150,000,000"]).toContain(m);
    expect(all).not.toMatch(/690,000,000|손실|체면|죽/);
    // No invented dates (YYYY년 / N월 N일) in rooms 4-7.
    expect(all).not.toMatch(/20[0-9]{2}년|[0-9]+월 [0-9]+일/);
    // Room 4: 상환 기록 stays 준비 중.
    const loan = getRoomDefinition(4)!.cards[0];
    expect(loan.sections!.find((s) => s.heading === "실제 상환 기록")!.paragraphs).toBeNull();
  });

  it("end-of-room choices match docs/04", () => {
    const labels = (n: number) => getRoomDefinition(n)!.actions!.options.map((o) => o.label);
    expect(getRoomDefinition(4)!.actions!.question).toBe("어떤 부분이 가장 걱정되시나요?");
    expect(labels(4)).toEqual(["걱정 남기기", "지금은 읽기만 할게요"]);
    expect(labels(5)).toEqual(["걱정 남기기", "응원 남기기", "나중에 생각하기"]);
    expect(labels(6)).toEqual(["서운했던 일 적기", "미안한 마음 전하기", "앞으로 바라는 점 적기", "더 생각하기"]);
    const c = getRoomDefinition(7)!.conversation!;
    expect(c.methods.map((m) => m.label)).toEqual(["글로 대화하기", "전화 제안하기", "만남 제안하기", "다른 사람과 함께", "시간이 더 필요해요"]);
    expect(c.principles).toHaveLength(5);
  });

  it("room bodies (cards, choices, room 7 methods) are never in the pre-gate view", () => {
    for (const id of [4, 5, 6, 7]) {
      const pre = JSON.stringify(getRoomPreludeView(id, "mother"));
      const def = getRoomDefinition(id)!;
      for (const o of def.actions?.options ?? []) expect(pre).not.toContain(o.label);
      for (const m of def.conversation?.methods ?? []) expect(pre).not.toContain(m.label);
      const body = getRoomBodyAfterGate(id)!;
      expect(body.actions ?? body.conversation).toBeTruthy();
    }
  });
});
