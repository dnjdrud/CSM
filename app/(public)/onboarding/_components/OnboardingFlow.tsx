"use client";

import { RequestAccessForm } from "./RequestAccessForm";

/** Logged in but no profile (and not bypass): show request access form and note about approval link. */
export function OnboardingFlow() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
          If you were approved, use the link from your approval email to complete signup. Otherwise request access below.
        </p>
        <RequestAccessForm />
      </div>
    </div>
  );
}
