"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getMagicLinkForDev, requestMagicLinkAction } from "../actions";
import { InviteCodeField } from "./InviteCodeField";
import { INVITE_ONLY_TITLE, INVITE_ONLY_BODY } from "../_lib/inviteUi";

const DEV_SHOW_MAGIC_LINK = process.env.NEXT_PUBLIC_DEV_SHOW_MAGIC_LINK === "1";

type Props = { inviteOnly?: boolean };

export function MagicLinkForm({ inviteOnly = false }: Props) {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || pending) return;
    if (inviteOnly && !inviteCode.trim()) return;
    setPending(true);
    setError(null);
    setDevLink(null);
    try {
      const linkResult = await requestMagicLinkAction({
        email: trimmed,
        inviteCode: inviteOnly ? inviteCode.trim() : undefined,
      });
      if (!linkResult.ok) {
        setError(linkResult.error);
        setPending(false);
        return;
      }
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
      const { error: err } = await supabaseBrowser().auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });
      if (err) {
        setError(err.message);
        setPending(false);
        return;
      }
      setSent(true);
      if (DEV_SHOW_MAGIC_LINK && redirectTo) {
        const result = await getMagicLinkForDev(trimmed, redirectTo);
        if (result && "link" in result) setDevLink(result.link);
        else if (result && "error" in result) setError(result.error);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError(message);
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
            Check your email
          </h1>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            We sent a sign-in link to <strong className="font-medium text-gray-800">{email.trim()}</strong>. Click the link in that email to continue. It may take a minute to arrive.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            You can close this tab after you’ve signed in. If you don’t see the email, check your spam folder.
          </p>
          {devLink && (
            <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-medium text-amber-800 mb-2">개발용 링크 (이메일 한도 무시)</p>
              <a
                href={devLink}
                className="text-sm text-amber-700 underline break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {devLink}
              </a>
              <p className="mt-2 text-xs text-amber-600">위 링크를 클릭하면 로그인됩니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Sign in
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Enter your email. We’ll send a one-time link to sign in—no password. Your email is used only for sign-in and is not shared.
        </p>

        {inviteOnly && (
          <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50/80">
            <h2 className="text-sm font-medium text-gray-800">{INVITE_ONLY_TITLE}</h2>
            <p className="mt-1 text-[13px] text-gray-600 leading-relaxed">{INVITE_ONLY_BODY}</p>
            <div className="mt-4">
              <InviteCodeField
                value={inviteCode}
                onChange={setInviteCode}
                disabled={pending}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors duration-150"
              autoComplete="email"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600/90" role="alert">{error}</p>
          )}
          <div className="pt-1">
            <button
              type="submit"
              disabled={pending || (inviteOnly && !inviteCode.trim())}
              className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "Sending…" : "Send sign-in link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
