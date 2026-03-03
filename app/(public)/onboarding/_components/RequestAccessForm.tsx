"use client";

import { useState } from "react";
import { requestSignupAction } from "../actions";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";

const ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];
const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_DISPLAY[value] }));

export function RequestAccessForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("LAY");
  const [church, setChurch] = useState("");
  const [bio, setBio] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50/80 p-6">
        <h2 className="text-lg font-medium text-gray-800">Thanks</h2>
        <p className="mt-2 text-[15px] text-gray-600 leading-relaxed">
          Your request is pending approval. We’ll email you with a link to complete signup once it’s reviewed.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          You can close this page. If you have questions,{" "}
          <a href="/contact" className="text-gray-700 underline hover:text-gray-900">contact us</a>.
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
        <label htmlFor="request-email" className="block text-sm font-medium text-gray-800">
          Email
        </label>
        <input
          id="request-email"
          name="request_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          autoComplete="off"
          required
        />
      </div>
      <div>
        <label htmlFor="request-name" className="block text-sm font-medium text-gray-800">
          Name <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          id="request-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          autoComplete="name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          {ROLE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="request-church" className="block text-sm font-medium text-gray-800">
          Church <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          id="request-church"
          type="text"
          value={church}
          onChange={(e) => setChurch(e.target.value)}
          placeholder="Your church or ministry"
          className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>
      <div>
        <label htmlFor="request-bio" className="block text-sm font-medium text-gray-800">
          Bio <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="request-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="A short intro"
          className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y"
        />
      </div>
      <div>
        <label htmlFor="request-affiliation" className="block text-sm font-medium text-gray-800">
          Affiliation <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          id="request-affiliation"
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="Organization or network"
          className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        name="request_access_submit"
        disabled={pending}
        className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40"
      >
        {pending ? "Submitting…" : "Request access"}
      </button>
    </form>
  );
}
