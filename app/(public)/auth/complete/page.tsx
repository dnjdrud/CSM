import { redirect } from "next/navigation";
import { getCompletionLinkStatus } from "@/lib/data/signupRepository";
import { CompleteSignupForm } from "./_components/CompleteSignupForm";

type Props = { searchParams: Promise<{ token?: string; error?: string }> };

export const metadata = {
  title: "Complete signup — CSM",
  description: "Set your password and complete your profile. Link valid 7 days.",
};

export default async function AuthCompletePage({ searchParams }: Props) {
  const { token, error: errorParam } = await searchParams;
  const linkStatus = await getCompletionLinkStatus(token);
  const initialError = typeof errorParam === "string" ? decodeURIComponent(errorParam) : null;

  if (linkStatus.status === "invalid_or_expired") {
    redirect("/request-access?error=invalid_or_expired_token");
  }
  if (linkStatus.status === "already_completed") {
    redirect("/login?message=account_already_created");
  }

  return (
    <CompleteSignupForm
      token={token!}
      request={linkStatus.request}
      initialError={initialError}
    />
  );
}
