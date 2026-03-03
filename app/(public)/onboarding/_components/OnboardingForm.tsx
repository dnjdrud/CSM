"use client";

import { useState } from "react";
import { submitOnboarding } from "../actions";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";

/** Roles available at onboarding (ADMIN is bootstrapped via ADMIN_EMAILS, not selectable). */
const ONBOARDING_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

const ROLES: { value: UserRole; label: string }[] = ONBOARDING_ROLES.map((value) => ({
  value,
  label: ROLE_DISPLAY[value],
}));

type Props = { initialInviteCode?: string; inviteOnly?: boolean };

export function OnboardingForm({ initialInviteCode = "", inviteOnly = false }: Props) {
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [bio, setBio] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteOk = inviteOnly || inviteCode.trim().length > 0;
  const canSubmit = inviteOk && name.trim().length > 0 && role !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await submitOnboarding({
        inviteCode: inviteOnly ? undefined : inviteCode.trim(),
        name: name.trim(),
        role,
        bio: bio.trim() || undefined,
      });
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Introduce yourself
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          This is how you’ll appear in the community. A few things so others can know you.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {!inviteOnly && (
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-800">
                Invite code
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter your invite code"
                className="mt-1.5 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700"
                autoComplete="off"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-800">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1.5 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700"
              autoComplete="name"
            />
          </div>

          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-800">
                Role
              </legend>
              <div className="mt-2 space-y-2">
                {ROLES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                      className="rounded-full border-gray-200 text-gray-800 focus:ring-gray-700"
                    />
                    <span className="text-sm text-gray-800">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-800">
              Bio <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio"
              rows={3}
              className="mt-1.5 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 font-sans text-sm leading-relaxed placeholder:text-gray-500 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 resize-y"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit || pending}
              className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
