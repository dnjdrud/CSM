import Link from "next/link";
import { verifyApprovalToken } from "@/lib/data/signupRepository";
import { CompleteSignupForm } from "./_components/CompleteSignupForm";

type Props = { searchParams: Promise<{ token?: string }> };

export const metadata = {
  title: "Complete signup — CSM",
  description: "Set your password and complete your profile. Link valid 7 days.",
};

export default async function AuthCompletePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const verified = token ? await verifyApprovalToken(token) : null;

  if (!verified) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
            Link invalid or expired
          </h1>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            This link is invalid or expired (valid 7 days). If you were approved to join, request a new link from the person who approved you.
          </p>
          <p className="mt-6">
            <Link
              href="/request-access"
              className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
            >
              Request access
            </Link>
            {" · "}
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <CompleteSignupForm
      token={token!}
      request={verified.request}
    />
  );
}
