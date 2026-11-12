import { describe, expect, it } from "vitest";
import { createKeyring, open, seal, unlock } from "@/lib/vault";

describe("personal password vault (Web Crypto)", () => {
  it("round-trips with the right password; wrong password or tampering fails closed", async () => {
    const { keyring, key } = await createKeyring("나의비밀123");
    expect(keyring.iterations).toBeGreaterThanOrEqual(600_000);
    expect(JSON.stringify(keyring)).not.toContain("나의비밀123");

    const payload = { v: 1 as const, title: "서운했던 일", body: "개인적인 마음", intent: "keep" as const };
    const box = await seal(key, payload);
    expect(box.ciphertext).not.toContain("개인적인");
    expect(atob(box.ciphertext)).not.toContain("서운");
    expect(await open(key, box.iv, box.ciphertext)).toEqual(payload);

    expect(await unlock("틀린비밀번호", keyring)).toBeNull();
    const again = await unlock("나의비밀123", keyring);
    expect(again).not.toBeNull();
    expect(await open(again!, box.iv, box.ciphertext)).toEqual(payload);

    const other = (await createKeyring("나의비밀123")).key; // same password, new salt -> different key
    expect(await open(other, box.iv, box.ciphertext)).toBeNull();

    const bytes = Uint8Array.from(atob(box.ciphertext), (c) => c.charCodeAt(0));
    bytes[0] ^= 1;
    expect(await open(key, box.iv, btoa(String.fromCharCode(...bytes)))).toBeNull();
  }, 30_000);

  it("uses a fresh nonce every time", async () => {
    const { key } = await createKeyring("abcdef");
    const p = { v: 1 as const, title: "", body: "같은 글", intent: "draft" as const };
    const a = await seal(key, p);
    const b = await seal(key, p);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  }, 30_000);

  it("the key cannot be exported", async () => {
    const { key } = await createKeyring("abcdef");
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
  }, 30_000);
});

describe("in-tab key holder (scope + epoch)", () => {
  it("binds the key to the current login and wipes it on scope change / lock", async () => {
    const { vaultKey } = await import("@/lib/vault");
    const { key } = await createKeyring("abcdef");
    vaultKey.bindScope(null);
    expect(vaultKey.set(key, vaultKey.epoch())).toBe(false); // logged out: never stored
    vaultKey.bindScope("scope-father-1");
    expect(vaultKey.set(key, vaultKey.epoch())).toBe(true);
    expect(vaultKey.get()).toBe(key);
    vaultKey.bindScope("scope-mother-2"); // other parent / new login
    expect(vaultKey.get()).toBeNull();
    vaultKey.bindScope("scope-father-1"); // even back to the old scope: the key is gone
    expect(vaultKey.get()).toBeNull();
  }, 30_000);

  it("a slow unlock that started before a lock cannot store its key afterwards", async () => {
    const { vaultKey } = await import("@/lib/vault");
    vaultKey.bindScope("scope-x");
    const started = vaultKey.epoch();
    const { key } = await createKeyring("abcdef"); // the slow part
    vaultKey.wipe(); // "다시 잠그기" while it was running
    expect(vaultKey.set(key, started)).toBe(false);
    expect(vaultKey.get()).toBeNull();
  }, 30_000);
});
