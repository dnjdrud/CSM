"use client";

import { useState, useEffect } from "react";
import { ROLE_DISPLAY, type UserRole, type SignupRequest } from "@/lib/domain/types";

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

export function CompleteSignupForm({ token, request, initialError }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    password.length >= 8 &&
    password === confirmPassword &&
    name.trim().length > 0 &&
    username.trim().length >= 2 &&
    /^[a-zA-Z0-9_]+$/.test(username.trim()) &&
    denomination.trim().length > 0 &&
    church.trim().length > 0 &&
    !pending;

  const inputCls = "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400";
  const inputReqCls = "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Complete signup
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Set your password and confirm your profile. You'll be signed in and taken to the feed when done.
        </p>

        <form
          action="/api/auth/complete"
          method="POST"
          className="mt-8 space-y-5"
          onSubmit={() => setPending(true)}
        >
          <input type="hidden" name="token" value={token} />

          <div>
            <label className="block text-sm font-medium text-gray-800">Email</label>
            <p className="mt-1 text-[15px] text-gray-700">{request.email}</p>
          </div>

          {/* Username — required */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-800">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="Letters, numbers, underscore (min 2 chars)"
              minLength={2}
              maxLength={30}
              required
              className={inputReqCls}
              autoComplete="username"
            />
            <p className="mt-1 text-xs text-gray-500">Only letters, numbers, and underscores allowed.</p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputReqCls}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Same as above"
              className={inputReqCls}
              autoComplete="new-password"
              required
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-800">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputReqCls}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-800">Role</label>
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
            <label htmlFor="denomination" className="block text-sm font-medium text-gray-800">
              Denomination <span className="text-red-500">*</span>
            </label>
            <select
              id="denomination"
              name="denomination"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              required
              className={inputReqCls}
            >
              <option value="">Select your denomination</option>
              {DENOMINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Church — required */}
          <div>
            <label htmlFor="church" className="block text-sm font-medium text-gray-800">
              Church <span className="text-red-500">*</span>
            </label>
            <input
              id="church"
              name="church"
              type="text"
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              placeholder="Your church or ministry"
              required
              className={inputReqCls}
            />
          </div>

          {/* Bio — optional */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-800">
              Bio <span className="text-gray-500 font-normal">(optional)</span>
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
            <label htmlFor="affiliation" className="block text-sm font-medium text-gray-800">
              Affiliation <span className="text-gray-500 font-normal">(optional)</span>
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
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "Creating account…" : "Complete signup"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-gray-500">
          After completing signup you'll be signed in and taken to the feed.
        </p>
      </div>
    </div>
  );
}
