// End-to-end check of rooms 1 and 3 writing, personal-password encryption and the son's view.
//   BASE_URL=http://localhost:3000 E2E_FATHER_PASSWORD=<아빠> E2E_MOTHER_PASSWORD=<엄마> \
//   E2E_ADMIN_PASSWORD=<관리자> FAMILY_DB_PATH=<the server's db file> node scripts/check-writing.mjs
// Use a throwaway database: this script creates and deletes entries and resets personal passwords.
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

const PERSONAL = "개인비번-test-7731";
const SECRET_TEXT = "아무에게도 보이면 안 되는 마음 " + Date.now();
const SHARED_TEXT = "아들에게 전하는 글 " + Date.now();

const browser = await chromium
  .launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome", headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] })
  .catch(() => chromium.launch({ channel: "msedge", headless: true }));

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};
const db = () => new DatabaseSync(DB, { readOnly: true });
const rows = () => {
  const d = db();
  try {
    return d.prepare("SELECT * FROM entries").all();
  } finally {
    d.close();
  }
};

async function parentContext(role, code) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  // Record every request body to prove the personal password / sealed text never leave the tab.
  const sent = [];
  page.on("request", (r) => sent.push(`${r.method()} ${r.url()} ${r.postData() ?? ""}`));
  await page.goto(`${BASE}/login/${role}`);
  for (const d of code) await page.getByRole("button", { name: d, exact: true }).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), page.getByRole("button", { name: "들어가기" }).click()]);
  return { context, page, sent };
}

const btn = (page, name) => page.getByRole("button", { name, exact: true });

// ---------- Father: room 1, 나만 간직하기 ----------
const f = await parentContext("father", FATHER);
{
  const { page } = f;
  await page.goto(`${BASE}/rooms/1`);
  ok((await page.getByRole("heading", { name: "아직 화가 나요" }).count()) === 1, "room 1 opens without recording");
  ok((await btn(page, "녹음 시작하기").count()) === 0, "room 1 has no recording step");
  await btn(page, "내 마음 적기").click();

  const radios = page.locator('input[type=radio][name$="-vis"]');
  ok((await radios.count()) === 2, "two visibility options");
  ok((await radios.evaluateAll((els) => els.filter((e) => e.checked).length)) === 0, "no visibility pre-selected");

  await btn(page, "다시 읽기").click();
  ok((await page.locator("main [role=alert]").innerText()).includes("내용을 적어주세요"), "body is required");
  await page.getByLabel(/내용/).fill(SECRET_TEXT);
  await btn(page, "다시 읽기").click();
  ok((await page.locator("main [role=alert]").innerText()).includes("하나를 골라주세요"), "visibility choice is required before saving");

  await page.getByText("서운했던 일", { exact: true }).click();
  await page.getByText("나만 간직하기", { exact: true }).click();
  await btn(page, "다시 읽기").click();
  ok((await page.getByText(SECRET_TEXT).count()) === 1, "다시 읽기 shows the text");
  await btn(page, "나만 간직하기로 저장하기").click();

  await page.getByRole("heading", { name: "개인 비밀번호 만들기" }).waitFor();
  ok((await page.getByText("잊어버리면 누구도 되찾아 드릴 수 없어요.").count()) === 1, "unrecoverable warning shown");
  await page.getByLabel(/개인 비밀번호 \(/).fill(PERSONAL);
  await page.getByLabel("한 번 더 적어주세요").fill(PERSONAL + "x");
  await btn(page, "만들기").click();
  ok((await page.locator("main [role=alert]").innerText()).includes("서로 달라요"), "mismatched confirmation rejected");
  await page.getByLabel("한 번 더 적어주세요").fill(PERSONAL);
  await btn(page, "만들기").click();
  await page.getByRole("heading", { name: "나만 간직하는 글로 저장했어요." }).waitFor({ timeout: 20000 });
  ok(true, "sealed entry saved");

  const r = rows();
  ok(r.length === 1 && r[0].kind === "sealed" && r[0].title === null && r[0].body === null, "DB row is sealed with no plaintext columns");
  ok(!JSON.stringify(r).includes(SECRET_TEXT) && !JSON.stringify(r).includes("서운했던"), "DB has no plaintext title/body");
  const k = db().prepare("SELECT * FROM keyrings").all();
  ok(k.length === 1 && !JSON.stringify(k).includes(PERSONAL), "keyring stored without the password");
  ok(!f.sent.some((s) => s.includes(PERSONAL)), "personal password never sent to the server");
  ok(!f.sent.some((s) => s.includes(SECRET_TEXT)), "sealed text never sent in plaintext");

  // Reload: key is gone (memory only) -> list shows locked entry without its title.
  await page.goto(`${BASE}/notes`);
  await page.getByRole("heading", { name: "내가 적은 글" }).waitFor();
  await page.getByText("잠긴 글", { exact: true }).first().waitFor();
  ok((await page.getByText("서운했던 일").count()) === 0, "after reload the title stays hidden until unlock");
  await btn(page, "개인 비밀번호로 잠긴 글 열기").click();
  await page.getByLabel("개인 비밀번호").fill("wrong-password");
  await btn(page, "열기").click();
  await page.locator("main [role=alert]").waitFor({ timeout: 20000 });
  ok((await page.locator("main [role=alert]").innerText()).includes("맞지 않아요"), "wrong personal password is rejected");
  await page.getByLabel("개인 비밀번호").fill(PERSONAL);
  await btn(page, "열기").click();
  await page.getByText("서운했던 일").waitFor({ timeout: 20000 });
  ok(true, "unlock shows the decrypted title");

  // Change visibility: 나만 간직하기 -> 아들에게 전하기 requires the final confirmation.
  await page.getByText("서운했던 일").click();
  ok((await page.getByText(SECRET_TEXT).count()) === 1, "decrypted body readable by the owner");
  await btn(page, "고쳐 쓰기 · 전할지 바꾸기").click();
  await page.getByLabel(/내용/).fill(SHARED_TEXT);
  await page.getByText("아들에게 전하기", { exact: true }).click();
  await btn(page, "다시 읽기").click();
  await btn(page, "아들에게 전하기").click();
  await page.getByRole("heading", { name: "아들에게 전할까요?" }).waitFor();
  ok(rows()[0].kind === "sealed", "nothing is shared before the final confirmation");
  await btn(page, "네, 아들에게 전할게요").click();
  await page.getByRole("heading", { name: "아들에게 전했어요." }).waitFor();
  const r2 = rows();
  ok(r2.length === 1 && r2[0].kind === "shared" && r2[0].body === SHARED_TEXT && r2[0].ciphertext === null, "entry is now shared (plaintext only after confirmation)");

  // Draft: saved sealed, not visible to the son.
  await page.goto(`${BASE}/rooms/1`);
  await btn(page, "내 마음 적기").click();
  await page.getByLabel(/내용/).fill("초안 내용");
  await btn(page, "초안으로 두기").click();
  await page.getByLabel("개인 비밀번호").fill(PERSONAL);
  await btn(page, "열기").click();
  await page.getByRole("heading", { name: "초안으로 두었어요." }).waitFor({ timeout: 20000 });
  ok(rows().filter((x) => x.kind === "sealed").length === 1, "draft stored sealed");
  ok(!JSON.stringify(rows()).includes("초안 내용"), "draft has no plaintext on the server");
}

// ---------- Room 3: 생각 적어두기 does not open the room ----------
{
  const { page } = f;
  await page.goto(`${BASE}/rooms/3`);
  for (const name of ["다음", "편지 읽기", "다 읽었어요", "다음"]) await btn(page, name).click();
  ok((await page.getByText("아버지는 제가 어떤 모습을 보여드리면").count()) === 1, "room 3 question uses 아버지는");
  await btn(page, "생각 적어두기").click();
  await page.getByLabel(/내용/).fill("꾸준히 지켜보고 싶어");
  await page.getByText("나만 간직하기", { exact: true }).click();
  await btn(page, "다시 읽기").click();
  await btn(page, "나만 간직하기로 저장하기").click();
  await page.getByLabel("개인 비밀번호").fill(PERSONAL);
  await btn(page, "열기").click();
  await page.getByRole("heading", { name: "나만 간직하는 글로 저장했어요." }).waitFor({ timeout: 20000 });
  await btn(page, "앞 화면으로 돌아가기").click();
  ok((await btn(page, "노력 살펴보기").count()) === 1, "after writing, back at the question (room not opened)");
  ok((await page.getByText("건강을 돌보는 노력").count()) === 0, "no effort card before the gate");
  await btn(page, "노력 살펴보기").click();
  ok((await btn(page, "녹음 시작하기").count()) === 1, "노력 살펴보기 leads to the recording gate, not the room");
  ok(rows().some((x) => x.room_id === 3 && x.kind === "sealed"), "room 3 thought stored sealed");
}

// ---------- Mother: isolation ----------
const m = await parentContext("mother", MOTHER);
{
  const { page } = m;
  const res = await page.request.get(`${BASE}/api/entries`);
  const list = (await res.json()).entries;
  ok(Array.isArray(list) && list.length === 0, "mother sees none of father's entries");
  const fatherId = rows().find((x) => x.owner === "father" && x.kind === "shared").id;
  const del = await page.request.delete(`${BASE}/api/entries/${fatherId}`, { headers: { origin: BASE } });
  ok(del.status() === 404, `mother cannot delete father's entry (${del.status()})`);
  const put = await page.request.put(`${BASE}/api/entries/${fatherId}`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { kind: "shared", roomId: 1, title: "", body: "덮어쓰기", confirmShare: true },
  });
  ok(put.status() === 404, `mother cannot edit father's entry (${put.status()})`);
  const kr = await (await page.request.get(`${BASE}/api/keyring`)).json();
  ok(kr.keyring === null, "mother has her own (empty) keyring");
  await page.goto(`${BASE}/notes`);
  await page.getByText("아직 적은 글이 없어요.").waitFor();
  ok(true, "mother's notes page is empty");
}

// ---------- API hardening ----------
{
  const { page } = m;
  const noOrigin = await page.request.post(`${BASE}/api/entries`, {
    headers: { "content-type": "application/json" },
    data: { kind: "shared", roomId: 1, title: "", body: "x", confirmShare: true },
  });
  ok(noOrigin.status() === 403, `write without Origin rejected (${noOrigin.status()})`);
  const plainSealed = await page.request.post(`${BASE}/api/entries`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { kind: "sealed", roomId: 1, iv: "AAAAAAAAAAAAAAAA", ciphertext: "YWJjZA==", body: "평문" },
  });
  ok(plainSealed.status() === 400, `sealed entry with plaintext rejected (${plainSealed.status()})`);
  const noConfirm = await page.request.post(`${BASE}/api/entries`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { kind: "shared", roomId: 1, title: "", body: "x" },
  });
  ok(noConfirm.status() === 400, `share without confirmation rejected (${noConfirm.status()})`);
  const room2 = await page.request.post(`${BASE}/api/entries`, {
    headers: { origin: BASE, "content-type": "application/json" },
    data: { kind: "shared", roomId: 2, title: "", body: "x", confirmShare: true },
  });
  ok(room2.status() === 400, `writing to a non-writing room rejected (${room2.status()})`);
  const anon = await browser.newContext();
  const a = await anon.request.get(`${BASE}/api/entries`);
  ok(a.status() === 401, `unauthenticated entries API rejected (${a.status()})`);
  await anon.close();
}

// ---------- Son (admin) ----------
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.getByLabel(/비밀번호/).fill(ADMIN);
  await Promise.all([page.waitForURL(/\/admin$/), page.getByRole("button", { name: /들어가기|로그인/ }).click()]);
  await page.goto(`${BASE}/admin/letters`);
  const html = await page.content();
  ok((await page.locator("main").innerText()).includes("아빠의 글"), "son sees the shared letter in the list");
  ok(!html.includes(SHARED_TEXT), "list does not show the body automatically");
  ok(!html.includes("초안 내용") && !html.includes("꾸준히 지켜보고") && !html.includes(SECRET_TEXT), "son sees no sealed/draft content");
  const links = await page.locator('a[href^="/admin/letters/"]').count();
  ok(links === 1, `only the one shared entry is listed (${links})`);
  await page.locator('a[href^="/admin/letters/"]').first().click();
  await page.getByText(SHARED_TEXT).waitFor();
  ok(true, "son can open the shared letter");
  const sealedId = rows().find((x) => x.kind === "sealed").id;
  const res = await page.goto(`${BASE}/admin/letters/${sealedId}`);
  ok(res.status() === 404, `son cannot open a sealed entry by id (${res.status()})`);
  const api = await page.request.get(`${BASE}/api/entries`);
  ok(api.status() === 401, `son cannot use the parents' entries API (${api.status()})`);
  await page.goto(`${BASE}/admin/content`);
  ok((await page.content()).includes("게시 전"), "admin content list shows unpublished drafts");
  await context.close();
}

// ---------- Parents never get draft content ----------
{
  const { page } = m;
  await page.goto(`${BASE}/welcome/letter`);
  ok((await page.getByText("아들이 편지를 다듬고 있어요.").count()) === 1, "draft intro letter hidden from parents");
  await page.goto(`${BASE}/rooms/3`);
  for (const name of ["다음", "편지 읽기"]) await btn(page, name).click();
  ok((await page.getByText("편지를 준비하고 있어요.").count()) === 1, "draft room 3 letter hidden from parents");
  ok((await page.getByText("어머니는", { exact: false }).count()) === 0, "letter screen shows no unrelated text");
}

// ---------- Forgot personal password: reset deletes sealed only ----------
{
  const { page } = f;
  await page.goto(`${BASE}/notes`);
  await btn(page, "개인 비밀번호로 잠긴 글 열기").click();
  await btn(page, "비밀번호를 잊었어요").click();
  ok((await page.getByText("나만 간직한 글과 초안이 모두 지워져요.").count()) === 1, "reset explains what is deleted");
  await btn(page, "글을 지우고 새로 만들기").click();
  await page.getByRole("heading", { name: "개인 비밀번호 만들기" }).waitFor();
  const r = rows();
  ok(r.every((x) => x.kind === "shared") && r.length === 1, "reset removed sealed entries, kept the shared one");
  // Owner deletes the shared one; the son no longer sees it.
  await page.goto(`${BASE}/notes`);
  await page.getByText("아들에게 전한 글", { exact: true }).first().click();
  await btn(page, "지우기").click();
  await btn(page, "네, 지울게요").click();
  await page.getByText("아직 적은 글이 없어요.").waitFor();
  ok(rows().length === 0, "owner deleted the shared entry");
}

await browser.close();
console.log(failures ? `${failures} check(s) failed` : "All writing checks passed");
process.exit(failures ? 1 : 0);
