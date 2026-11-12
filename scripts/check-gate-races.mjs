// Entry gate: leaving / returning / async races, and where the grant is required.
//   BASE_URL=... E2E_FATHER_PASSWORD=<아빠> E2E_MOTHER_PASSWORD=<엄마> FAMILY_DB_PATH=<the server's db file> \
//   node scripts/check-gate-races.mjs            (HAPPY_ONLY=1 runs just one full entry, e.g. against `next dev` for StrictMode)
// Use a throwaway database. Page hiding is SIMULATED (visibilityState override + visibilitychange);
// real app switch / screen lock / incoming call must still be checked on real phones (README).
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const FATHER = process.env.E2E_FATHER_PASSWORD;
const MOTHER = process.env.E2E_MOTHER_PASSWORD;
const DB = process.env.FAMILY_DB_PATH;
const HAPPY_ONLY = process.env.HAPPY_ONLY === "1";
if (!FATHER || !MOTHER || !DB) {
  console.error("Set E2E_FATHER_PASSWORD, E2E_MOTHER_PASSWORD and FAMILY_DB_PATH (never commit them).");
  process.exit(2);
}

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};
const count = (table) => {
  const d = new DatabaseSync(DB, { readOnly: true });
  try {
    return d.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  } finally {
    d.close();
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function eventually(fn, ms = 4000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await sleep(100);
  }
  return fn();
}

const INSTRUMENT = () => {
  window.__streams = [];
  window.__audios = [];
  window.__urls = { created: 0, revoked: 0 };
  const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (c) => {
    const s = await gum(c);
    window.__streams.push(s);
    return s;
  };
  const NativeAudio = window.Audio;
  window.Audio = function (...a) {
    const el = new NativeAudio(...a);
    window.__audios.push(el);
    return el;
  };
  const c = URL.createObjectURL.bind(URL);
  const r = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (o) => (window.__urls.created++, c(o));
  URL.revokeObjectURL = (u) => (window.__urls.revoked++, r(u));
};

const args = ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"];
const browser = await chromium
  .launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome", headless: true, args })
  .catch(() => chromium.launch({ channel: "msedge", headless: true, args }));
const btn = (page, name) => page.getByRole("button", { name, exact: true });
const heading = (page) => page.locator("main h1").first().innerText();
const mainText = (page) => page.locator("main").innerText();

async function login(who, code) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"] });
  await context.addInitScript(INSTRUMENT);
  const page = await context.newPage();
  await page.goto(`${BASE}/login/${who}`);
  for (const d of code) await btn(page, d).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), btn(page, "들어가기").click()]);
  // Collect visit ids and grants the page sends/receives (to test late requests at the API level).
  const seen = { visits: [], grants: [] };
  page.on("request", (r) => {
    if (/\/api\/rooms\/\d\/attempt$/.test(r.url())) {
      try {
        seen.visits.push(JSON.parse(r.postData() ?? "{}").visitId);
      } catch {}
    }
  });
  page.on("response", async (r) => {
    if (/\/api\/rooms\/\d\/enter$/.test(r.url()) && r.ok()) {
      try {
        seen.grants.push({ room: Number(r.url().match(/rooms\/(\d)/)[1]), grant: (await r.json()).grant });
      } catch {}
    }
  });
  return { context, page, seen };
}

async function toGate(page, roomId) {
  await page.goto(`${BASE}/rooms/${roomId}`);
  for (let i = 0; i < 10 && (await heading(page)) !== "목소리로 확인하기"; i++) await page.locator("main .btn-primary").first().click();
}
async function record(page, ms = 1600) {
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(ms);
  await btn(page, "녹음 끝내기").click();
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor({ timeout: 10_000 });
}
async function listen(page) {
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "끝까지 들으셨어요" }).waitFor({ timeout: 15_000 });
}
async function enterRoomUi(page, roomId) {
  await toGate(page, roomId);
  await record(page);
  await listen(page);
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByText(/읽고 싶은 이야기를 골라주세요|어떻게 이야기할까요\?/).first().waitFor({ timeout: 15_000 });
}
const setVisibility = (page, state) =>
  page.evaluate((st) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => st });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => st === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
const tracksStopped = (page) => page.evaluate(() => window.__streams.every((s) => s.getTracks().every((t) => t.readyState === "ended")));
const urlsBalanced = (page) => page.evaluate(() => window.__urls.created === window.__urls.revoked);
const backAtStart = async (page) => (await mainText(page)).includes("준비 1 /");

const f = await login("father", FATHER);
const { page } = f;

if (HAPPY_ONLY) {
  await enterRoomUi(page, 2);
  ok((await btn(page, "고마웠던 마음").count()) === 1, "full entry works (run against `next dev` = React StrictMode)");
  ok(await tracksStopped(page), "mic tracks stopped after entry");
  ok(await urlsBalanced(page), "object URLs revoked after entry");
  ok(count("room_grants") === 1, `exactly one grant after entry (${count("room_grants")})`);
  await browser.close();
  console.log(failures ? `${failures} check(s) failed` : "Happy path passed");
  process.exit(failures ? 1 : 0);
}

// ---------- 1. Hidden while RECORDING ----------
{
  await toGate(page, 2);
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  ok(count("room_attempts") === 1, "recording: one attempt on the server");
  await setVisibility(page, "hidden");
  ok(await eventually(() => tracksStopped(page)), "hidden while recording: mic tracks stopped");
  ok(await eventually(() => backAtStart(page)), "hidden while recording: back to the first preparation screen");
  ok(await eventually(() => count("room_attempts") === 0), "hidden while recording: this visit's attempt cancelled on the server");
  await setVisibility(page, "visible");
  ok((await mainText(page)).includes("화면을 벗어나서"), "on return: explains why it restarted");
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "on return: no way in without a new recording");
}

// ---------- 2. Hidden while PLAYING, and while LISTENED ----------
for (const at of ["playing", "listened"]) {
  await toGate(page, 2);
  await record(page);
  if (at === "playing") {
    await btn(page, "내 목소리 듣기").click();
    await page.getByRole("heading", { name: "듣고 있어요" }).waitFor();
  } else {
    await listen(page);
  }
  await setVisibility(page, "hidden");
  ok(await eventually(() => backAtStart(page)), `hidden while ${at}: restarted`);
  ok(await page.evaluate(() => window.__audios.every((a) => a.paused)), `hidden while ${at}: playback stopped`);
  ok(await eventually(() => urlsBalanced(page)), `hidden while ${at}: recording (object URL) discarded`);
  await setVisibility(page, "visible");
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, `hidden while ${at}: listened/confirmed state not kept`);
}

// ---------- 3. Hidden while INSIDE the room ----------
{
  await enterRoomUi(page, 4);
  const grant4 = f.seen.grants.at(-1).grant;
  await btn(page, "부모님께 빌린 돈").click(); // card navigation is not a re-entry
  await btn(page, "다른 이야기 보기").click();
  await page.mouse.wheel(0, 400); // scrolling is not a re-entry
  ok((await btn(page, "부모님께 빌린 돈").count()) === 1, "card navigation and scrolling keep the room open");
  await setVisibility(page, "hidden");
  ok(await eventually(() => backAtStart(page)), "hidden inside the room: body gone, back to preparation");
  ok(await eventually(() => count("room_grants") === 0), "hidden inside the room: grant revoked on the server");
  await setVisibility(page, "visible");
  const r = await page.request.post(`${BASE}/api/entries`, {
    headers: { origin: BASE, "content-type": "application/json", "x-room-grant": grant4 },
    data: { kind: "shared", roomId: 4, title: "", body: "x", confirmShare: true },
  });
  ok(r.status() === 403, `old grant no longer accepted after hiding (${r.status()})`);
}

// ---------- 4. Enter response delayed, then LEAVE / HIDE / BACK ----------
for (const how of ["leave", "hide", "back"]) {
  await toGate(page, 2);
  await record(page);
  await listen(page);
  let release;
  const held = new Promise((r) => (release = r));
  await page.route("**/api/rooms/2/enter", async (route) => {
    const resp = await route.fetch(); // the server DOES process it (and issues a grant)
    await held;
    await route.fulfill({ response: resp }).catch(() => {});
  });
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByRole("heading", { name: "들어가고 있어요" }).waitFor();
  await eventually(() => count("room_grants") === 1);
  if (how === "leave") {
    await btn(page, "방 목록으로").click();
    await page.waitForURL(/\/rooms$/);
  } else if (how === "hide") {
    await setVisibility(page, "hidden");
  } else {
    await page.goBack();
  }
  release();
  await sleep(500);
  if (how === "hide") await setVisibility(page, "visible");
  ok(await eventually(() => count("room_grants") === 0), `enter delayed then ${how}: the late grant is cancelled (this visit only)`);
  const t = await mainText(page);
  ok(!t.includes("고마웠던 마음"), `enter delayed then ${how}: body never shown`);
  await page.unroute("**/api/rooms/2/enter");
}

// ---------- 5. Attempt response delayed, then RE-RECORD ----------
{
  await toGate(page, 2);
  let releaseFirst;
  const held = new Promise((r) => (releaseFirst = r));
  let n = 0;
  await page.route("**/api/rooms/2/attempt", async (route) => {
    n += 1;
    if (n === 1) {
      const resp = await route.fetch();
      await held;
      await route.fulfill({ response: resp }).catch(() => {});
    } else await route.continue();
  });
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "마이크를 준비하고 있어요" }).waitFor();
  await btn(page, "다시 녹음하기").click();
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  releaseFirst(); // the first (older) attempt's response arrives late
  await sleep(800);
  ok((await heading(page)) === "녹음하고 있어요", "late response of the discarded attempt does not change the screen");
  ok(await eventually(() => count("room_attempts") === 1), "only the newest attempt remains on the server");
  await page.waitForTimeout(1200);
  await btn(page, "녹음 끝내기").click();
  await listen(page);
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByText("읽고 싶은 이야기를 골라주세요").waitFor({ timeout: 15_000 });
  ok(true, "the newest attempt still enters normally");
  await page.unroute("**/api/rooms/2/attempt");
}

// ---------- 6. Late requests from an earlier screen (API level) ----------
{
  // Old visit = room 2 above. New visit: start recording in room 3.
  const oldVisit = f.seen.visits.at(-1);
  await toGate(page, 3);
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  const newVisit = f.seen.visits.at(-1);
  ok(newVisit !== oldVisit, "each page stay has its own visit id");
  const leave = await page.request.post(`${BASE}/api/rooms/leave`, { headers: { origin: BASE }, data: JSON.stringify({ visitId: oldVisit }) });
  ok(leave.status() === 204 && count("room_attempts") === 1, "late leave of the earlier visit does not cancel the new attempt");
  const stale = await page.request.post(`${BASE}/api/rooms/2/attempt`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { visitId: oldVisit, seq: Date.now() - 60_000 },
  });
  ok(stale.status() === 409 && count("room_attempts") === 1, `late older attempt request is refused as stale (${stale.status()}) and changes nothing`);
  const noVisit = await page.request.post(`${BASE}/api/rooms/leave`, { headers: { origin: BASE }, data: "{}" });
  ok(noVisit.status() === 400 && count("room_attempts") === 1, "leave without a visit id does not wipe the session");
  await page.waitForTimeout(1200);
  await btn(page, "녹음 끝내기").click();
  await listen(page);
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByText("읽고 싶은 이야기를 골라주세요").waitFor({ timeout: 15_000 });
  ok(true, "the new visit enters normally after the late requests");
}

// ---------- 7. Old audio events cannot change the new state; stricter playback checks ----------
{
  await toGate(page, 2);
  await record(page, 2500);
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "듣고 있어요" }).waitFor();
  await btn(page, "멈추기").click();
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor();
  ok((await mainText(page)).includes("처음부터 다시"), "stopping playback requires listening again from the start");
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "듣고 있어요" }).waitFor();
  const restarted = await page.evaluate(() => window.__audios.at(-1).currentTime < 0.5);
  ok(restarted, "replay starts from the beginning on a fresh audio element");
  await page.evaluate(() => window.__audios.at(-2).dispatchEvent(new Event("ended"))); // late event of the OLD audio
  await sleep(200);
  ok((await heading(page)) === "듣고 있어요", "a late 'ended' from the previous audio is ignored");
  await page.evaluate(() => window.__audios.at(-1).dispatchEvent(new Event("ended"))); // premature 'ended' on the current one
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor();
  ok((await mainText(page)).includes("끝까지 듣지 못한"), "'ended' without reaching the end is rejected");

  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "듣고 있어요" }).waitFor();
  await page.evaluate(() => (window.__audios.at(-1).playbackRate = 2));
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor({ timeout: 10_000 });
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "changed playback speed is rejected");

  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "듣고 있어요" }).waitFor();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const a = window.__audios.at(-1);
    a.currentTime = Math.max(0, (Number.isFinite(a.duration) ? a.duration : 2.4) - 0.2);
  });
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor({ timeout: 10_000 });
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "skipping ahead is rejected");
}

// ---------- 8. Where the grant is required ----------
{
  const m = await login("mother", MOTHER);
  const post = (p, url, data, grant) =>
    p.request.post(`${BASE}${url}`, {
      headers: { origin: BASE, "content-type": "application/json", ...(grant ? { "x-room-grant": grant } : {}) },
      data,
    });
  const entry = (roomId) => ({ kind: "shared", roomId, title: "", body: `방${roomId} 글`, confirmShare: true });
  const proposal = { method: "call", date: "", time: "", location: "", companion: "", message: "", confirm: true };

  ok((await post(page, "/api/entries", entry(1))).status() === 201, "room 1 writing: no recording/grant needed");
  ok((await post(page, "/api/entries", entry(3))).status() === 201, "room 3 pre-gate thought: no grant needed");
  ok((await post(page, "/api/entries", entry(4))).status() === 403, "room 4 writing without a grant is refused");
  ok((await post(page, "/api/proposals", proposal)).status() === 403, "room 7 proposal without a grant is refused");

  await enterRoomUi(page, 7);
  const g7 = f.seen.grants.at(-1).grant;
  ok((await post(page, "/api/proposals", proposal, g7)).status() === 201, "room 7 proposal with this visit's grant works");
  ok((await post(page, "/api/entries", entry(7), g7)).status() === 201, "room 7 writing with the grant works");
  ok((await post(page, "/api/entries", entry(4), g7)).status() === 403, "room 7 grant is not valid for room 4");
  ok((await post(m.page, "/api/proposals", proposal, g7)).status() === 403, "father's grant is refused in mother's session");

  // Edit an existing room 4-7 entry from /notes later: own entry, no new recording needed.
  const created = await (await post(page, "/api/entries", entry(7), g7)).json();
  await page.goto(`${BASE}/rooms`); // leave room 7 -> visit ends
  ok(await eventually(() => count("room_grants") === 0), "leaving room 7 revokes its grant");
  ok((await post(page, "/api/proposals", proposal, g7)).status() === 403, "grant cannot be reused after leaving");
  const put = await page.request.put(`${BASE}/api/entries/${created.entry.id}`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { ...entry(7), body: "고친 글" },
  });
  ok(put.status() === 200, "editing one's own room 7 entry from /notes needs no grant");
  const steal = await m.page.request.put(`${BASE}/api/entries/${created.entry.id}`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { ...entry(7), body: "남의 글" },
  });
  ok(steal.status() === 404, "…but only by its owner");

  // Logout ends everything of the session.
  await enterRoomUi(page, 5);
  ok(count("room_grants") === 1, "grant exists while in room 5");
  await page.evaluate(() => fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }));
  ok(await eventually(() => count("room_grants") === 0), "logout revokes the session's grants");
  await m.context.close();
}

await browser.close();
console.log(failures ? `${failures} check(s) failed` : "All gate race/lifecycle checks passed");
process.exit(failures ? 1 : 0);
