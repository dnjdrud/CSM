import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attemptAdminLogin, attemptParentLogin } from "@/server/login";
import { __resetRateLimitsForTests, RULES } from "@/server/rate-limit";
import { isSameOriginRequest } from "@/server/request-guard";
import { createSessionToken, verifySessionToken } from "@/server/session-token";

// Test-only values (not real passwords).
const SECRET = "test-secret-test-secret-test-secret-0123";
const FATHER = "11112222";
const MOTHER = "3344";
const ADMIN = "admin-test-password-0000";

const ENV_KEYS = ["SESSION_SECRET", "FATHER_PASSWORD", "MOTHER_PASSWORD", "ADMIN_PASSWORD", "APP_ORIGIN"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.SESSION_SECRET = SECRET;
  process.env.FATHER_PASSWORD = FATHER;
  process.env.MOTHER_PASSWORD = MOTHER;
  process.env.ADMIN_PASSWORD = ADMIN;
  delete process.env.APP_ORIGIN;
  __resetRateLimitsForTests();
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("session token", () => {
  it("round-trips and carries only sid/role/times", () => {
    const { token, payload } = createSessionToken("father", SECRET, 1000);
    expect(verifySessionToken(token, SECRET, 1001)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual(["exp", "iat", "role", "sid", "v"]);
  });

  it("rejects tampered role", () => {
    const { token } = createSessionToken("father", SECRET, 1000);
    const [part, mac] = token.split(".");
    const data = JSON.parse(Buffer.from(part, "base64url").toString());
    data.role = "son";
    const forged = Buffer.from(JSON.stringify(data)).toString("base64url") + "." + mac;
    expect(verifySessionToken(forged, SECRET, 1001)).toBeNull();
  });

  it("rejects wrong secret, expiry, garbage", () => {
    const { token, payload } = createSessionToken("mother", SECRET, 1000);
    expect(verifySessionToken(token, "other-secret-other-secret-other-secret", 1001)).toBeNull();
    expect(verifySessionToken(token, SECRET, payload.exp)).toBeNull();
    expect(verifySessionToken("abc", SECRET)).toBeNull();
    expect(verifySessionToken("a.b.c", SECRET)).toBeNull();
    expect(verifySessionToken("", SECRET)).toBeNull();
  });

  it("admin sessions are shorter than parent sessions", () => {
    const a = createSessionToken("son", SECRET, 0).payload;
    const p = createSessionToken("father", SECRET, 0).payload;
    expect(a.exp).toBeLessThan(p.exp);
  });
});

describe("parent login", () => {
  it("each parent logs in only with their own password", () => {
    const f = attemptParentLogin("father", FATHER, "ip1");
    expect(f.ok && f.payload.role).toBe("father");
    const m = attemptParentLogin("mother", MOTHER, "ip1");
    expect(m.ok && m.payload.role).toBe("mother");

    // Choosing the other account with a valid password does not grant access.
    expect(attemptParentLogin("mother", FATHER, "ip2")).toMatchObject({ ok: false, reason: "wrong" });
    expect(attemptParentLogin("father", MOTHER, "ip2")).toMatchObject({ ok: false, reason: "wrong" });
  });

  it("cannot obtain admin role through the parent endpoint", () => {
    expect(attemptParentLogin("son", ADMIN, "ip")).toMatchObject({ ok: false, reason: "invalid_request" });
    expect(attemptParentLogin("admin", FATHER, "ip")).toMatchObject({ ok: false, reason: "invalid_request" });
  });

  it("rejects non-numeric / malformed input", () => {
    expect(attemptParentLogin("father", "1111222a", "ip")).toMatchObject({ reason: "invalid_request" });
    expect(attemptParentLogin("father", 11112222, "ip")).toMatchObject({ reason: "invalid_request" });
    expect(attemptParentLogin("father", "", "ip")).toMatchObject({ reason: "invalid_request" });
  });

  it("mother shows not_configured when MOTHER_PASSWORD is unset or malformed", () => {
    delete process.env.MOTHER_PASSWORD;
    expect(attemptParentLogin("mother", "0000", "ip")).toMatchObject({ ok: false, reason: "not_configured" });
    process.env.MOTHER_PASSWORD = "12345"; // wrong length
    expect(attemptParentLogin("mother", "1234", "ip")).toMatchObject({ ok: false, reason: "not_configured" });
    // father unaffected
    expect(attemptParentLogin("father", FATHER, "ip").ok).toBe(true);
  });

  it("not_configured when SESSION_SECRET is missing or short", () => {
    process.env.SESSION_SECRET = "short";
    expect(attemptParentLogin("father", FATHER, "ip")).toMatchObject({ reason: "not_configured" });
  });

  it("locks a client after repeated failures, even for the right password", () => {
    for (let i = 0; i < RULES.perClient.maxFailures - 1; i++) {
      expect(attemptParentLogin("mother", "0000", "ipX")).toMatchObject({ reason: "wrong" });
    }
    expect(attemptParentLogin("mother", "0000", "ipX")).toMatchObject({ reason: "locked" });
    expect(attemptParentLogin("mother", MOTHER, "ipX")).toMatchObject({ reason: "locked" });
    // Lock is per account: father on the same client is unaffected.
    expect(attemptParentLogin("father", FATHER, "ipX").ok).toBe(true);
  });

  it("account-wide limit applies across rotating client ids", () => {
    let last;
    for (let i = 0; i < RULES.perAccount.maxFailures; i++) {
      last = attemptParentLogin("mother", "0000", `rot-${i}`);
    }
    expect(last).toMatchObject({ reason: "locked" });
    expect(attemptParentLogin("mother", MOTHER, "fresh-ip")).toMatchObject({ reason: "locked" });
  });
});

describe("admin login", () => {
  it("separate credential; parent codes do not work", () => {
    expect(attemptAdminLogin(FATHER, "ip")).toMatchObject({ ok: false, reason: "wrong" });
    const r = attemptAdminLogin(ADMIN, "ip");
    expect(r.ok && r.payload.role).toBe("son");
  });

  it("requires a strong configured password", () => {
    process.env.ADMIN_PASSWORD = "short";
    expect(attemptAdminLogin("short", "ip")).toMatchObject({ reason: "not_configured" });
  });
});

describe("same-origin guard", () => {
  const req = (h: Record<string, string>) => new Request("http://localhost:3000/api/x", { method: "POST", headers: h });

  it("accepts same host, rejects others or missing origin", () => {
    expect(isSameOriginRequest(req({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(true);
    expect(isSameOriginRequest(req({ origin: "https://evil.example", host: "localhost:3000" }))).toBe(false);
    expect(isSameOriginRequest(req({ host: "localhost:3000" }))).toBe(false);
    expect(
      isSameOriginRequest(req({ origin: "http://localhost:3000", host: "localhost:3000", "sec-fetch-site": "cross-site" })),
    ).toBe(false);
  });

  it("Origin: null (HTML form POST) is accepted only with Sec-Fetch-Site: same-origin", () => {
    expect(isSameOriginRequest(req({ origin: "null", host: "localhost:3000", "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameOriginRequest(req({ origin: "null", host: "localhost:3000" }))).toBe(false);
    expect(isSameOriginRequest(req({ origin: "null", host: "localhost:3000", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOriginRequest(req({ origin: "null", host: "localhost:3000", "sec-fetch-site": "none" }))).toBe(false);
  });

  it("uses APP_ORIGIN when configured", () => {
    process.env.APP_ORIGIN = "https://family.example";
    expect(isSameOriginRequest(req({ origin: "https://family.example", host: "internal:3000" }))).toBe(true);
    expect(isSameOriginRequest(req({ origin: "http://internal:3000", host: "internal:3000" }))).toBe(false);
  });
});
