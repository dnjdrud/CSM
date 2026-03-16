import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/repository";
import { getAuthUserId, getAuthUserEmail } from "@/lib/auth/session";
import { ensureProfileForBypassEmail } from "@/lib/data/userProvisioning";
import { isOnboardingBypassEmail } from "@/lib/auth/bypass";
import { RequestAccessForm } from "./_components/RequestAccessForm";
import { OnboardingFlow } from "./_components/OnboardingFlow";
import { HashSessionRedirect } from "./_components/HashSessionRedirect";
import { FlashBanner } from "@/components/FlashBanner";

type Props = { searchParams: Promise<{ message?: string }> };

/** Admin-approval only: request access (no login) or complete profile (bypass email). ADMIN can access for testing. */
export default async function OnboardingPage({ searchParams }: Props) {
  const { message } = await searchParams;
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.role !== "ADMIN") redirect("/feed");

  const authUserId = await getAuthUserId();
  const email = await getAuthUserEmail();
  if (authUserId && email && isOnboardingBypassEmail(email)) {
    await ensureProfileForBypassEmail({ userId: authUserId, email });
    if (currentUser?.role !== "ADMIN") redirect("/feed");
  }

  if (authUserId) {
    return <OnboardingFlow />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <HashSessionRedirect />
      <div className="w-full max-w-md">
        {message === "account_created" && (
          <div className="mb-6">
            <FlashBanner
              title="Account created"
              body="You can sign in with your email now."
              optional="Use the link we sent you, or request a new sign-in link below."
            />
          </div>
        )}
        {message === "account_already_created" && (
          <div className="mb-6">
            <FlashBanner
              title="Already signed up"
              body="This signup link was already used."
              optional="Sign in with your email below."
            />
          </div>
        )}
        <h1 className="text-xl font-serif font-normal text-theme-text tracking-tight">
          Request access
        </h1>
        <p className="mt-3 text-[15px] text-theme-text-2 leading-relaxed">
          Submit your details. An admin will review your request. You’ll receive an email with a link to complete signup (valid 7 days) once approved.
        </p>
        <RequestAccessForm />
        <p className="mt-6 text-center text-sm text-theme-muted">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-theme-text underline hover:text-theme-primary">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
