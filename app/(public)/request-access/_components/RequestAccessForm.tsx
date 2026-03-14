"use client";

import { useState } from "react";
import { requestAccessAction } from "../actions";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";
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

  async function handleSubmit(e: React.FormEvent) {
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
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50/80 p-6">
        <h2 className="text-lg font-medium text-gray-800">{sf.successTitle}</h2>
        <p className="mt-2 text-[15px] text-gray-600 leading-relaxed">
          {sf.successDesc}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          {sf.successNote}{" "}
          <a href="/contact" className="text-gray-700 underline hover:text-gray-900">{sf.successContact}</a>.
        </p>
      </div>
    );
  }

  const inputCls = "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400";
  const inputReqCls = "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500";

  return (
    <form
      name="request-access"
      onSubmit={handleSubmit}
      className="mt-8 space-y-5"
      autoComplete="off"
    >
      {/* Email — required */}
      <div>
        <label htmlFor="request-email" className="block text-sm font-medium text-gray-800">
          {sf.email} <span className="text-red-500">*</span>
        </label>
        <input
          id="request-email"
          name="request_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputReqCls}
          autoComplete="off"
          required
        />
      </div>

      {/* Name — required */}
      <div>
        <label htmlFor="request-name" className="block text-sm font-medium text-gray-800">
          {sf.name} <span className="text-red-500">*</span>
        </label>
        <input
          id="request-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={sf.namePlaceholder}
          required
          className={inputReqCls}
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-800">{sf.role}</label>
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

      {/* Denomination — required */}
      <div>
        <label htmlFor="request-denomination" className="block text-sm font-medium text-gray-800">
          {sf.denomination} <span className="text-red-500">*</span>
        </label>
        <select
          id="request-denomination"
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
          required
          className={inputReqCls}
        >
          <option value="">{sf.denominationPlaceholder}</option>
          {DENOMINATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Church — required */}
      <div>
        <label htmlFor="request-church" className="block text-sm font-medium text-gray-800">
          {sf.church} <span className="text-red-500">*</span>
        </label>
        <input
          id="request-church"
          type="text"
          value={church}
          onChange={(e) => setChurch(e.target.value)}
          placeholder={sf.churchPlaceholder}
          required
          className={inputReqCls}
        />
      </div>

      {/* Bio — optional */}
      <div>
        <label htmlFor="request-bio" className="block text-sm font-medium text-gray-800">
          {sf.bio} <span className="text-gray-500 font-normal">{sf.optional}</span>
        </label>
        <textarea
          id="request-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder={sf.bioPlaceholder}
          className={`${inputCls} resize-y text-sm`}
        />
      </div>

      {/* Affiliation — optional */}
      <div>
        <label htmlFor="request-affiliation" className="block text-sm font-medium text-gray-800">
          {sf.affiliation} <span className="text-gray-500 font-normal">{sf.optional}</span>
        </label>
        <input
          id="request-affiliation"
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder={sf.affiliationPlaceholder}
          className={inputCls}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40"
      >
        {pending ? sf.submitting : sf.submitRequest}
      </button>
    </form>
  );
}
