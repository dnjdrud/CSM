"use client";

import { useState } from "react";
import { requestAccessAction } from "../actions";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";
import { useT } from "@/lib/i18n";
import { INPUT, BTN_PRIMARY } from "@/lib/design/tokens";

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

export function RequestAccessForm() {
  const t = useT();
  const sf = t.signupForm;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("LAY");
  const [denomination, setDenomination] = useState("");
  const [church, setChurch] = useState("");
  const [bio, setBio] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || pending) return;

    if (!name.trim()) { setError(sf.errName); return; }
    if (!denomination) { setError(sf.errDenomination); return; }
    if (!church.trim()) { setError(sf.errChurch); return; }

    setPending(true);
    setError(null);
    const result = await requestAccessAction({
      email: email.trim(),
      name: name.trim(),
      role,
      denomination,
      church: church.trim(),
      bio: bio.trim() || undefined,
      affiliation: affiliation.trim() || undefined,
    });
    setPending(false);
    if ("ok" in result && result.ok) {
      setSuccess(true);
      return;
    }
    setError("errorMessage" in result ? result.errorMessage : t.common.error);
  }

  if (success) {
    return (
      <div className="mt-8 rounded-xl border border-theme-border bg-theme-surface-2/50 p-6">
        <h2 className="text-lg font-medium text-theme-text">{sf.successTitle}</h2>
        <p className="mt-2 text-[15px] text-theme-text-2 leading-relaxed">
          {sf.successDesc}
        </p>
        <p className="mt-4 text-sm text-theme-muted">
          {sf.successNote}{" "}
          <a href="/contact" className="text-theme-primary underline-offset-2 hover:underline">{sf.successContact}</a>.
        </p>
      </div>
    );
  }

  const labelCls = "block text-sm font-medium text-theme-text";
  const optionalCls = "text-theme-muted font-normal";
  const reqMark = <span className="text-theme-danger">*</span>;

  return (
    <form
      name="request-access"
      onSubmit={handleSubmit}
      className="mt-8 space-y-5"
      autoComplete="off"
    >
      {/* Email */}
      <div>
        <label htmlFor="request-email" className={labelCls}>
          {sf.email} {reqMark}
        </label>
        <input
          id="request-email"
          name="request_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`mt-1.5 ${INPUT}`}
          autoComplete="off"
          required
        />
      </div>

      {/* Name */}
      <div>
        <label htmlFor="request-name" className={labelCls}>
          {sf.name} {reqMark}
        </label>
        <input
          id="request-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={sf.namePlaceholder}
          required
          className={`mt-1.5 ${INPUT}`}
        />
      </div>

      {/* Role */}
      <div>
        <label className={labelCls}>{sf.role}</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className={`mt-1.5 ${INPUT}`}
        >
          {ROLE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Denomination */}
      <div>
        <label htmlFor="request-denomination" className={labelCls}>
          {sf.denomination} {reqMark}
        </label>
        <select
          id="request-denomination"
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
          required
          className={`mt-1.5 ${INPUT}`}
        >
          <option value="">{sf.denominationPlaceholder}</option>
          {DENOMINATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Church */}
      <div>
        <label htmlFor="request-church" className={labelCls}>
          {sf.church} {reqMark}
        </label>
        <input
          id="request-church"
          type="text"
          value={church}
          onChange={(e) => setChurch(e.target.value)}
          placeholder={sf.churchPlaceholder}
          required
          className={`mt-1.5 ${INPUT}`}
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="request-bio" className={labelCls}>
          {sf.bio} <span className={optionalCls}>{sf.optional}</span>
        </label>
        <textarea
          id="request-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder={sf.bioPlaceholder}
          className={`mt-1.5 ${INPUT} resize-y text-sm`}
        />
      </div>

      {/* Affiliation */}
      <div>
        <label htmlFor="request-affiliation" className={labelCls}>
          {sf.affiliation} <span className={optionalCls}>{sf.optional}</span>
        </label>
        <input
          id="request-affiliation"
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder={sf.affiliationPlaceholder}
          className={`mt-1.5 ${INPUT}`}
        />
      </div>

      {error && (
        <p className="text-sm text-theme-danger" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={BTN_PRIMARY}
      >
        {pending ? sf.submitting : sf.submitRequest}
      </button>
    </form>
  );
}
