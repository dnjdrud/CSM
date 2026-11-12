// Personal-password vault lifecycle: lock, slow crypto races, cancel during create/unlock,
// bfcache (simulated), logout + back, other parent, session expiry, no plaintext anywhere.
//   BASE_URL=... E2E_FATHER_PASSWORD=<test> E2E_MOTHER_PASSWORD=<test> FAMILY_DB_PATH=<server's TEST db> node scripts/check-vault.mjs
// Use test-only credentials and a throwaway database. Real back/forward-cache restores are
// SIMULATED (pagehide/pageshow with persisted=true) -- check on real phones too.
import { readFileSync, existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const FATHER = process.env.E2E_FATHER_PASSWORD;
const MOTHER = process.env.E2E_MOTHER_PASSWORD;
const DB = process.env.FAMILY_DB_PATH;
if (!FATHER || !MOTHER || !DB) {
  console.error("Set E2E_FATHER_PASSWORD, E2E_MOTHER_PASSWORD and FAMILY_DB_PATH (test values only).");
  process.exit(2);
}

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};
const q = (sql) => {
  const d = new DatabaseSync(DB, { readOnly: true });
  try {
    return d.prepare(sql).all();
  } finally {
    d.close();
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PW_F = "아빠개인-test-9123";
const PW_M = "엄마개인-test-5521";
const T1 = "비밀제목가나다" + Date.now();
const B1 = "아무도보면안되는본문" + Date.now();
const B2 = "두번째비밀본문" + Date.now();
const BM = "엄마의비밀본문" + Date.now();

// Optional slow crypto, switched on per page (window.__slowDerive / __slowDecrypt in ms).
const SLOW = () => {
  const s = crypto.subtle;
  const derive = s.deriveKey.bind(s);
  const decrypt = s.decrypt.bind(s);
  s.deriveKey = async (...a) => {
    if (window.__slowDerive) await new Promise((r) => setTimeout(r, window.__slowDerive));
    return derive(...a);
  };
  s.decrypt = async (...a) => {
    if (window.__slowDecrypt) await new Promise((r) => setTimeout(r, window.__slowDecrypt));
    return decrypt(...a);
  };
};

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome", headless: true }).catch(() =>
  chromium.launch({ channel: "msedge", headless: true }),
);
const sent = [];
const btn = (p, name) => p.getByRole("button", { name, exact: true });
async function html(p) {
  for (let i = 0; i < 20; i++) {
    try {
      return await p.content();
    } catch {
      await sleep(250); // still navigating (e.g. redirect after back)
    }
  }
  return p.content();
}

async function newContext() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(SLOW);
  context.on("request", (r) => sent.push(`${r.method()} ${r.url()} ${r.postData() ?? ""} ${JSON.stringify(r.headers())}`));
  return context;
}
async function login(page, who, code) {
  await page.goto(`${BASE}/login/${who}`);
  for (const d of code) await btn(page, d).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), btn(page, "들어가기").click()]);
}
async function writeKeep(page, body, title) {
  await page.goto(`${BASE}/rooms/1`);
  await btn(page, "내 마음 적기").click();
  if (title) {
    await page.getByText("직접 적기", { exact: true }).click();
    await page.getByLabel("제목", { exact: true }).fill(title);
  }
  await page.getByLabel(/내용/).fill(body);
  await page.getByText("나만 간직하기", { exact: true }).click();
  await btn(page, "다시 읽기").click();
  await btn(page, "나만 간직하기로 저장하기").click();
}
async function unlockNotes(page, pw) {
  await page.goto(`${BASE}/notes`);
  await btn(page, "개인 비밀번호로 잠긴 글 열기").click();
  await page.getByLabel("개인 비밀번호").fill(pw);
  await btn(page, "열기").click();
}
const noPlain = async (p, ...words) => {
  const h = await html(p);
  return words.every((w) => !h.includes(w));
};

// ---------- setup: father has two sealed entries ----------
const fc = await newContext();
const f = await fc.newPage();
await login(f, "father", FATHER);
await writeKeep(f, B1, T1);
await f.getByRole("heading", { name: "개인 비밀번호 만들기" }).waitFor();
await f.getByLabel(/개인 비밀번호 \(/).fill(PW_F);
await f.getByLabel("한 번 더 적어주세요").fill(PW_F);
await btn(f, "만들기").click();
await f.getByRole("heading", { name: "나만 간직하는 글로 저장했어요." }).waitFor({ timeout: 20_000 });
await writeKeep(f, B2);
// A full page load drops the in-memory key, so saving asks for the personal password again.
await f.getByRole("heading", { name: "개인 비밀번호 입력" }).waitFor();
ok(true, "after a full page load the key is gone (asks for the personal password again)");
await f.getByLabel("개인 비밀번호").fill(PW_F);
await btn(f, "열기").click();
await f.getByRole("heading", { name: "나만 간직하는 글로 저장했어요." }).waitFor({ timeout: 20_000 });
ok(q("SELECT * FROM entries WHERE owner='father' AND kind='sealed'").length === 2, "setup: two sealed entries");

// ---------- 1. Lock removes decrypted title/body from the page ----------
{
  await unlockNotes(f, PW_F);
  await f.getByText(T1).waitFor({ timeout: 20_000 });
  await f.getByText(T1).click();
  ok((await f.getByText(B1).count()) === 1, "unlocked: owner can read");
  await btn(f, "목록으로").click();
  await btn(f, "잠긴 글 다시 잠그기").click();
  await btn(f, "개인 비밀번호로 잠긴 글 열기").waitFor();
  ok(await noPlain(f, T1, B1, B2), "after 다시 잠그기: no decrypted title or body anywhere in the page");
}

// ---------- 2. Slow decryption finishing AFTER the lock cannot unlock the screen ----------
{
  await f.goto(`${BASE}/notes`);
  await btn(f, "개인 비밀번호로 잠긴 글 열기").click();
  await f.getByLabel("개인 비밀번호").fill(PW_F);
  await f.evaluate(() => (window.__slowDecrypt = 1500)); // verify + each entry take 1.5 s
  await btn(f, "열기").click();
  await btn(f, "잠긴 글 다시 잠그기").waitFor({ timeout: 20_000 }); // key accepted, entries still decrypting
  await btn(f, "잠긴 글 다시 잠그기").click();
  await sleep(4500); // the pending decryptions finish now
  ok(await noPlain(f, T1, B1, B2), "decryption that finished after the lock is not shown");
  ok((await btn(f, "개인 비밀번호로 잠긴 글 열기").count()) === 1, "screen stays locked");
  await f.evaluate(() => (window.__slowDecrypt = 0));
}

// ---------- 3. Cancel while CREATING / UNLOCKING the personal password (mother) ----------
const mc = await newContext();
const m = await mc.newPage();
await login(m, "mother", MOTHER);
{
  await writeKeep(m, BM);
  await m.getByRole("heading", { name: "개인 비밀번호 만들기" }).waitFor();
  await m.getByLabel(/개인 비밀번호 \(/).fill(PW_M);
  await m.getByLabel("한 번 더 적어주세요").fill(PW_M);
  await m.evaluate(() => (window.__slowDerive = 2500));
  await btn(m, "만들기").click();
  await btn(m, "만들기").click({ force: true }).catch(() => {}); // repeated tap while busy
  await btn(m, "저장하지 않고 돌아가기").click(); // cancel while the KDF is running
  await sleep(4000);
  ok(q("SELECT * FROM entries WHERE owner='mother'").length === 0, "cancel during create: nothing saved afterwards");
  ok((await m.getByRole("heading", { name: /저장했어요|두었어요/ }).count()) === 0, "cancel during create: no automatic save screen");
  ok(q("SELECT * FROM keyrings WHERE owner='mother'").length <= 1, "keyring created at most once (never rolled back destructively)");

  // Back to saving: the panel reads the server state again (unlock if the keyring now exists).
  await btn(m, "나만 간직하기로 저장하기").click();
  const asksUnlock = await m.getByRole("heading", { name: "개인 비밀번호 입력" }).waitFor({ timeout: 5000 }).then(() => true, () => false);
  const asksCreate = !asksUnlock && (await m.getByRole("heading", { name: "개인 비밀번호 만들기" }).count()) === 1;
  ok(asksUnlock || asksCreate, `re-entry reads the real state (${asksUnlock ? "unlock" : "create"})`);
  if (asksCreate) {
    await m.evaluate(() => (window.__slowDerive = 0));
    await m.getByLabel(/개인 비밀번호 \(/).fill(PW_M);
    await m.getByLabel("한 번 더 적어주세요").fill(PW_M);
    await btn(m, "만들기").click();
    await m.getByRole("heading", { name: "나만 간직하는 글로 저장했어요." }).waitFor({ timeout: 20_000 });
    await writeKeep(m, BM); // full load: key gone -> asks to unlock below
  }
  // Cancel during UNLOCK.
  await m.getByRole("heading", { name: "개인 비밀번호 입력" }).waitFor({ timeout: 10_000 });
  const before = q("SELECT * FROM entries WHERE owner='mother'").length;
  await m.getByLabel("개인 비밀번호").fill(PW_M);
  await m.evaluate(() => (window.__slowDerive = 2500));
  await btn(m, "열기").click();
  await btn(m, "저장하지 않고 돌아가기").click();
  await sleep(4000);
  ok(q("SELECT * FROM entries WHERE owner='mother'").length === before, "cancel during unlock: no save afterwards");
  await m.evaluate(() => (window.__slowDerive = 0));

  // Repeated taps on 열기: exactly one save.
  await btn(m, "나만 간직하기로 저장하기").click();
  await m.getByLabel("개인 비밀번호").fill(PW_M);
  await btn(m, "열기").dblclick();
  await m.getByRole("heading", { name: "나만 간직하는 글로 저장했어요." }).waitFor({ timeout: 20_000 });
  await sleep(500);
  ok(q("SELECT * FROM entries WHERE owner='mother'").length === before + 1, "double tap saves exactly once");
}

// ---------- 4. Back/forward cache (simulated pagehide/pageshow persisted) ----------
{
  await unlockNotes(f, PW_F);
  await f.getByText(T1).waitFor({ timeout: 20_000 });
  await f.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  const hidden = await f.evaluate(() => document.documentElement.hasAttribute("data-wiped") && getComputedStyle(document.body).visibility === "hidden");
  ok(hidden, "pagehide: page blanked synchronously before entering the cache");
  await Promise.all([f.waitForEvent("load"), f.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })))]);
  await f.getByRole("heading", { name: "내가 적은 글" }).waitFor();
  ok(await noPlain(f, T1, B1, B2), "restored from cache: reloaded and locked, no decrypted text");
  ok((await btn(f, "개인 비밀번호로 잠긴 글 열기").count()) === 1, "restored from cache: starts locked");
}

// ---------- 5. Session expiry while reading ----------
{
  await unlockNotes(f, PW_F);
  await f.getByText(T1).waitFor({ timeout: 20_000 });
  await f.getByText(T1).click();
  await f.getByText(B1).waitFor();
  const cookies = await fc.cookies();
  await fc.clearCookies();
  await btn(f, "지우기").click();
  await btn(f, "네, 지울게요").click();
  await sleep(800);
  ok(await noPlain(f, T1, B1), "session ended (401): decrypted text removed from the screen");
  await fc.addCookies(cookies);
}

// ---------- 6. Logout, then the browser back button ----------
{
  await unlockNotes(f, PW_F);
  await f.getByText(T1).waitFor({ timeout: 20_000 });
  await f.getByText(T1).click();
  await f.getByText(B1).waitFor();
  await btn(f, "나가기 (로그아웃)").click();
  await f.waitForURL(/\/login/);
  await f.goBack();
  await f.waitForLoadState();
  await f.waitForURL((u) => u.pathname.startsWith("/login"), { timeout: 5000 }).catch(() => {});
  ok(await noPlain(f, T1, B1, B2), `after logout + back: no decrypted text (${new URL(f.url()).pathname})`);
  ok(new URL(f.url()).pathname.startsWith("/login") || (await btn(f, "개인 비밀번호로 잠긴 글 열기").count()) === 0, "after logout + back: not shown as logged in");

  // ---------- 7. Other parent logs in on the same browser ----------
  await login(f, "mother", MOTHER);
  await f.goto(`${BASE}/notes`);
  await f.getByRole("heading", { name: "내가 적은 글" }).waitFor();
  ok(await noPlain(f, T1, B1, B2), "mother on the same browser: none of father's text");
  ok((await btn(f, "잠긴 글 다시 잠그기").count()) === 0, "mother starts locked (father's key is not carried over)");
  await f.getByText(/잠긴 글|아직 적은 글이 없어요/).first().waitFor();
  const mine = q("SELECT * FROM entries WHERE owner='mother'").length;
  ok((await f.locator("main ul > li").count()) === mine, `mother sees only her own entries (${mine})`);
}

// ---------- 8. sealed -> shared still needs decrypt + separate final confirmation ----------
{
  await unlockNotes(m, PW_M);
  await m.getByText("나만 간직하는 글", { exact: true }).first().click();
  await m.getByText(BM).waitFor();
  await btn(m, "고쳐 쓰기 · 전할지 바꾸기").click();
  await m.getByText("아들에게 전하기", { exact: true }).click();
  await btn(m, "다시 읽기").click();
  await btn(m, "아들에게 전하기").click();
  await m.getByRole("heading", { name: "아들에게 전할까요?" }).waitFor();
  ok(q("SELECT * FROM entries WHERE owner='mother' AND kind='shared'").length === 0, "nothing shared before the final confirmation");
  await btn(m, "아직 전하지 않을게요").click();
}

// ---------- 9. No plaintext, key or password in requests or in the database ----------
{
  const all = sent.join("\n");
  for (const [name, v] of [["father personal password", PW_F], ["mother personal password", PW_M], ["sealed title", T1], ["sealed body 1", B1], ["sealed body 2", B2], ["mother sealed body", BM]])
    ok(!all.includes(v), `requests never contain the ${name}`);
  const files = [DB, `${DB}-wal`].filter(existsSync).map((p) => readFileSync(p));
  for (const [name, v] of [["personal password", PW_F], ["sealed title", T1], ["sealed body", B1], ["mother body", BM]])
    ok(files.every((b) => !b.includes(Buffer.from(v, "utf8"))), `database files never contain the ${name}`);
  ok(q("SELECT * FROM entries WHERE kind='sealed' AND (title IS NOT NULL OR body IS NOT NULL)").length === 0, "sealed rows have no plaintext columns");
}

await browser.close();
console.log(failures ? `${failures} check(s) failed` : "All vault lifecycle checks passed");
process.exit(failures ? 1 : 0);
