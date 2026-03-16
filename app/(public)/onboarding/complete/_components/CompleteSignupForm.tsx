"use client";

import { useState } from "react";
import { completeSignupAction } from "../actions";
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

type Step = 1 | 2 | 3;

type Props = { token: string; request: SignupRequest };

const inputCls = "mt-1.5 block w-full rounded-input border border-theme-border bg-theme-surface px-3 py-2.5 text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors";

export function CompleteSignupForm({ token, request }: Props) {
  const t = useT();
  const sf = t.signupForm;

  const [step, setStep] = useState<Step>(1);

  // Step 1: Account (username only — no password, uses magic link auth)
  const [username, setUsername] = useState("");

  // Step 2: Identity
  const [name, setName] = useState(request.name ?? "");
  const [role, setRole] = useState<UserRole>(request.role);
  const [denomination, setDenomination] = useState(request.denomination ?? "");
  const [faithYears, setFaithYears] = useState<string>(
    request.faithYears != null ? String(request.faithYears) : ""
  );

  // Step 3: Community
  const [church, setChurch] = useState(request.church ?? "");
  const [affiliation, setAffiliation] = useState(request.affiliation ?? "");
  const [bio, setBio] = useState(request.bio ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1Valid =
    username.trim().length >= 2 &&
    /^[a-zA-Z0-9_]+$/.test(username.trim());
  const step2Valid = name.trim().length > 0 && denomination.trim().length > 0 && faithYears.trim().length > 0;
  const step3Valid = church.trim().length > 0;

  function handleNext() {
    setError(null);
    if (step === 1) {
      if (!username.trim()) { setError(sf.errUsername); return; }
      if (username.trim().length < 2) { setError(sf.errUsernameLength); return; }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setError(sf.errUsernameFormat); return; }
      setStep(2);
    } else if (step === 2) {
      if (!name.trim()) { setError(sf.errName); return; }
      if (!denomination.trim()) { setError(sf.errDenomination); return; }
      if (!faithYears.trim()) { setError(sf.errFaithYears); return; }
      setStep(3);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!step1Valid || !step2Valid || !step3Valid || pending) return;
    if (!church.trim()) { setError(sf.errChurchRequired); return; }
    setPending(true);
    setError(null);
    const result = await completeSignupAction({
      token,
      username: username.trim(),
      name: name.trim(),
      role,
      church: church.trim(),
      bio: bio.trim() || undefined,
      affiliation: affiliation.trim() || undefined,
      denomination: denomination.trim(),
      faithYears: faithYears ? Number(faithYears) : undefined,
    });
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  const STEP_LABELS = [sf.stepAccount, sf.stepProfile, sf.stepCommunity];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-serif font-normal text-theme-text tracking-tight">
          {sf.completeTitle}
        </h1>
        <p className="mt-3 text-[15px] text-theme-text-2 leading-relaxed">
          {sf.completeDesc}
        </p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2 flex-wrap">
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as Step;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${step >= s ? "bg-theme-primary text-white" : "bg-theme-surface-2 text-theme-muted"}`}>
                  {step > s ? "✓" : s}
                </div>
                <span className={`text-sm ${step === s ? "text-theme-text font-medium" : "text-theme-muted"}`}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className="mx-1 h-px w-6 bg-theme-border" />}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          {/* ─── Step 1: Account ─── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-theme-text">{sf.email}</label>
                <p className="mt-1 text-[15px] text-theme-text">{request.email}</p>
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-theme-text">
                  {sf.username} <span className="text-theme-danger">*</span>
                </label>
                <input
                  id="username"
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
            </>
          )}

          {/* ─── Step 2: Identity ─── */}
          {step === 2 && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-theme-text">
                  {sf.name}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text">{sf.role}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={inputCls}
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="denomination" className="block text-sm font-medium text-theme-text">
                  {sf.denomination} <span className="text-theme-danger">*</span>
                </label>
                <select
                  id="denomination"
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                  className={inputCls}
                >
                  <option value="" disabled>{sf.denominationPlaceholder}</option>
                  {DENOMINATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="faithYears" className="block text-sm font-medium text-theme-text">
                  {sf.faithYears} <span className="text-theme-danger">*</span>
                </label>
                <input
                  id="faithYears"
                  type="number"
                  min={0}
                  max={120}
                  value={faithYears}
                  onChange={(e) => setFaithYears(e.target.value)}
                  placeholder={sf.faithYearsPlaceholder}
                  className={inputCls}
                />
              </div>
            </>
          )}

          {/* ─── Step 3: Community ─── */}
          {step === 3 && (
            <>
              <div>
                <label htmlFor="church" className="block text-sm font-medium text-theme-text">
                  {sf.churchLabel} <span className="text-theme-danger">*</span>
                </label>
                <input
                  id="church"
                  type="text"
                  value={church}
                  onChange={(e) => setChurch(e.target.value)}
                  placeholder={sf.churchPlaceholder}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="affiliation" className="block text-sm font-medium text-theme-text">
                  {sf.affiliation} <span className="text-theme-muted font-normal">{sf.optional}</span>
                </label>
                <input
                  id="affiliation"
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder={sf.affiliationPlaceholder}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-theme-text">
                  {sf.bio} <span className="text-theme-muted font-normal">{sf.optional}</span>
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder={sf.bioPlaceholder}
                  className={`${inputCls} resize-y`}
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-theme-danger" role="alert">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setError(null); setStep((s) => (s - 1) as Step); }}
                className="rounded-button border border-theme-border px-5 py-2.5 text-sm font-medium text-theme-muted hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 transition-colors"
              >
                {sf.prev}
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 1 ? !step1Valid : !step2Valid}
                className="rounded-button bg-theme-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-theme-primary-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sf.next}
              </button>
            ) : (
              <button
                type="submit"
                disabled={pending || !step3Valid}
                className="rounded-button bg-theme-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-theme-primary-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? sf.creatingAccount : sf.completeSignup}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
