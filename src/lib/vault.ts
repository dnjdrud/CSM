// Personal-password encryption for 나만 간직하기 / 초안. Runs in the browser only
// (also in Node for tests). Standard Web Crypto only -- no custom algorithms:
//   key  = PBKDF2-HMAC-SHA256(password, random 16-byte salt, 600,000 iterations) -> AES-GCM-256
//   data = AES-GCM(key, random 12-byte nonce, JSON payload, AAD)
// The password and key are never sent anywhere. The key is non-extractable and lives
// only in this tab's memory. There is no plaintext fallback: if encryption fails, nothing is saved.

import type { SealedPayload } from "./entry-rules";

export const KDF_ITERATIONS = 600_000;
export const PERSONAL_PASSWORD_MIN = 6;
const CHECK_TEXT = "family-home/vault-check/v1";
const AAD_ENTRY = new TextEncoder().encode("family-home/entry/v1");
const AAD_CHECK = new TextEncoder().encode("family-home/check/v1");

export type KeyringData = { kdf: "PBKDF2-SHA256"; iterations: number; salt: string; checkIv: string; checkCt: string };

const subtle = () => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error("webcrypto_unavailable");
  return s;
};

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export async function deriveKey(password: string, saltB64: string, iterations: number): Promise<CryptoKey> {
  const base = await subtle().importKey("raw", new TextEncoder().encode(password.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(saltB64), iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable
    ["encrypt", "decrypt"],
  );
}

/** New personal password: returns keyring metadata for the server and the key for this tab. */
export async function createKeyring(password: string): Promise<{ keyring: KeyringData; key: CryptoKey }> {
  const salt = toB64(random(16));
  const key = await deriveKey(password, salt, KDF_ITERATIONS);
  const iv = random(12);
  const ct = await subtle().encrypt({ name: "AES-GCM", iv, additionalData: AAD_CHECK }, key, new TextEncoder().encode(CHECK_TEXT));
  return { keyring: { kdf: "PBKDF2-SHA256", iterations: KDF_ITERATIONS, salt, checkIv: toB64(iv), checkCt: toB64(ct) }, key };
}

/** Returns the key if the password is right, null if wrong (AES-GCM authentication fails). */
export async function unlock(password: string, k: KeyringData): Promise<CryptoKey | null> {
  const key = await deriveKey(password, k.salt, k.iterations);
  try {
    const pt = await subtle().decrypt({ name: "AES-GCM", iv: fromB64(k.checkIv), additionalData: AAD_CHECK }, key, fromB64(k.checkCt));
    return new TextDecoder().decode(pt) === CHECK_TEXT ? key : null;
  } catch {
    return null;
  }
}

export async function seal(key: CryptoKey, payload: SealedPayload): Promise<{ iv: string; ciphertext: string }> {
  const iv = random(12);
  const ct = await subtle().encrypt(
    { name: "AES-GCM", iv, additionalData: AAD_ENTRY },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  return { iv: toB64(iv), ciphertext: toB64(ct) };
}

/** null = wrong key or damaged data (never partially decrypted). */
export async function open(key: CryptoKey, ivB64: string, ctB64: string): Promise<SealedPayload | null> {
  try {
    const pt = await subtle().decrypt({ name: "AES-GCM", iv: fromB64(ivB64), additionalData: AAD_ENTRY }, key, fromB64(ctB64));
    const p = JSON.parse(new TextDecoder().decode(pt)) as SealedPayload;
    if (p?.v !== 1 || typeof p.body !== "string" || typeof p.title !== "string") return null;
    return { v: 1, title: p.title, body: p.body, intent: p.intent === "draft" ? "draft" : "keep" };
  } catch {
    return null;
  }
}

// ---- In-tab key holder -------------------------------------------------------------
// Memory only (never storage, cookies or the server). The key is bound to a SCOPE: an
// opaque value derived on the server from the current login session (so a different
// parent or a new login never sees a key from before). Every wipe bumps an EPOCH;
// components that hold decrypted text subscribe to it and drop their plaintext, and any
// async work started under an older epoch must not apply its result.

type Held = { key: CryptoKey; scope: string };
let held: Held | null = null;
let boundScope: string | null = null;
let epoch = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const vaultKey = {
  /** The key for the current scope, or null (locked). */
  get: (): CryptoKey | null => (held && boundScope && held.scope === boundScope ? held.key : null),
  /** Increases on every wipe (lock, logout, page hide, scope change, session expiry). */
  epoch: () => epoch,
  /**
   * Stores the key only if the scope is still the one the operation started under
   * (the caller passes the epoch it captured before the long-running KDF).
   */
  set(k: CryptoKey, startedEpoch: number): boolean {
    if (!boundScope || startedEpoch !== epoch) return false;
    held = { key: k, scope: boundScope };
    notify();
    return true;
  },
  /** Lock: forget the key and tell every holder of decrypted text to drop it. */
  wipe() {
    held = null;
    epoch += 1;
    notify();
  },
  /** Called by VaultGuard with the server-derived scope of the current login (null = logged out). */
  bindScope(scope: string | null) {
    if (scope !== boundScope || (held && held.scope !== scope)) {
      boundScope = scope;
      this.wipe();
    }
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};
