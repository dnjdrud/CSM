import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/repository";
import { getAuthUserId, getAuthUserEmail } from "@/lib/auth/session";
import { INVITE_ONLY } from "@/lib/config/features";
import { canSkipInviteForOnboarding } from "@/lib/admin/bootstrap";
import { isOnboardingBypassEmail } from "@/lib/auth/bypass";
import { ensureProfileForBypassEmail } from "@/lib/data/userProvisioning";
import { OnboardingFlow } from "./_components/OnboardingFlow";
import { MagicLinkForm } from "./_components/MagicLinkForm";
import { RequestAccessForm } from "./_components/RequestAccessForm";

/** If profile exists → /feed. If authenticated but no profile → invite flow or redirect to login. Else → request access form. */
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
    const skipInviteCode = canSkipInviteForOnboarding(email ?? undefined);
    return <OnboardingFlow inviteOnly={INVITE_ONLY} skipInviteCode={skipInviteCode} />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Request access
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          We’re a small community. Submit your request and we’ll get back to you after a quick review.
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
