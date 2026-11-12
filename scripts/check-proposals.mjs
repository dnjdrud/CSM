// Proposal state changes (son/parent), admin cancel with confirmation, MyProposals loading /
// error / retry / double-click, and JSON body validation on every JSON API.
//   BASE_URL=... E2E_FATHER_PASSWORD=<test> E2E_MOTHER_PASSWORD=<test> E2E_ADMIN_PASSWORD=<test> \
//   FAMILY_DB_PATH=<server's TEST db> node scripts/check-proposals.mjs
// Test-only credentials and a throwaway database (this script also inserts a past-time row).
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const { E2E_FATHER_PASSWORD: FATHER, E2E_MOTHER_PASSWORD: MOTHER, E2E_ADMIN_PASSWORD: ADMIN, FAMILY_DB_PATH: DB } = process.env;
if (!FATHER || !MOTHER || !ADMIN || !DB) {
  console.error("Set E2E_FATHER_PASSWORD, E2E_MOTHER_PASSWORD, E2E_ADMIN_PASSWORD and FAMILY_DB_PATH (test values only).");
  process.exit(2);
}

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};
const db = (fn) => {
  const d = new DatabaseSync(DB);
  try {
    return fn(d);
  } finally {
    d.close();
  }
};
const row = (id) => db((d) => d.prepare("SELECT status, cancelled_by FROM proposals WHERE id = ?").get(id));

const args = ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"];
const browser = await chromium
  .launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome", headless: true, args })
  .catch(() => chromium.launch({ channel: "msedge", headless: true, args }));
const btn = (p, name) => p.getByRole("button", { name, exact: true });

async function parent(who, code) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"] });
  const page = await context.newPage();
  await page.goto(`${BASE}/login/${who}`);
  for (const d of code) await btn(page, d).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), btn(page, "들어가기").click()]);
  return { context, page };
}
async function grant7(page) {
  let g = null;
  page.on("response", async (r) => {
    if (r.url().endsWith("/api/rooms/7/enter") && r.ok()) g = (await r.json()).grant;
  });
  await page.goto(`${BASE}/rooms/7`);
  for (let i = 0; i < 10 && (await page.locator("main h1").first().innerText()) !== "목소리로 확인하기"; i++) await page.locator("main .btn-primary").first().click();
  await btn(page, "녹음 시작하기").click();
  await page.getByRole("heading", { name: "녹음하고 있어요" }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  await btn(page, "녹음 끝내기").click();
  await btn(page, "내 목소리 듣기").click();
  await page.getByRole("heading", { name: "끝까지 들으셨어요" }).waitFor({ timeout: 15_000 });
  await btn(page, "이 마음으로 들어가기").click();
  await page.getByText("어떻게 이야기할까요?").waitFor({ timeout: 15_000 });
  return g;
}
const seoulTomorrow = () => new Date(Date.now() + 9 * 3600_000 + 86400_000).toISOString().slice(0, 10);

// ---------- JSON body validation (no 500s) ----------
{
  const anon = await browser.newContext();
  const { page: fp, context: fc } = await parent("father", FATHER);
  const send = (req, url, data, method = "post") =>
    req[method](`${BASE}${url}`, { headers: { origin: BASE, "content-type": "application/json" }, data, failOnStatusCode: false });
  const bodies = ["null", "[]", "[1,2]", '"text"', "42", "true", "{broken"];
  const targets = [
    [anon.request, "/api/auth/login"],
    [anon.request, "/api/auth/admin"],
    [fp.request, "/api/rooms/2/attempt"],
    [fp.request, "/api/rooms/2/enter"],
    [fp.request, "/api/rooms/leave"],
    [fp.request, "/api/entries"],
    [fp.request, "/api/keyring"],
    [fp.request, "/api/proposals"],
  ];
  for (const [req, url] of targets) {
    const codes = [];
    for (const b of bodies) codes.push((await send(req, url, b)).status());
    const fine = codes.every((c) => c === 400 || (url === "/api/proposals" && c === 403));
    ok(fine, `${url}: null/array/primitive/malformed JSON -> 400, never 500 (${codes.join(",")})`);
  }
  const patch = await send(fp.request, `/api/proposals/${randomUUID()}`, "null", "patch");
  ok(patch.status() === 400, `/api/proposals/[id] PATCH null -> 400 (${patch.status()})`);
  const big = await send(anon.request, "/api/auth/login", JSON.stringify({ role: "father", password: "1".repeat(20_000) }));
  ok(big.status() === 413, `oversized login body -> 413 (${big.status()})`);
  await anon.close();
  await fc.close();
}

// ---------- set up proposals (mother, via room 7) ----------
const m = await parent("mother", MOTHER);
const g = await grant7(m.page);
const create = async (message, date = "", time = "") => {
  const r = await m.page.request.post(`${BASE}/api/proposals`, {
    headers: { origin: BASE, "content-type": "application/json", "x-room-grant": g },
    data: { method: "call", date, time, location: "", companion: "", message, confirm: true },
  });
  return (await r.json()).proposal.id;
};
const pAccept = await create("수락 후 취소할 제안", seoulTomorrow(), "19:00");
const pOther = await create("다른 시간 후 취소할 제안");
const pNoTime = await create("시간 미정 제안");
// A proposal whose time has already passed (inserted directly into the TEST database).
const pPast = randomUUID();
db((d) =>
  d
    .prepare(
      "INSERT INTO proposals (id, owner, method, proposed_at, timezone, location, companion, message, status, created_at, updated_at) VALUES (?, 'mother', 'call', ?, 'Asia/Seoul', '', '', '지난 시간 제안', 'proposed', ?, ?)",
    )
    .run(pPast, Date.now() - 60_000, Date.now() - 120_000, Date.now() - 120_000),
);

// ---------- son ----------
const sc = await browser.newContext({ viewport: { width: 390, height: 844 } });
const s = await sc.newPage();
await s.goto(`${BASE}/admin/login`);
await s.getByLabel(/비밀번호/).fill(ADMIN);
await Promise.all([s.waitForURL(/\/admin$/), btn(s, "관리자 로그인").click()]);
await s.goto(`${BASE}/admin/proposals`);
const card = (text) => s.locator("li", { hasText: text });

{
  // Past time: no accept button; a forced accept is refused and the status stays 제안 중.
  ok((await card("지난 시간 제안").getByRole("button", { name: "수락하기" }).count()) === 0, "past-time proposal: no 수락 button");
  ok((await card("지난 시간 제안").innerText()).includes("이미 지난 시간"), "past-time proposal is marked");
  const forced = await s.request.post(`${BASE}/api/admin/proposals/${pPast}`, { headers: { origin: BASE }, form: { action: "accept", message: "" }, maxRedirects: 0 });
  ok((forced.headers().location ?? "").includes("m=past_time") && row(pPast).status === "proposed", "forced accept of a past time -> past_time, stays proposed");

  // No-time proposal can be accepted.
  await card("시간 미정 제안").getByRole("button", { name: "수락하기" }).click();
  await s.getByText("수락했어요.").waitFor();
  ok(row(pNoTime).status === "accepted", "proposal without a time can be accepted");

  // Future proposal: accept, then cancel with the confirmation step.
  await card("수락 후 취소할 제안").getByRole("button", { name: "수락하기" }).click();
  await s.getByText("수락했어요.").waitFor();
  const noConfirm = await s.request.post(`${BASE}/api/admin/proposals/${pAccept}`, { headers: { origin: BASE }, form: { action: "cancel" }, maxRedirects: 0 });
  ok((noConfirm.headers().location ?? "").includes("confirm_required") && row(pAccept).status === "accepted", "cancel without the confirmation step is refused");
  await card("수락 후 취소할 제안").getByRole("link", { name: "이 약속 취소하기" }).click();
  await s.getByText("정말 취소할까요?").waitFor();
  await card("수락 후 취소할 제안").getByLabel(/부모님께 남길 말/).fill("이번엔 어려워요");
  await btn(s, "네, 취소할게요").click();
  await s.getByText("취소했어요.").waitFor();
  ok(row(pAccept).status === "cancelled" && row(pAccept).cancelled_by === "son", "accepted -> cancelled by son (after confirmation)");
  ok((await card("수락 후 취소할 제안").getByRole("link", { name: /취소/ }).count()) === 0, "cancelled proposal has no further actions");
  const revive = await s.request.post(`${BASE}/api/admin/proposals/${pAccept}`, { headers: { origin: BASE }, form: { action: "accept" }, maxRedirects: 0 });
  ok((revive.headers().location ?? "").includes("not_allowed") && row(pAccept).status === "cancelled", "accept after cancel is refused; stays cancelled");

  // other_time, then cancel.
  await card("다른 시간 후 취소할 제안").getByLabel("날짜").fill(seoulTomorrow());
  await card("다른 시간 후 취소할 제안").getByLabel("시간").fill("20:00");
  await card("다른 시간 후 취소할 제안").getByRole("button", { name: "이 시간으로 다시 제안하기" }).click();
  await s.getByText("다른 시간을 제안했어요.").waitFor();
  await card("다른 시간 후 취소할 제안").getByRole("link", { name: "이 약속 취소하기" }).click();
  await btn(s, "네, 취소할게요").click();
  await s.getByText("취소했어요.").waitFor();
  ok(row(pOther).status === "cancelled" && row(pOther).cancelled_by === "son", "other_time -> cancelled by son");
}

// ---------- parent side: only the owner sees it; other parent refused ----------
{
  const f = await parent("father", FATHER);
  const list = await (await f.page.request.get(`${BASE}/api/proposals`)).json();
  ok(list.proposals.length === 0, "father does not see mother's proposals or the son's answers");
  const r = await f.page.request.patch(`${BASE}/api/proposals/${pNoTime}`, { headers: { origin: BASE, "content-type": "application/json" }, data: { action: "cancel" } });
  ok(r.status() === 404 && row(pNoTime).status === "accepted", `other parent cannot cancel (${r.status()})`);
  await f.context.close();

  await m.page.goto(`${BASE}/notes`);
  await m.page.getByRole("heading", { name: "내가 한 대화 제안" }).waitFor();
  await m.page.getByText("아들이 이번 제안은 어렵다고 했어요").first().waitFor();
  const t = await m.page.locator("main").innerText();
  ok(t.includes("이번엔 어려워요"), "mother sees the son's cancel message");

  // Double click on 네, 취소할게요 -> exactly one PATCH.
  let patches = 0;
  m.page.on("request", (q) => q.method() === "PATCH" && q.url().includes("/api/proposals/") && patches++);
  const item = m.page.locator("li", { hasText: "시간 미정 제안" });
  await item.getByRole("button", { name: "제안 취소하기" }).click();
  await item.getByRole("button", { name: "네, 취소할게요" }).dblclick();
  await m.page.locator("li", { hasText: "시간 미정 제안" }).getByText("취소했어요").waitFor();
  ok(patches === 1, `double click sends one request (${patches})`);
  ok(row(pNoTime).status === "cancelled" && row(pNoTime).cancelled_by === "parent", "parent cancelled an accepted proposal");
}

// ---------- MyProposals: loading failure, retry ----------
{
  await m.page.route("**/api/proposals", (route) =>
    route.request().method() === "GET" ? route.fulfill({ status: 500, body: "{}", contentType: "application/json" }) : route.continue(),
  );
  await m.page.goto(`${BASE}/notes`);
  await m.page.getByText("대화 제안을 불러오지 못했어요.").waitFor();
  ok((await btn(m.page, "다시 불러오기").count()) === 1, "load failure is shown with a retry button");
  await m.page.unroute("**/api/proposals");
  await btn(m.page, "다시 불러오기").click();
  await m.page.locator("li", { hasText: "시간 미정 제안" }).waitFor();
  ok((await m.page.getByText("대화 제안을 불러오지 못했어요.").count()) === 0, "retry loads the list");
}

// ---------- empty list is distinct from failure ----------
{
  const f = await parent("father", FATHER);
  await f.page.goto(`${BASE}/notes`);
  await f.page.getByText("아직 한 대화 제안이 없어요.").waitFor();
  ok((await f.page.getByText("불러오지 못했어요").count()) === 0, "empty list shows 'none yet', not an error");
  await f.context.close();
}

await browser.close();
console.log(failures ? `${failures} check(s) failed` : "All proposal checks passed");
process.exit(failures ? 1 : 0);
