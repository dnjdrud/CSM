import { beforeEach, describe, expect, it } from "vitest";
import { __useMemoryDbForTests, getDb } from "@/server/db";
import {
  createEntry,
  createKeyring,
  deleteEntry,
  getKeyring,
  getSharedForSon,
  listOwnEntries,
  listSharedForSon,
  parseEntryInput,
  parseKeyring,
  replaceEntry,
  resetKeyring,
} from "@/server/entries";

const sealed = { kind: "sealed", roomId: 1, iv: "AAAAAAAAAAAAAAAA", ciphertext: "Y2lwaGVydGV4dA==" };
const shared = { kind: "shared", roomId: 1, title: "아들에게 하고 싶은 말", body: "본문", confirmShare: true };
const keyring = { kdf: "PBKDF2-SHA256", iterations: 600_000, salt: "c2FsdHNhbHRzYWx0c2FsdA==", checkIv: "AAAAAAAAAAAAAAAA", checkCt: "Y2hlY2s=" };

function input(raw: unknown) {
  const r = parseEntryInput(raw);
  if (!r.ok) throw new Error(r.error);
  return r.input;
}

beforeEach(() => __useMemoryDbForTests());

describe("entry input validation", () => {
  it("requires a body, a writable room and an explicit share confirmation", () => {
    expect(parseEntryInput({ ...shared, body: "   " })).toEqual({ ok: false, error: "body_required" });
    expect(parseEntryInput({ ...shared, roomId: 2 })).toEqual({ ok: false, error: "room_not_writable" });
    expect(parseEntryInput({ ...shared, confirmShare: undefined })).toEqual({ ok: false, error: "confirm_required" });
    expect(parseEntryInput({ ...shared, title: "가".repeat(41) })).toEqual({ ok: false, error: "title_too_long" });
    expect(parseEntryInput({ ...shared, body: "가".repeat(5001) })).toEqual({ ok: false, error: "body_too_long" });
    expect(parseEntryInput({ kind: "public", roomId: 1 })).toEqual({ ok: false, error: "invalid_request" });
  });

  it("rejects sealed entries that carry plaintext or malformed ciphertext", () => {
    expect(parseEntryInput({ ...sealed, body: "평문" }).ok).toBe(false);
    expect(parseEntryInput({ ...sealed, title: "제목" }).ok).toBe(false);
    expect(parseEntryInput({ ...sealed, ciphertext: "not base64!" }).ok).toBe(false);
    expect(parseEntryInput(sealed).ok).toBe(true);
  });

  it("only accepts strong KDF settings for the keyring", () => {
    expect(parseKeyring(keyring)).not.toBeNull();
    expect(parseKeyring({ ...keyring, iterations: 1000 })).toBeNull();
    expect(parseKeyring({ ...keyring, kdf: "MD5" })).toBeNull();
  });
});

describe("entry storage", () => {
  it("stores sealed entries as ciphertext only (no plaintext columns)", () => {
    createEntry("mother", input(sealed));
    const row = getDb().prepare("SELECT title, body, ciphertext FROM entries").get() as Record<string, unknown>;
    expect(row.title).toBeNull();
    expect(row.body).toBeNull();
    expect(row.ciphertext).toBe(sealed.ciphertext);
  });

  it("the database refuses a sealed row with plaintext", () => {
    expect(() =>
      getDb()
        .prepare("INSERT INTO entries (id, owner, room_id, kind, body, iv, ciphertext, created_at, updated_at) VALUES ('x','mother',1,'sealed','평문','a','b',1,1)")
        .run(),
    ).toThrow();
  });

  it("isolates parents: no cross-parent read, edit or delete", () => {
    const m = createEntry("mother", input(shared));
    const f = createEntry("father", input(sealed));
    if (!m.ok || !f.ok) throw new Error();
    expect(listOwnEntries("mother").map((e) => e.id)).toEqual([m.entry.id]);
    expect(listOwnEntries("father").map((e) => e.id)).toEqual([f.entry.id]);
    expect(replaceEntry("father", m.entry.id, input({ ...shared, body: "바꿈" }))).toBeNull();
    expect(deleteEntry("father", m.entry.id)).toBe(false);
    expect(listOwnEntries("mother")[0]).toMatchObject({ kind: "shared", body: "본문" });
  });

  it("the son sees shared entries only; sealed ones are invisible (not even counted)", () => {
    const s = createEntry("mother", input(shared));
    const p = createEntry("father", input(sealed));
    if (!s.ok || !p.ok) throw new Error();
    const list = listSharedForSon();
    expect(list.map((i) => i.id)).toEqual([s.entry.id]);
    expect(list[0]).not.toHaveProperty("body"); // list never shows bodies automatically
    expect(getSharedForSon(p.entry.id)).toBeNull();
    expect(getSharedForSon(s.entry.id)?.body).toBe("본문");
  });

  it("changing visibility replaces the content; shared -> sealed removes plaintext", () => {
    const s = createEntry("mother", input(shared));
    if (!s.ok) throw new Error();
    replaceEntry("mother", s.entry.id, input(sealed));
    expect(listSharedForSon()).toHaveLength(0);
    const row = getDb().prepare("SELECT title, body FROM entries").get() as Record<string, unknown>;
    expect(row).toEqual({ title: null, body: null });
  });

  it("owner can delete; the son no longer sees it", () => {
    const s = createEntry("father", input(shared));
    if (!s.ok) throw new Error();
    expect(deleteEntry("father", s.entry.id)).toBe(true);
    expect(listSharedForSon()).toHaveLength(0);
  });

  it("keyring is per parent, created once, and reset deletes only sealed entries", () => {
    expect(createKeyring("mother", parseKeyring(keyring)!)).toBe(true);
    expect(createKeyring("mother", parseKeyring(keyring)!)).toBe(false);
    expect(getKeyring("father")).toBeNull();
    createEntry("mother", input(sealed));
    createEntry("mother", input(shared));
    createEntry("father", input(sealed));
    expect(resetKeyring("mother").deletedSealed).toBe(1);
    expect(getKeyring("mother")).toBeNull();
    expect(listOwnEntries("mother").map((e) => e.kind)).toEqual(["shared"]);
    expect(listOwnEntries("father")).toHaveLength(1);
  });
});
