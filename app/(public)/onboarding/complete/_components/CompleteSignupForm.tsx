"use client";

import { useState } from "react";
import { completeSignupAction } from "../actions";
import { ROLE_DISPLAY, type UserRole, type SignupRequest } from "@/lib/domain/types";

const ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];
const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_DISPLAY[value] }));

type Props = { token: string; request: SignupRequest };

export function CompleteSignupForm({ token, request }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState(request.name ?? "");
  const [role, setRole] = useState<UserRole>(request.role);
  const [church, setChurch] = useState(request.church ?? "");
  const [bio, setBio] = useState(request.bio ?? "");
  const [affiliation, setAffiliation] = useState(request.affiliation ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    password.length >= 8 &&
    password === confirmPassword &&
    name.trim().length > 0 &&
    !pending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    const result = await completeSignupAction({
      token,
      password,
      username: username.trim() || undefined,
      name: name.trim(),
      role,
      church: church.trim() || undefined,
      bio: bio.trim() || undefined,
      affiliation: affiliation.trim() || undefined,
    });
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Complete signup
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Set your password and confirm your profile. You’ll be able to sign in after this.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-800">Email</label>
            <p className="mt-1 text-[15px] text-gray-700">{request.email}</p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-800">
              Username <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display name or handle"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Same as above"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              autoComplete="new-password"
              required
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-800">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              required
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
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="church" className="block text-sm font-medium text-gray-800">
              Church <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              id="church"
              type="text"
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-800">
              Bio <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y"
            />
          </div>

          <div>
            <label htmlFor="affiliation" className="block text-sm font-medium text-gray-800">
              Affiliation <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              id="affiliation"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
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
      </div>
    </div>
  );
}
