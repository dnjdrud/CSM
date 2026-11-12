// Mobile layout / accessibility smoke check using a locally installed Chrome or Edge.
//   BASE_URL=http://localhost:3000 E2E_FATHER_PASSWORD=<father code> node scripts/check-layout.mjs
// Checks: no horizontal scroll at 360/390/430px (normal and largest text size),
// button height >= 60px, body text >= 20px, title 28-32px, zoom not disabled,
// visible keyboard focus, keypad login works, rooms 2-7 stop at the recording gate.
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CODE = process.env.E2E_FATHER_PASSWORD;
if (!CODE) {
  console.error("Set E2E_FATHER_PASSWORD (never commit it).");
  process.exit(2);
}

const channel = process.env.BROWSER_CHANNEL ?? "chrome";
const browser = await chromium.launch({ channel, headless: true }).catch(() => chromium.launch({ channel: "msedge", headless: true }));

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};

async function metrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !el.closest(".sr-only");
    };
    const buttons = [...document.querySelectorAll(".btn")].filter(visible);
    const h1 = document.querySelector("h1");
    return {
      overflow: doc.scrollWidth - window.innerWidth,
      minButton: buttons.length ? Math.min(...buttons.map((b) => b.getBoundingClientRect().height)) : null,
      bodyFont: parseFloat(getComputedStyle(document.body).fontSize),
      h1Font: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "",
    };
  });
}

async function login(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login/father`);
  for (const d of CODE) await page.getByRole("button", { name: d, exact: true }).click();
  await Promise.all([page.waitForURL(/\/(welcome|rooms)/), page.getByRole("button", { name: "들어가기" }).click()]);
  await page.close();
}

const PUBLIC = ["/login", "/login/father", "/login/mother"];
const PRIVATE = ["/welcome", "/welcome/letter", "/welcome/guide", "/rooms", "/notes", "/rooms/1", "/rooms/2", "/rooms/3", "/rooms/7"];

for (const width of [360, 390, 430]) {
  for (const text of ["md", "xl"]) {
    const context = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await context.addCookies([{ name: "fh_text", value: text, url: BASE }]);
    for (const path of PUBLIC) {
      const page = await context.newPage();
      await page.goto(BASE + path);
      const m = await metrics(page);
      ok(m.overflow <= 0, `${width}px text=${text} ${path}: no horizontal scroll (${m.overflow})`);
      if (text === "md") {
        ok(m.minButton === null || m.minButton >= 60, `${width}px ${path}: buttons >= 60px (${m.minButton})`);
        ok(m.bodyFont >= 20, `${width}px ${path}: body >= 20px (${m.bodyFont})`);
        ok(m.h1Font === null || (m.h1Font >= 28 && m.h1Font <= 32), `${width}px ${path}: title 28-32px (${m.h1Font})`);
        ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(m.viewport), `${path}: zoom allowed`);
      }
      await page.close();
    }
    await login(context);
    for (const path of PRIVATE) {
      const page = await context.newPage();
      await page.goto(BASE + path);
      ok(new URL(page.url()).pathname === path, `${width}px ${path}: opened while logged in`);
      const m = await metrics(page);
      ok(m.overflow <= 0, `${width}px text=${text} ${path}: no horizontal scroll (${m.overflow})`);
      if (text === "md") ok(m.minButton === null || m.minButton >= 60, `${width}px ${path}: buttons >= 60px (${m.minButton})`);
      await page.close();
    }
    await context.close();
  }
}

// Keyboard: tab through the password page and check focus is visible.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/login/father`);
  let checked = 0;
  let visible = 0;
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
    });
    if (r === null) continue;
    checked++;
    if (r) visible++;
  }
  ok(checked > 10 && visible === checked, `keyboard focus visible on all ${checked} tab stops (${visible})`);

  // Typing digits with the keyboard works as well as the keypad.
  await page.locator("input[type=password]").fill("");
  await page.locator("input[type=password]").focus();
  await page.keyboard.type("1234");
  ok((await page.locator("input[type=password]").inputValue()) === "1234", "keyboard digit entry works");
  await page.getByRole("button", { name: "한 자리 지우기" }).click();
  ok((await page.locator("input[type=password]").inputValue()) === "123", "delete one digit works");
  await page.getByRole("button", { name: "입력 모두 지우기" }).click();
  ok((await page.locator("input[type=password]").inputValue()) === "", "clear all works");

  // Wrong code -> understandable error
  for (const d of "00000000") await page.getByRole("button", { name: d, exact: true }).click();
  await page.getByRole("button", { name: "들어가기" }).click();
  await page.locator("main [role=alert]").waitFor();
  ok((await page.locator("main [role=alert]").innerText()).includes("맞지 않아요"), "wrong code shows a clear error");
  await context.close();
}

// Rooms 2-7: preparation ends at the recording gate; no way into the body without recording.
{
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
  await login(context);
  const page = await context.newPage();
  for (const id of [2, 3, 4, 5, 6, 7]) {
    await page.goto(`${BASE}/rooms/${id}`);
    for (let i = 0; i < 10; i++) {
      const next = page.locator("main .btn-primary").first();
      if ((await page.getByRole("heading", { name: "목소리로 확인하기" }).count()) > 0) break;
      await next.click();
    }
    const atGate = (await page.getByRole("heading", { name: "목소리로 확인하기" }).count()) === 1;
    const enterButtons = await page.getByRole("button", { name: "이 마음으로 들어가기" }).count();
    const recordButton = await page.getByRole("button", { name: "녹음 시작하기" }).count();
    ok(atGate && enterButtons === 0 && recordButton === 1, `room ${id}: prelude ends at the recording gate, no entry button`);
    ok((await page.getByRole("button", { name: "방 목록으로" }).count()) === 1, `room ${id}: 방 목록 return available`);
    const gm = await metrics(page);
    ok(gm.overflow <= 0 && gm.minButton >= 60, `room ${id}: gate screen fits 360px, buttons >= 60px`);
  }
  await context.close();
}

await browser.close();
console.log(failures ? `${failures} check(s) failed` : "All layout checks passed");
process.exit(failures ? 1 : 0);
