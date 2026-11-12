// Browser-side calls for parents' own writing. Plaintext is sent only for 아들에게 전하기
// (after the final confirmation). Sealed entries are encrypted before they leave this tab.

import type { OwnEntry, SealedPayload } from "./entry-rules";
import { seal, vaultKey, type KeyringData } from "./vault";

export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

async function call<T>(url: string, init?: { method?: string; body?: unknown; grant?: string }): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body !== undefined) headers["content-type"] = "application/json";
  if (init?.grant) headers["x-room-grant"] = init.grant;
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401) vaultKey.wipe(); // session ended: lock and drop decrypted text
  if (!res.ok) throw new ApiError(data.error ?? (res.status === 401 ? "unauthorized" : "network"));
  return data;
}

export const fetchKeyring = () => call<{ keyring: KeyringData | null }>("/api/keyring").then((d) => d.keyring);
export const saveKeyring = (k: KeyringData) => call<{ keyring: KeyringData }>("/api/keyring", { method: "POST", body: k });
export const resetKeyring = () =>
  call<{ deletedSealed: number }>("/api/keyring", { method: "DELETE", body: { confirm: "delete-sealed-entries" } });

export const fetchOwnEntries = () => call<{ entries: OwnEntry[] }>("/api/entries").then((d) => d.entries);

/** Encrypts in the browser, then stores ciphertext only. Throws if encryption fails (no plaintext fallback). */
export async function saveSealed(key: CryptoKey, roomId: number, payload: SealedPayload, id?: string, grant?: string) {
  const ep = vaultKey.epoch();
  const { iv, ciphertext } = await seal(key, payload);
  // Locked / logged out / page hidden while encrypting: do not save (nothing is ever sent in plaintext).
  if (vaultKey.epoch() !== ep || vaultKey.get() !== key) throw new ApiError("locked");
  const body = { kind: "sealed", roomId, iv, ciphertext };
  return id
    ? call<{ entry: OwnEntry }>(`/api/entries/${id}`, { method: "PUT", body })
    : call<{ entry: OwnEntry }>("/api/entries", { method: "POST", body, grant });
}

/** Only after the writer's final confirmation screen. */
export async function saveShared(roomId: number, title: string, text: string, id?: string, grant?: string) {
  const body = { kind: "shared", roomId, title, body: text, confirmShare: true };
  return id
    ? call<{ entry: OwnEntry }>(`/api/entries/${id}`, { method: "PUT", body })
    : call<{ entry: OwnEntry }>("/api/entries", { method: "POST", body, grant });
}

export const deleteOwnEntry = (id: string) => call<{ ok: true }>(`/api/entries/${id}`, { method: "DELETE" });

export function errorText(e: unknown): string {
  const code =
    e instanceof ApiError ? e.code : e && typeof e === "object" && "code" in e && typeof e.code === "string" ? e.code : "network";
  switch (code) {
    case "unauthorized":
      return "로그인이 끝났어요. 다시 로그인해 주세요. 적던 글은 저장되지 않았어요.";
    case "body_required":
      return "내용을 적어주세요.";
    case "title_too_long":
      return "제목이 너무 길어요. 조금 줄여주세요.";
    case "body_too_long":
      return "글이 너무 길어요. 나누어서 저장해 주세요.";
    case "limit":
      return "저장할 수 있는 글 수를 넘었어요. 예전 글을 지운 뒤 다시 저장해 주세요.";
    case "no_keyring":
      return "개인 비밀번호를 먼저 만들어 주세요.";
    case "not_found":
      return "이 글을 찾을 수 없어요. 이미 지워졌을 수 있어요.";
    case "grant_required":
      return "방에 들어온 지 오래되었거나 방을 벗어나서 저장하지 못했어요. 적은 글을 따로 옮겨 두신 뒤, 방에 다시 들어와 주세요.";
    case "locked":
      return "글이 잠겨서 저장하지 않았어요. 개인 비밀번호를 다시 입력한 뒤 저장해 주세요.";
    case "encrypt_failed":
      return "글을 잠그지 못해서 저장하지 않았어요. 다시 시도해 주세요.";
    default:
      return "저장하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.";
  }
}
