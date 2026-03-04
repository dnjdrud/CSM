import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/repository";
import { getAuthUserId, getAuthUserEmail } from "@/lib/auth/session";
import { ensureProfileForBypassEmail } from "@/lib/data/userProvisioning";
import { isOnboardingBypassEmail } from "@/lib/auth/bypass";
import { RequestAccessForm } from "./_components/RequestAccessForm";
import { OnboardingFlow } from "./_components/OnboardingFlow";

/** Admin-approval only: request access (no login) or complete profile (bypass email). */
export default async function OnboardingPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) redirect("/feed");

  const authUserId = await getAuthUserId();
  const email = await getAuthUserEmail();
  if (authUserId && email && isOnboardingBypassEmail(email)) {
    await ensureProfileForBypassEmail({ userId: authUserId, email });
    redirect("/feed");
  }

  if (authUserId) {
    return <OnboardingFlow />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Request access
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Submit your details. An admin will review your request. You’ll receive an email with a link to complete signup (valid 7 days) once approved.
        </p>
        <RequestAccessForm />
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-gray-700 underline hover:text-gray-900">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
