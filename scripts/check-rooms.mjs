// End-to-end check of rooms 4-7 (after the recording gate): cards, end-of-room choices,
// writing, room 7 conversation proposals (Asia/Seoul), isolation and the son's view.
//   BASE_URL=... E2E_FATHER_PASSWORD=<아빠> E2E_MOTHER_PASSWORD=<엄마> E2E_ADMIN_PASSWORD=<관리자> \
//   FAMILY_DB_PATH=<the server's db file> node scripts/check-rooms.mjs
// Use a throwaway database: this script creates entries and proposals.
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const FATHER = process.env.E2E_FATHER_PASSWORD;
const MOTHER = process.env.E2E_MOTHER_PASSWORD;
const ADMIN = process.env.E2E_ADMIN_PASSWORD;
const DB = process.env.FAMILY_DB_PATH;
if (!FATHER || !MOTHER || !ADMIN || !DB) {
  console.error("Set E2E_FATHER_PASSWORD, E2E_MOTHER_PASSWORD, E2E_ADMIN_PASSWORD and FAMILY_DB_PATH (never commit them).");
  process.exit(2);
}

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};
const query = (sql) => {
  const d = new DatabaseSync(DB, { readOnly: true });
  try {
    return d.prepare(sql).all();
  } finally {
    d.close();
  }
};

const browser = await chromium
  .launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome", headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] })
  .catch(() => chromium.launch({ channel: "msedge", headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] }));

const btn = (page, name) => page.getByRole("button", { name, exact: true });
const heading = (page) => page.locator("main h1").first().innerText();

async function login(who, code) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"], isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${BASE}/login/${who}`);
  for (const d of code) await btn(page, d).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), btn(page, "들어가기").click()]);
  return { context, page };
}

/** Preparation -> record -> listen to the end -> enter. */
async function enter(page, roomId) {
  await page.goto(`${BASE}/rooms/${roomId}`);
  for (let i = 0; i < 10 && (await heading(page)) !== "목소리로 확인하기"; i++) await page.locator("main .btn-primary").first().click();
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  await btn(page, "녹음 끝내기").click();
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "끝까지 들으셨어요" }).waitFor({ timeout: 15_000 });
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByText(/읽고 싶은 이야기를 골라주세요|어떻게 이야기할까요?/).first().waitFor({ timeout: 15_000 });
}

const { page: f } = await login("father", FATHER);

// ---------- Rooms 4-6: cards, drafts hidden, choices ----------
const ROOMS = {
  4: { first: "부모님께 빌린 돈", write: "걱정 남기기", title: "걱정되는 점", dismiss: "지금은 읽기만 할게요" },
  5: { first: "다시 결혼을 생각하게 된 이유", write: "응원 남기기", title: "응원하는 마음", dismiss: "나중에 생각하기" },
  6: { first: "제가 미안한 일", write: "서운했던 일 적기", title: "서운했던 일", dismiss: "더 생각하기" },
};
for (const [id, r] of Object.entries(ROOMS)) {
  // Before the gate: no card or choice is on the page.
  await f.goto(`${BASE}/rooms/${id}`);
  const pre = await f.content();
  ok(!pre.includes(r.first) && !pre.includes(r.write), `room ${id}: no cards/choices before the gate`);

  await enter(f, id);
  ok((await btn(f, r.first).count()) === 1, `room ${id}: body opens after the gate`);
  await btn(f, r.first).click();
  ok((await f.getByText("아들이 이 이야기를 준비하고 있어요.").count()) === 1, `room ${id}: draft card shows 준비 중 to parents`);
  await btn(f, "다른 이야기 보기").click();

  await btn(f, r.dismiss).click();
  ok((await f.getByText("아무것도 기록하지 않았어요.").count()) === 1, `room ${id}: '${r.dismiss}' records nothing`);
  await btn(f, "방으로 돌아가기").click();
  ok((await btn(f, r.first).count()) === 1, `room ${id}: back in the room without re-recording`);

  await btn(f, r.write).click();
  const checkedTitle = await f.locator('input[type=radio]:checked + span').first().innerText();
  ok(checkedTitle === r.title, `room ${id}: '${r.write}' suggests the title '${r.title}' (${checkedTitle})`);
  ok((await f.locator('input[type=radio][name$="-vis"]:checked').count()) === 0, `room ${id}: no visibility pre-selected`);
  await f.getByLabel(/내용/).fill(`방${id} 테스트 글`);
  await f.getByText("아들에게 전하기", { exact: true }).click();
  await btn(f, "다시 읽기").click();
  await btn(f, "아들에게 전하기").click();
  await btn(f, "네, 아들에게 전할게요").click();
  await f.getByRole("heading", { name: "아들에게 전했어요." }).waitFor();
  await btn(f, "방으로 돌아가기").click();
  ok((await btn(f, r.first).count()) === 1, `room ${id}: after writing, still inside the room`);
  ok(query(`SELECT * FROM entries WHERE room_id = ${id} AND kind = 'shared'`).length === 1, `room ${id}: shared entry stored`);
}

// ---------- Room 7 ----------
await f.goto(`${BASE}/rooms/7`);
ok(!(await f.content()).includes("전화 제안하기"), "room 7: methods hidden before the gate");
await enter(f, 7);
for (const p of ["끝까지 듣기", "욕설과 비하는 하지 않기", "한 번에 한 가지 이야기만 하기", "말이 격해지면 잠시 멈추기", "한 번에 모든 것을 해결하려고 하지 않기"])
  ok((await f.getByText(p, { exact: true }).count()) === 1, `room 7 principle: ${p}`);

// Call: no place field; past time rejected; future time stored as 제안 중 in Asia/Seoul.
await f.getByText("전화 제안하기").click();
ok((await f.getByLabel(/장소/).count()) === 0, "call proposal has no place field");
const seoulNow = new Date(Date.now() + 9 * 3600_000);
const ymd = (d) => d.toISOString().slice(0, 10);
await f.getByLabel("날짜").fill(ymd(seoulNow));
await f.getByLabel("시간").fill("00:00");
await btn(f, "다시 확인하기").click();
const err = await f.locator("main [role=alert]").innerText().catch(() => "");
ok(err.includes("이미 지난 시간"), "past time rejected");
await f.getByLabel("날짜").fill("");
await btn(f, "다시 확인하기").click();
ok((await f.locator("main [role=alert]").innerText()).includes("함께 골라주세요"), "time without date rejected");
const tomorrow = ymd(new Date(seoulNow.getTime() + 86400_000));
await f.getByLabel("날짜").fill(tomorrow);
await f.getByLabel("시간").fill("19:30");
await f.getByLabel(/하고 싶은 말/).fill("편하실 때 통화해요");
await btn(f, "다시 확인하기").click();
ok((await f.getByText("(한국 시간)", { exact: false }).count()) >= 1, "review shows Korea time");
ok(query("SELECT * FROM proposals").length === 0, "nothing stored before final confirmation");
await btn(f, "네, 제안할게요").click();
await f.getByRole("heading", { name: "제안을 남겼어요" }).waitFor();
const [prop] = query("SELECT * FROM proposals");
const [y, mo, d] = tomorrow.split("-").map(Number);
ok(prop?.status === "proposed" && prop.timezone === "Asia/Seoul" && prop.method === "call", "proposal stored as 제안 중 (Asia/Seoul)");
ok(prop?.proposed_at === Date.UTC(y, mo - 1, d, 19, 30) - 9 * 3600_000, "proposed time converted from Korea time correctly");
ok(prop?.location === "", "call has no stored place");
await btn(f, "앞 화면으로").click();

// Meet with someone: place and companion.
await f.getByText("다른 사람과 함께", { exact: true }).click();
await f.getByLabel(/장소/).fill("동네 카페");
await f.getByLabel(/함께할 분/).fill("이모");
await btn(f, "다시 확인하기").click();
await btn(f, "네, 제안할게요").click();
await f.getByRole("heading", { name: "제안을 남겼어요" }).waitFor();
ok(query("SELECT * FROM proposals WHERE method = 'with_someone' AND companion = '이모' AND proposed_at IS NULL").length === 1, "with-someone proposal without time stored");
await btn(f, "앞 화면으로").click();

await f.getByText("시간이 더 필요해요", { exact: true }).click();
ok((await f.getByText("아무것도 기록하지 않았어요.").count()) === 1, "시간이 더 필요해요 records nothing");
await btn(f, "방으로 돌아가기").click();
await f.getByText("글로 대화하기", { exact: true }).click();
ok((await f.getByRole("heading", { name: "글로 대화하기" }).count()) === 1, "글로 대화하기 opens the writing screen");
await btn(f, "쓰지 않고 돌아가기").click();

// Leaving and coming back needs a new recording.
await f.goto(`${BASE}/rooms`);
await f.goto(`${BASE}/rooms/7`);
ok((await f.getByText("전화 제안하기").count()) === 0, "re-entering room 7 requires the gate again");

// /notes: own proposals with 제안 중 and cancel.
await f.goto(`${BASE}/notes`);
await f.getByRole("heading", { name: "내가 한 대화 제안" }).waitFor();
await f.getByText("제안 중", { exact: true }).first().waitFor(); // the list loads after the heading
ok((await f.getByText("제안 중", { exact: true }).count()) === 2, "notes shows both proposals as 제안 중");
await btn(f, "제안 취소하기").first().click();
await btn(f, "네, 취소할게요").click();
await f.getByText("취소했어요", { exact: true }).waitFor();
ok(query("SELECT * FROM proposals WHERE status = 'cancelled'").length === 1, "owner cancelled a proposal");

// ---------- Mother: isolation ----------
{
  const { page: m, context } = await login("mother", MOTHER);
  const list = await (await m.request.get(`${BASE}/api/proposals`)).json();
  ok(Array.isArray(list.proposals) && list.proposals.length === 0, "mother sees none of father's proposals");
  const open = query("SELECT id FROM proposals WHERE status = 'proposed'")[0].id;
  const r = await m.request.patch(`${BASE}/api/proposals/${open}`, { headers: { origin: BASE, "content-type": "application/json" }, data: { action: "cancel" } });
  ok(r.status() === 404, `mother cannot cancel father's proposal (${r.status()})`);
  const noConfirm = await m.request.post(`${BASE}/api/proposals`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { method: "meet", date: "", time: "", location: "", companion: "", message: "" },
  });
  ok(noConfirm.status() === 403, `proposal outside room 7 (no entry grant) rejected (${noConfirm.status()})`);
  const past = await m.request.post(`${BASE}/api/proposals`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { method: "meet", date: "2020-01-01", time: "10:00", location: "", companion: "", message: "", confirm: true },
  });
  ok(past.status() === 403, `proposal API needs the room 7 grant even for bad input (${past.status()})`);
  const noOrigin = await m.request.post(`${BASE}/api/proposals`, {
    headers: { "content-type": "application/json" },
    data: { method: "meet", date: "", time: "", location: "", companion: "", message: "", confirm: true },
  });
  ok(noOrigin.status() === 403, `proposal without Origin rejected (${noOrigin.status()})`);
  await context.close();
}

// ---------- Son ----------
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.getByLabel(/비밀번호/).fill(ADMIN);
  await Promise.all([page.waitForURL(/\/admin$/), btn(page, "관리자 로그인").click()]);
  await page.goto(`${BASE}/admin/proposals`);
  const text = await page.locator("main").innerText();
  ok(text.includes("답을 기다리는 제안") && text.includes("아빠가 취소함") && text.includes("이모"), "son sees proposals and their status");
  await page.goto(`${BASE}/admin/letters`);
  ok((await page.locator('a[href^="/admin/letters/"]').count()) === 3, "son sees the three shared notes from rooms 4-6");
  const api = await page.request.get(`${BASE}/api/proposals`);
  ok(api.status() === 401, `son cannot use the parents' proposal API (${api.status()})`);
  await context.close();
}

await browser.close();
console.log(failures ? `${failures} check(s) failed` : "All room 4-7 checks passed");
process.exit(failures ? 1 : 0);
