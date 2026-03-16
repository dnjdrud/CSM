"use client";

import { useState, useEffect } from "react";
import { ROLE_DISPLAY, type UserRole, type SignupRequest } from "@/lib/domain/types";
import { useT } from "@/lib/i18n";

const ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];
const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_DISPLAY[value] }));

const DENOMINATIONS = [
  "장로교 (통합)",
  "장로교 (합동)",
  "장로교 (기타)",
  "감리교",
  "침례교",
  "성결교",
  "순복음 / 오순절",
  "구세군",
  "루터교",
  "기타",
];

type Props = { token: string; request: SignupRequest; initialError?: string | null };

const inputCls = "mt-1.5 block w-full rounded-input border border-theme-border bg-theme-surface px-3 py-2.5 text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors";

export function CompleteSignupForm({ token, request, initialError }: Props) {
  const t = useT();
  const sf = t.signupForm;

  const [username, setUsername] = useState("");
  const [name, setName] = useState(request.name ?? "");
  const [role, setRole] = useState<UserRole>(request.role);
  const [denomination, setDenomination] = useState(request.denomination ?? "");
  const [church, setChurch] = useState(request.church ?? "");
  const [bio, setBio] = useState(request.bio ?? "");
  const [affiliation, setAffiliation] = useState(request.affiliation ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  const canSubmit =
    name.trim().length > 0 &&
    username.trim().length >= 2 &&
    /^[a-zA-Z0-9_]+$/.test(username.trim()) &&
    denomination.trim().length > 0 &&
    church.trim().length > 0 &&
    !pending;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-serif font-normal text-theme-text tracking-tight">
          {sf.completeWebTitle}
        </h1>
        <p className="mt-3 text-[15px] text-theme-text-2 leading-relaxed">
          {sf.completeWebDesc}
        </p>

        <form
          action="/api/auth/complete"
          method="POST"
          className="mt-8 space-y-5"
          onSubmit={() => setPending(true)}
        >
          <input type="hidden" name="token" value={token} />

          <div>
            <label className="block text-sm font-medium text-theme-text">{sf.email}</label>
            <p className="mt-1 text-[15px] text-theme-text">{request.email}</p>
          </div>

          {/* Username — required */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-theme-text">
              {sf.username} <span className="text-theme-danger">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder={sf.usernamePlaceholder}
              minLength={2}
              maxLength={30}
              required
              className={inputCls}
              autoComplete="username"
            />
            <p className="mt-1 text-xs text-theme-muted">{sf.usernameHelper}</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-theme-text">
              {sf.name} <span className="text-theme-danger">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-theme-text">{sf.role}</label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={inputCls}
            >
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Denomination — required */}
          <div>
            <label htmlFor="denomination" className="block text-sm font-medium text-theme-text">
              {sf.denomination} <span className="text-theme-danger">*</span>
            </label>
            <select
              id="denomination"
              name="denomination"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              required
              className={inputCls}
            >
              <option value="">{sf.denominationPlaceholder}</option>
              {DENOMINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Church — required */}
          <div>
            <label htmlFor="church" className="block text-sm font-medium text-theme-text">
              {sf.church} <span className="text-theme-danger">*</span>
            </label>
            <input
              id="church"
              name="church"
              type="text"
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              placeholder={sf.churchPlaceholder}
              required
              className={inputCls}
            />
          </div>

          {/* Bio — optional */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-theme-text">
              {sf.bio} <span className="text-theme-muted font-normal">{sf.optional}</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className={`${inputCls} resize-y text-sm`}
            />
          </div>

          {/* Affiliation — optional */}
          <div>
            <label htmlFor="affiliation" className="block text-sm font-medium text-theme-text">
              {sf.affiliation} <span className="text-theme-muted font-normal">{sf.optional}</span>
            </label>
            <input
              id="affiliation"
              name="affiliation"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-sm text-theme-danger" role="alert">{error}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-button bg-theme-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-theme-primary-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? sf.creatingAccount : sf.completeSignup}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-theme-muted">
          {sf.completeWebFooter}
        </p>
      </div>
    </div>
  );
}
