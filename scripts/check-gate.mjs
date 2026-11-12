// Browser test of the room entry recording gate, using Chrome's fake microphone.
//   BASE_URL=http://localhost:3000 E2E_FATHER_PASSWORD=.. E2E_MOTHER_PASSWORD=.. node scripts/check-gate.mjs
// Fake media cannot prove real iPhone/Android behavior -- see the manual checklist in README.
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const FATHER = process.env.E2E_FATHER_PASSWORD;
const MOTHER = process.env.E2E_MOTHER_PASSWORD;
if (!FATHER || !MOTHER) {
  console.error("Set E2E_FATHER_PASSWORD and E2E_MOTHER_PASSWORD (never commit them).");
  process.exit(2);
}
const ORIGIN = new URL(BASE).origin;
const channel = process.env.BROWSER_CHANNEL ?? "chrome";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};

// Instrument media APIs so the test can see tracks / object URLs / uploads.
const INSTRUMENT = () => {
  window.__streams = [];
  window.__urls = { created: 0, revoked: 0 };
  const gum = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
  if (gum) {
    navigator.mediaDevices.getUserMedia = async (c) => {
      const s = await gum(c);
      window.__streams.push(s);
      return s;
    };
  }
  const c = URL.createObjectURL.bind(URL);
  const r = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (o) => {
    window.__urls.created++;
    return c(o);
  };
  URL.revokeObjectURL = (u) => {
    window.__urls.revoked++;
    return r(u);
  };
};

async function login(context, who, code) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login/${who}`);
  for (const d of code) await page.getByRole("button", { name: d, exact: true }).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), page.getByRole("button", { name: "들어가기" }).click()]);
  return page;
}

const heading = (page) => page.locator("main h1").first().innerText();
const btn = (page, name) => page.getByRole("button", { name, exact: true });

/** Walk preparation screens until the gate's ready screen. */
async function toGate(page, roomId) {
  await page.goto(`${BASE}/rooms/${roomId}`);
  for (let i = 0; i < 10; i++) {
    if ((await heading(page)) === "목소리로 확인하기") return true;
    // Choose the option that continues (e.g. "네, 들어볼게요", "노력 살펴보기", "다음", "편지 읽기"...)
    await page.locator("main .btn-primary").first().click();
  }
  return (await heading(page)) === "목소리로 확인하기";
}

async function recordAndListen(page, ms = 2200) {
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(ms);
  await btn(page, "녹음 끝내기").click();
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor({ timeout: 10_000 });
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "듣고 있어요" }).waitFor();
  await page.getByRole("heading", { name: "끝까지 들으셨어요" }).waitFor({ timeout: ms + 10_000 });
}

const browser = await chromium.launch({
  channel,
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=user-gesture-required"],
});

// ---------------------------------------------------------------- happy path + uploads
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"] });
  await context.addInitScript(INSTRUMENT);
  const page = await login(context, "father", FATHER);

  const requests = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") requests.push({ url: r.url(), type: r.headers()["content-type"] ?? "", body: r.postDataBuffer() });
  });

  ok(await toGate(page, 2), "room 2: preparation screens lead to the gate");
  ok((await page.locator("main").innerText()).includes("네 마음을 들어보고 싶어."), "gate shows the sentence to say");
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "no entry button before recording");
  ok((await page.locator("main").innerText()).includes("고마웠던 마음") === false, "no body before gate");

  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "no entry button while recording");
  await page.waitForTimeout(2200);
  await btn(page, "녹음 끝내기").click();
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor({ timeout: 10_000 });
  const tracksEnded = await page.evaluate(() => window.__streams.every((s) => s.getTracks().every((t) => t.readyState === "ended")));
  ok(tracksEnded, "microphone tracks stopped right after recording");
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "no entry button before listening");

  // Interrupt playback -> must listen again from the start
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "듣고 있어요" }).waitFor();
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "no entry button during playback");
  await page.waitForTimeout(600);
  await btn(page, "멈추기").click();
  await page.getByRole("heading", { name: "내 목소리 듣기" }).waitFor();
  ok((await page.locator("main [role=alert]").innerText()).includes("처음부터 다시"), "stopping mid-playback asks to listen again");
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "interrupted playback does not unlock entry");

  // Full playback
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "끝까지 들으셨어요" }).waitFor({ timeout: 15_000 });
  ok((await btn(page, "이 마음으로 들어가기").count()) === 1, "entry button only after full playback");

  // Re-record invalidates
  await btn(page, "다시 녹음하기").click();
  ok((await heading(page)) === "목소리로 확인하기", "re-record returns to the start of the gate");
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0, "re-record removes the entry button");

  await recordAndListen(page);
  let enterBody = null;
  page.on("request", (r) => {
    if (r.url().includes("/enter")) enterBody = r.postData();
  });
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByRole("heading", { name: "네 마음을 들어볼게" }).waitFor({ timeout: 10_000 });
  const main = await page.locator("main").innerText();
  ok(main.includes("고마웠던 마음") && main.includes("그래도 바라는 것"), "room body (cards) visible after the gate");

  const urls = await page.evaluate(() => window.__urls);
  ok(urls.created > 0 && urls.created === urls.revoked, `object URLs revoked after entering (${urls.revoked}/${urls.created})`);
  const audioUpload = requests.some((r) => /audio|octet|multipart/.test(r.type) || (r.body && r.body.length > 2000));
  ok(!audioUpload, "no audio uploaded (only small JSON / empty requests)");
  const parsed = JSON.parse(enterBody ?? "{}");
  ok(Object.keys(parsed).sort().join(",") === "attemptId,recordedMs,visitId", "enter request carries only visitId + attemptId + recordedMs");

  // Card navigation is in-app (not a re-entry)
  await btn(page, "고마웠던 마음").click();
  await page.getByRole("heading", { name: "고마웠던 마음" }).waitFor();
  await btn(page, "다른 이야기 보기").click();
  ok((await heading(page)) === "네 마음을 들어볼게", "card navigation stays inside the room");

  // Replay the used attempt: same room / other room
  const replay = (room, data, req = page.request) =>
    req.post(`${BASE}/api/rooms/${room}/enter`, { headers: { origin: ORIGIN, "content-type": "application/json" }, data });
  ok((await replay(2, parsed)).status() === 409, "reused attempt token rejected");
  ok((await replay(3, parsed)).status() === 409, "token for room 2 rejected for room 3");

  // Refresh -> back to preparation, no body in HTML
  await page.reload();
  ok((await page.locator("main").innerText()).includes("고마웠던 마음") === false, "refresh: body gone");
  ok((await page.locator("main").innerText()).includes("준비 1 /"), "refresh: starts again from preparation");

  // Enter again, go to list, browser back -> must record again
  await toGate(page, 2);
  await recordAndListen(page);
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByRole("heading", { name: "네 마음을 들어볼게" }).waitFor();
  await page.getByRole("link", { name: "방 목록" }).click();
  await page.waitForURL(/\/rooms$/);
  await page.goBack();
  await page.waitForURL(/\/rooms\/2$/);
  await page.locator("main h1").waitFor();
  ok((await page.locator("main").innerText()).includes("고마웠던 마음") === false, "back button: body not restored");
  await page.goForward();
  await page.waitForURL(/\/rooms$/);
  ok(true, "forward navigation ok");

  // Other room re-entry needs its own recording
  await page.goto(`${BASE}/rooms/4`);
  ok((await page.locator("main").innerText()).includes("부모님께 빌린 돈") === false, "room 4 not open from room 2's entry");

  // Another account cannot use this session's attempt
  const ctxM = await browser.newContext({ permissions: ["microphone"] });
  const mPage = await login(ctxM, "mother", MOTHER);
  const visitId = "e2e-visit-" + Date.now();
  const attemptRes = await page.request.post(`${BASE}/api/rooms/5/attempt`, {
    headers: { origin: ORIGIN, "content-type": "application/json" },
    data: { visitId, seq: Date.now() + 1000 },
  });
  const { attemptId } = await attemptRes.json();
  await page.waitForTimeout(2500);
  ok(
    (await replay(5, { visitId, attemptId, recordedMs: 1000 }, mPage.request)).status() === 409,
    "father's attempt rejected for mother's session",
  );
  ok((await replay(5, { visitId: "e2e-other-visit", attemptId, recordedMs: 1000 })).status() === 409, "attempt rejected for another visit");
  ok((await replay(5, { visitId, attemptId, recordedMs: 1000 })).status() === 200, "…but valid for its own session/room/visit");
  await ctxM.close();

  // Cross-origin enter is refused
  const evil = await page.request.post(`${BASE}/api/rooms/5/enter`, {
    headers: { origin: "https://evil.example", "content-type": "application/json" },
    data: { visitId, attemptId, recordedMs: 1000 },
  });
  ok(evil.status() === 403, "cross-origin enter refused");

  // Session ends mid-gate -> no entry
  await toGate(page, 6);
  await recordAndListen(page);
  await context.clearCookies();
  await btn(page, "이 마음으로 들어가기").click();
  await page.locator("main [role=alert]").waitFor();
  ok((await page.locator("main [role=alert]").innerText()).includes("로그인"), "expired session: asked to log in, body not shown");
  ok((await page.locator("main").innerText()).includes("제가 미안한 일") === false, "expired session: no body");
  await context.close();
}

// ---------------------------------------------------------------- unauthenticated API
{
  const context = await browser.newContext();
  const page = await context.newPage();
  const r1 = await page.request.post(`${BASE}/api/rooms/2/attempt`, { headers: { origin: ORIGIN } });
  ok(r1.status() === 401, "attempt API requires login");
  const r2 = await page.request.post(`${BASE}/api/rooms/2/enter`, {
    headers: { origin: ORIGIN, "content-type": "application/json" },
    data: { attemptId: "x", recordedMs: 2000 },
  });
  ok(r2.status() === 401, "enter API requires login");
  await context.close();
}

// ---------------------------------------------------------------- room 1 has no gate; attempt API refuses it
{
  const context = await browser.newContext();
  const page = await login(context, "mother", MOTHER);
  await page.goto(`${BASE}/rooms/1`);
  ok((await heading(page)) === "아직 화가 나요" && (await btn(page, "녹음 시작하기").count()) === 0, "room 1 opens without recording");
  const r = await page.request.post(`${BASE}/api/rooms/1/attempt`, { headers: { origin: ORIGIN } });
  ok(r.status() === 404, "no gate endpoint for room 1");
  await context.close();
}
await browser.close();

// ---------------------------------------------------------------- mic denied (no fake UI => prompt is denied)
{
  const b = await chromium.launch({ channel, headless: true, args: ["--use-fake-device-for-media-stream", "--deny-permission-prompts"] });
  const context = await b.newContext();
  const page = await login(context, "father", FATHER);
  await toGate(page, 3);
  await btn(page, "녹음 시작하기").click();
  await page.locator("main [role=alert]").waitFor({ timeout: 10_000 });
  const t = await page.locator("main").innerText();
  ok(t.includes("마이크 사용이 허락되지"), "mic denied: clear explanation");
  ok((await btn(page, "다시 녹음 시작하기").count()) === 1 && (await btn(page, "방 목록으로").count()) === 1, "mic denied: retry + room list only");
  ok((await btn(page, "이 마음으로 들어가기").count()) === 0 && !t.includes("건강을 돌보는 노력"), "mic denied: no way in");
  ok(!/글로 확인|건너뛰|바로 입장/.test(t), "mic denied: no text alternative / skip");
  await context.close();

  // unsupported browser (no MediaRecorder)
  const c2 = await b.newContext();
  await c2.addInitScript(() => {
    delete window.MediaRecorder;
  });
  const p2 = await login(c2, "father", FATHER);
  await toGate(p2, 7);
  await btn(p2, "녹음 시작하기").click();
  await p2.locator("main [role=alert]").waitFor();
  ok((await p2.locator("main [role=alert]").innerText()).includes("녹음을 할 수 없어요"), "unsupported browser: explanation, no bypass");
  ok((await btn(p2, "이 마음으로 들어가기").count()) === 0, "unsupported browser: no entry");
  await c2.close();
  await b.close();
}

console.log(failures ? `${failures} check(s) failed` : "All gate checks passed");
process.exit(failures ? 1 : 0);
