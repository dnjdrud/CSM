"use client";

import { useState } from "react";
import { requestSignupAction } from "../actions";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";

const ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];
const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_DISPLAY[value] }));

const DENOMINATIONS = [
  "장로교 (통합)", "장로교 (합동)", "장로교 (기타)",
  "감리교", "침례교", "성결교", "순복음 / 오순절",
  "구세군", "루터교", "기타",
];

const inputCls = "mt-1.5 block w-full rounded-input border border-theme-border bg-theme-surface px-3 py-2.5 text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors";

export function RequestAccessForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("LAY");
  const [church, setChurch] = useState("");
  const [denomination, setDenomination] = useState("");
  const [bio, setBio] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || pending) return;
    setPending(true);
    setError(null);
    const result = await requestSignupAction({
      email: email.trim(),
      name: name.trim() || undefined,
      role,
      church: church.trim() || undefined,
      bio: bio.trim() || undefined,
      affiliation: affiliation.trim() || undefined,
      denomination: denomination.trim() || undefined,
    });
    setPending(false);
    if ("ok" in result && result.ok) {
      setSuccess(true);
      return;
    }
    setError("errorMessage" in result ? result.errorMessage : "Something went wrong.");
  }

  if (success) {
    return (
      <div className="mt-8 rounded-xl border border-theme-border bg-theme-surface-2/50 p-6">
        <h2 className="text-lg font-medium text-theme-text">Thanks</h2>
        <p className="mt-2 text-[15px] text-theme-text-2 leading-relaxed">
          Your request is pending approval. We'll email you with a link to complete signup once it's reviewed.
        </p>
        <p className="mt-4 text-sm text-theme-muted">
          You can close this page. If you have questions,{" "}
          <a href="/contact" className="text-theme-text underline hover:text-theme-primary">contact us</a>.
        </p>
      </div>
    );
  }

  return (
    <form
      name="request-access"
      onSubmit={handleSubmit}
      className="mt-8 space-y-5"
      autoComplete="off"
    >
      <div>
        <label htmlFor="request-email" className="block text-sm font-medium text-theme-text">
          Email
        </label>
        <input
          id="request-email"
          name="request_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
          autoComplete="off"
          required
        />
      </div>
      <div>
        <label htmlFor="request-name" className="block text-sm font-medium text-theme-text">
          Name <span className="text-theme-muted font-normal">(optional)</span>
        </label>
        <input
          id="request-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputCls}
          autoComplete="name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-theme-text">Role</label>
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
        <label htmlFor="request-church" className="block text-sm font-medium text-theme-text">
          Church <span className="text-theme-muted font-normal">(optional)</span>
        </label>
        <input
          id="request-church"
          type="text"
          value={church}
          onChange={(e) => setChurch(e.target.value)}
          placeholder="Your church or ministry"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="request-denomination" className="block text-sm font-medium text-theme-text">
          교단 <span className="text-theme-muted font-normal">(선택)</span>
        </label>
        <select
          id="request-denomination"
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
          className={inputCls}
        >
          <option value="">선택 안 함</option>
          {DENOMINATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="request-bio" className="block text-sm font-medium text-theme-text">
          Bio <span className="text-theme-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="request-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="A short intro"
          className={`${inputCls} resize-y`}
        />
      </div>
      <div>
        <label htmlFor="request-affiliation" className="block text-sm font-medium text-theme-text">
          Affiliation <span className="text-theme-muted font-normal">(optional)</span>
        </label>
        <input
          id="request-affiliation"
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="Organization or network"
          className={inputCls}
        />
      </div>
      {error && (
        <p className="text-sm text-theme-danger" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        name="request_access_submit"
        disabled={pending}
        className="rounded-button bg-theme-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-theme-primary-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-40 transition-colors"
      >
        {pending ? "Submitting…" : "Request access"}
      </button>
    </form>
  );
}
