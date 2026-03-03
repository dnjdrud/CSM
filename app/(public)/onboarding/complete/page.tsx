import { verifyApprovalToken } from "@/lib/data/signupRepository";
import { CompleteSignupForm } from "./_components/CompleteSignupForm";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function OnboardingCompletePage({ searchParams }: Props) {
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
            This link is invalid or expired. If you were approved to join, please request a new link from the person who approved you.
          </p>
          <p className="mt-6">
            <a
              href="/onboarding"
              className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
            >
              Back to request access
            </a>
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
