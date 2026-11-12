"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, errorText, fetchKeyring, resetKeyring, saveKeyring } from "@/lib/entries-client";
import { PERSONAL_PASSWORD_MIN, createKeyring, unlock, vaultKey, type KeyringData } from "@/lib/vault";

/** Current in-tab key (null = locked). Memory only. */
export function useVaultKey(): CryptoKey | null {
  return useSyncExternalStore(vaultKey.subscribe, vaultKey.get, () => null);
}

type Mode = "loading" | "create" | "unlock" | "forgot" | "error";

/**
 * Create or enter the personal password (separate from the login code).
 * The password is used only in this tab to derive the key; it is never sent or stored.
 *
 * Every long step (key derivation, server request) runs under an operation token and
 * the vault epoch captured when it started. If the panel was cancelled or unmounted,
 * another operation started, or the vault was wiped (lock, logout, page hide, session
 * change) meanwhile, the result is dropped: no key is stored and onReady (which may
 * trigger a save) is NOT called. A keyring the server already created is kept as is;
 * the next visit reads the server state again (it then asks to unlock).
 */
export function VaultPanel({ onReady, onCancel, cancelLabel = "돌아가기" }: { onReady: (key: CryptoKey) => void; onCancel: () => void; cancelLabel?: string }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [keyring, setKeyring] = useState<KeyringData | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const op = useRef(0);
  const mounted = useRef(false);

  /** Reads the keyring state from the server (again). Never trusts what this screen saw before. */
  const loadState = useCallback(() => {
    const token = ++op.current;
    return fetchKeyring()
      .then((k) => {
        if (!mounted.current || token !== op.current) return;
        setKeyring(k);
        setMode(k ? "unlock" : "create");
      })
      .catch((e) => {
        if (!mounted.current || token !== op.current) return;
        setError(errorText(e));
        setMode("error");
      });
  }, []);

  const reload = () => {
    setMode("loading");
    void loadState();
  };

  useEffect(() => {
    mounted.current = true;
    void loadState();
    return () => {
      mounted.current = false;
      op.current += 1; // invalidates anything still running
    };
  }, [loadState]);

  // A wipe (lock / logout / page hide / session expiry) cancels a running password step.
  // (The epoch check in begin() also catches it; this just releases the busy state.)
  const running = useRef(false);
  useEffect(
    () =>
      vaultKey.subscribe(() => {
        if (running.current && !vaultKey.get()) {
          op.current += 1;
          running.current = false;
          if (mounted.current) setBusy(false);
        }
      }),
    [],
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [mode]);

  const heading = (t: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-title font-bold outline-none">
      {t}
    </h1>
  );

  /** Starts one operation; returns a checker that is true only while it is still current. */
  function begin(): (() => boolean) | null {
    if (busy) return null; // ignore repeated taps
    const token = ++op.current;
    const ep = vaultKey.epoch();
    running.current = true;
    setBusy(true);
    setError(null);
    return () => mounted.current && token === op.current && ep === vaultKey.epoch();
  }

  function cancel() {
    op.current += 1; // anything still running is now stale
    running.current = false;
    setPw("");
    setPw2("");
    setBusy(false);
    onCancel();
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if ([...pw].length < PERSONAL_PASSWORD_MIN) return setError(`${PERSONAL_PASSWORD_MIN}자 이상으로 만들어 주세요.`);
    if (pw !== pw2) return setError("두 번 적은 비밀번호가 서로 달라요. 다시 확인해 주세요.");
    const current = begin();
    if (!current) return;
    const ep = vaultKey.epoch();
    try {
      const { keyring: k, key } = await createKeyring(pw);
      if (!current()) return;
      await saveKeyring(k);
      if (!current()) return; // created on the server, but this screen was left: do not use it now
      setPw("");
      setPw2("");
      if (!vaultKey.set(key, ep)) return;
      onReady(key);
    } catch (err) {
      if (!current()) return;
      if (err instanceof ApiError && err.code === "exists") {
        // Made meanwhile (e.g. in another tab): read the server state again and ask to unlock.
        setPw("");
        setPw2("");
        reload();
        setError("개인 비밀번호가 이미 만들어져 있어요. 그 비밀번호를 적어주세요.");
        return;
      }
      setError(errorText(err));
    } finally {
      if (current()) {
        running.current = false;
        setBusy(false);
      }
    }
  }

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!keyring || busy) return;
    if (!pw) return setError("개인 비밀번호를 적어주세요.");
    const current = begin();
    if (!current) return;
    const ep = vaultKey.epoch();
    try {
      const key = await unlock(pw, keyring);
      if (!current()) return;
      if (!key) {
        setError("개인 비밀번호가 맞지 않아요. 다시 적어주세요.");
        return;
      }
      setPw("");
      if (!vaultKey.set(key, ep)) return;
      onReady(key);
    } catch {
      if (current()) setError("이 브라우저에서는 글을 잠그고 여는 기능을 쓸 수 없어요.");
    } finally {
      if (current()) {
        running.current = false;
        setBusy(false);
      }
    }
  }

  async function onReset() {
    const current = begin();
    if (!current) return;
    try {
      await resetKeyring();
      vaultKey.wipe();
      if (!mounted.current) return;
      setKeyring(null);
      setPw("");
      setPw2("");
      setMode("create");
    } catch (err) {
      if (current()) setError(errorText(err));
    } finally {
      if (current()) {
        running.current = false;
        setBusy(false);
      }
    }
  }

  const errorBox = error && (
    <p role="alert" className="mt-4 rounded-2xl bg-error-bg p-4 text-error">
      {error}
    </p>
  );
  const busyText = busy && (
    <p role="status" className="mt-4">
      잠시만 기다려 주세요…
    </p>
  );
  const inputCls = "mt-2 w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-2xl text-text";

  if (mode === "loading") return <p role="status">불러오는 중이에요…</p>;

  if (mode === "error") {
    return (
      <section className="flex flex-1 flex-col">
        {heading("개인 비밀번호")}
        {errorBox}
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-secondary" onClick={cancel}>
            {cancelLabel}
          </button>
        </div>
      </section>
    );
  }

  if (mode === "forgot") {
    return (
      <section className="flex flex-1 flex-col">
        {heading("개인 비밀번호를 잊으셨나요?")}
        <div className="prose-warm panel">
          <p>개인 비밀번호는 아들도, 관리자도 알 수 없어서 되찾아 드릴 수 없어요.</p>
          <p>
            새 비밀번호를 만들면 지금까지 <strong>나만 간직한 글과 초안이 모두 지워져요.</strong> 아들에게 이미 전한 글은 그대로 남아요.
          </p>
          <p>혹시 비밀번호가 기억나실 수도 있다면, 지우지 말고 나중에 다시 시도해 보세요.</p>
        </div>
        {errorBox}
        {busyText}
        <div className="mt-auto grid gap-3 pt-10">
          <button type="button" className="btn btn-primary" onClick={() => setMode("unlock")}>
            다시 입력해 볼게요
          </button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onReset}>
            글을 지우고 새로 만들기
          </button>
        </div>
      </section>
    );
  }

  if (mode === "create") {
    return (
      <section className="flex flex-1 flex-col">
        {heading("개인 비밀번호 만들기")}
        <ul className="panel mb-6 grid list-disc gap-2 pl-10">
          <li>나만 간직하는 글과 초안은 이 비밀번호로 잠가서 저장해요.</li>
          <li>아들도, 다른 부모님도, 관리자도 열어볼 수 없어요.</li>
          <li>로그인 비밀번호와 다른 것으로 만들어 주세요.</li>
          <li>
            <strong>잊어버리면 누구도 되찾아 드릴 수 없어요.</strong> 잠긴 글도 다시 열 수 없어요.
          </li>
          <li>다른 휴대폰에서도 로그인한 뒤 같은 개인 비밀번호를 적으면 열 수 있어요.</li>
        </ul>
        <form onSubmit={onCreate} className="grid gap-4" noValidate>
          <label htmlFor={`${id}-a`} className="font-bold">
            개인 비밀번호 ({PERSONAL_PASSWORD_MIN}자 이상)
            <input id={`${id}-a`} type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
          </label>
          <label htmlFor={`${id}-b`} className="font-bold">
            한 번 더 적어주세요
            <input id={`${id}-b`} type="password" autoComplete="off" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputCls} />
          </label>
          {errorBox}
          {busyText}
          <div className="grid gap-3 pt-6">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              만들기
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancel}>
              {cancelLabel}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col">
      {heading("개인 비밀번호 입력")}
      <p className="mb-6">나만 간직하는 글을 잠그고 열 때 쓰는 비밀번호예요. 로그인 비밀번호와 달라요.</p>
      <form onSubmit={onUnlock} className="grid gap-4" noValidate>
        <label htmlFor={`${id}-u`} className="font-bold">
          개인 비밀번호
          <input id={`${id}-u`} type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
        </label>
        {errorBox}
        {busyText}
        <div className="grid gap-3 pt-6">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            열기
          </button>
          <button type="button" className="btn btn-secondary" onClick={cancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setMode("forgot")}>
            비밀번호를 잊었어요
          </button>
        </div>
      </form>
    </section>
  );
}
