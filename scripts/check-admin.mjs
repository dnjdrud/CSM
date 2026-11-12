// Stage 5 end-to-end: content publishing, proposal answers, server-side logout,
// unauthenticated / cross-role API access.
//   BASE_URL=... E2E_FATHER_PASSWORD=<아빠> E2E_MOTHER_PASSWORD=<엄마> E2E_ADMIN_PASSWORD=<관리자> \
//   FAMILY_DB_PATH=<the server's db file> node scripts/check-admin.mjs
// Use a throwaway database: this script publishes test text and creates proposals.
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

const args = ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"];
const browser = await chromium
  .launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome", headless: true, args })
  .catch(() => chromium.launch({ channel: "msedge", headless: true, args }));
const btn = (page, name) => page.getByRole("button", { name, exact: true });

async function parent(who, code) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"] });
  const page = await context.newPage();
  await page.goto(`${BASE}/login/${who}`);
  for (const d of code) await btn(page, d).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), btn(page, "들어가기").click()]);
  return { context, page };
}

async function son() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.getByLabel(/비밀번호/).fill(ADMIN);
  await Promise.all([page.waitForURL(/\/admin$/), btn(page, "관리자 로그인").click()]);
  return { context, page };
}

async function enterRoom(page, roomId) {
  await page.goto(`${BASE}/rooms/${roomId}`);
  for (let i = 0; i < 10 && (await page.locator("main h1").first().innerText()) !== "목소리로 확인하기"; i++)
    await page.locator("main .btn-primary").first().click();
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  await btn(page, "녹음 끝내기").click();
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "끝까지 들으셨어요" }).waitFor({ timeout: 15_000 });
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByText(/읽고 싶은 이야기를 골라주세요|어떻게 이야기할까요\?/).first().waitFor({ timeout: 15_000 });
}

const DRAFT = "검토중인초안문장" + Date.now();
const PUBLISHED = "게시된문장" + Date.now();

// ---------- Content: draft hidden, publish shown, unpublish hidden ----------
const s = await son();
const f = await parent("father", FATHER);
{
  const { page } = s;
  await page.goto(`${BASE}/admin/content`);
  ok((await page.getByText("게시 전 (부모님께 안 보임)").count()) > 0, "content list shows unpublished drafts");
  await page.goto(`${BASE}/admin/content/${encodeURIComponent("card.2.thanks")}`);
  await page.getByLabel("본문").fill(DRAFT);
  await btn(page, "초안 저장 (부모님께 안 보임)").click();
  await page.getByText("초안을 저장했어요.").waitFor();
  ok(true, "son saved a draft");

  await enterRoom(f.page, 2);
  await btn(f.page, "고마웠던 마음").click();
  ok((await f.page.getByText(DRAFT).count()) === 0 && (await f.page.getByText("아들이 이 이야기를 준비하고 있어요.").count()) === 1, "parent does not see the saved draft");

  await page.getByLabel("본문").fill(`${PUBLISHED}\n\n두 번째 문단 <script>alert(1)</script>`);
  await btn(page, "이 내용으로 게시하기").click();
  await page.getByText("게시했어요.").waitFor();

  await enterRoom(f.page, 2);
  await btn(f.page, "고마웠던 마음").click();
  ok((await f.page.getByText(PUBLISHED).count()) === 1, "parent sees published text after the gate");
  ok((await f.page.getByText("<script>alert(1)</script>", { exact: false }).count()) === 1, "published text is shown as text, not HTML");
  await f.page.goto(`${BASE}/rooms/2`);
  ok(!(await f.page.content()).includes(PUBLISHED), "published card text is still not in the page before the gate");

  // Room 3 letter (pre-gate) publish.
  await page.goto(`${BASE}/admin/content/${encodeURIComponent("letter.room3-pre")}`);
  await page.getByLabel("본문").fill("게시한 감사 편지");
  await btn(page, "이 내용으로 게시하기").click();
  await page.getByText("게시했어요.").waitFor();
  await f.page.goto(`${BASE}/rooms/3`);
  for (const n of ["다음", "편지 읽기"]) await btn(f.page, n).click();
  ok((await f.page.getByText("게시한 감사 편지").count()) === 1, "published room 3 letter appears before the gate (allowed)");

  // Unpublish hides it again.
  await page.goto(`${BASE}/admin/content/${encodeURIComponent("card.2.thanks")}`);
  await btn(page, "게시 내리기").click();
  await page.getByText("게시를 내렸어요.").waitFor();
  await enterRoom(f.page, 2);
  await btn(f.page, "고마웠던 마음").click();
  ok((await f.page.getByText(PUBLISHED).count()) === 0, "after 게시 내리기 the parent no longer sees it");

  // Section card: headings fixed, empty = 준비 중.
  await page.goto(`${BASE}/admin/content/${encodeURIComponent("card.3.repayment")}`);
  ok((await page.getByLabel("확인된 변화").count()) === 1, "section cards edit per fixed heading");
}

// ---------- Proposals: answers stay in the app ----------
{
  const m = await parent("mother", MOTHER);
  // Proposals are made inside room 7: enter it (record + listen) and use that visit's grant.
  let grant7 = null;
  m.page.on("response", async (r) => {
    if (r.url().endsWith("/api/rooms/7/enter") && r.ok()) grant7 = (await r.json()).grant;
  });
  await enterRoom(m.page, 7);
  const post = (data) =>
    m.page.request.post(`${BASE}/api/proposals`, {
      headers: { origin: BASE, "content-type": "application/json", "x-room-grant": grant7 },
      data: { ...data, confirm: true },
    });
  for (const message of ["첫 제안", "둘째 제안", "셋째 제안"])
    await post({ method: "call", date: "", time: "", location: "", companion: "", message });

  const { page } = s;
  await page.goto(`${BASE}/admin/proposals`);
  const card = (text) => page.locator("li", { hasText: text });
  await card("첫 제안").getByLabel(/부모님께 남길 말/).fill("좋아요, 전화드릴게요");
  await card("첫 제안").getByRole("button", { name: "수락하기" }).click();
  await page.getByText("수락했어요.").waitFor();

  const seoulNow = new Date(Date.now() + 9 * 3600_000);
  const tomorrow = new Date(seoulNow.getTime() + 86400_000).toISOString().slice(0, 10);
  await card("둘째 제안").getByLabel("날짜").fill(tomorrow);
  await card("둘째 제안").getByRole("button", { name: "이 시간으로 다시 제안하기" }).click();
  await page.getByText("날짜와 시간을 모두 골라주세요.").waitFor();
  ok(true, "other time without a time is rejected");
  await card("둘째 제안").getByLabel("날짜").fill(tomorrow);
  await card("둘째 제안").getByLabel("시간").fill("20:00");
  await card("둘째 제안").getByRole("button", { name: "이 시간으로 다시 제안하기" }).click();
  await page.getByText("다른 시간을 제안했어요.").waitFor();
  await card("셋째 제안").getByRole("link", { name: "이번 제안은 어렵다고 답하기" }).click();
  await page.getByText("정말 취소할까요?").waitFor();
  await page.getByRole("button", { name: "네, 취소할게요", exact: true }).click();
  await page.getByText("취소했어요.", { exact: false }).first().waitFor();

  const rows = query("SELECT message, status, son_message, cancelled_by FROM proposals ORDER BY message");
  const by = Object.fromEntries(rows.map((r) => [r.message, r]));
  ok(by["첫 제안"].status === "accepted" && by["첫 제안"].son_message === "좋아요, 전화드릴게요", "son accepted with a message");
  ok(by["둘째 제안"].status === "other_time", "son proposed another time");
  ok(by["셋째 제안"].status === "cancelled" && by["셋째 제안"].cancelled_by === "son", "son declined");

  await m.page.goto(`${BASE}/notes`);
  await m.page.getByRole("heading", { name: "내가 한 대화 제안" }).waitFor();
  const t = await m.page.locator("main").innerText();
  ok(t.includes("아들이 수락했어요") && t.includes("좋아요, 전화드릴게요"), "mother sees the acceptance and message");
  ok(t.includes("아들이 다른 시간을 제안했어요") && t.includes("아들이 제안한 시간"), "mother sees the other time");
  ok(t.includes("아들이 이번 제안은 어렵다고 했어요"), "mother sees the decline");
  await btn(m.page, "아들이 제안한 시간으로 할게요").click();
  await m.page.getByText("아들이 제안한 시간으로 할게요").waitFor({ state: "detached" });
  ok(query("SELECT status FROM proposals WHERE message = '둘째 제안'")[0].status === "accepted", "mother accepted the son's time");

  // Answering again / answering a closed proposal is refused.
  const closed = query("SELECT id FROM proposals WHERE message = '셋째 제안'")[0].id;
  const again = await s.page.request.post(`${BASE}/api/admin/proposals/${closed}`, { headers: { origin: BASE }, form: { action: "accept", message: "" }, maxRedirects: 0 });
  ok(again.status() === 303 && (again.headers().location ?? "").includes("not_allowed"), "cancelled proposal cannot be answered again");
  // Parent cannot use the son's answer endpoint.
  const asParent = await m.page.request.post(`${BASE}/api/admin/proposals/${closed}`, { headers: { origin: BASE }, form: { action: "accept" }, maxRedirects: 0 });
  ok(asParent.status() === 401, `parent cannot answer as the son (${asParent.status()})`);
  const parentContent = await m.page.request.post(`${BASE}/api/admin/content`, {
    headers: { origin: BASE },
    form: { key: "card.2.thanks", action: "publish", body: "x" },
    maxRedirects: 0,
  });
  ok(parentContent.status() === 401, `parent cannot publish content (${parentContent.status()})`);
  const pg = await m.page.goto(`${BASE}/admin/content`);
  ok(new URL(m.page.url()).pathname !== "/admin/content" || pg.status() >= 300, "parent cannot open the admin content page");
  await m.context.close();
}

// ---------- Unauthenticated access ----------
{
  const anon = await browser.newContext();
  const r = anon.request;
  const results = [
    ["GET /api/entries", await r.get(`${BASE}/api/entries`)],
    ["GET /api/keyring", await r.get(`${BASE}/api/keyring`)],
    ["GET /api/proposals", await r.get(`${BASE}/api/proposals`)],
    ["POST /api/entries", await r.post(`${BASE}/api/entries`, { headers: { origin: BASE }, data: {} })],
    ["POST /api/proposals", await r.post(`${BASE}/api/proposals`, { headers: { origin: BASE }, data: {} })],
    ["POST /api/rooms/2/attempt", await r.post(`${BASE}/api/rooms/2/attempt`, { headers: { origin: BASE }, data: {} })],
    ["POST /api/rooms/2/enter", await r.post(`${BASE}/api/rooms/2/enter`, { headers: { origin: BASE }, data: {} })],
    ["POST /api/admin/content", await r.post(`${BASE}/api/admin/content`, { headers: { origin: BASE }, form: { key: "x" }, maxRedirects: 0 })],
  ];
  for (const [name, res] of results) ok([401, 403].includes(res.status()), `unauthenticated ${name} -> ${res.status()}`);
  await anon.close();
}

// ---------- Logout really ends the session (copied cookie is rejected) ----------
{
  const cookies = await f.context.cookies();
  const session = cookies.find((c) => c.name === "fh_session");
  await f.page.goto(`${BASE}/rooms`);
  await f.page.getByRole("button", { name: "나가기 (로그아웃)" }).click();
  await f.page.waitForURL(/\/login/);
  const replay = await browser.newContext();
  await replay.addCookies([{ ...session }]);
  const p = await replay.newPage();
  await p.goto(`${BASE}/rooms`);
  ok(new URL(p.url()).pathname === "/login", "a copied cookie stops working after logout");
  const api = await p.request.get(`${BASE}/api/entries`);
  ok(api.status() === 401, `copied cookie rejected by APIs after logout (${api.status()})`);
  ok(query("SELECT revoked_at FROM sessions WHERE revoked_at IS NOT NULL").length >= 1, "session record revoked in the database");
  await replay.close();
}

// ---------- Database: no plaintext of sealed entries, no recordings ----------
{
  const tables = query("SELECT name FROM sqlite_master WHERE type = 'table'").map((t) => t.name);
  ok(!tables.some((t) => /audio|voice|record/i.test(t)), `no recording tables (${tables.join(", ")})`);
  ok(query("SELECT * FROM entries WHERE kind = 'sealed' AND (title IS NOT NULL OR body IS NOT NULL)").length === 0, "sealed entries have no plaintext columns");
  ok(JSON.stringify(query("SELECT * FROM login_buckets")).match(/127\.0\.0\.1|::1/) === null, "client addresses are not stored in plain form");
}

await s.context.close();
await browser.close();
console.log(failures ? `${failures} check(s) failed` : "All stage 5 checks passed");
process.exit(failures ? 1 : 0);
