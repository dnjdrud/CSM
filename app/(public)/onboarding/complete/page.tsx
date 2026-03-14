import { verifyApprovalToken } from "@/lib/data/signupRepository";
import { CompleteSignupForm } from "./_components/CompleteSignupForm";
import { getServerT } from "@/lib/i18n/server";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function OnboardingCompletePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const [verified, t] = await Promise.all([
    token ? verifyApprovalToken(token) : Promise.resolve(null),
    getServerT(),
  ]);
  const sf = t.signupForm;

  if (!verified) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
            {sf.linkInvalid}
          </h1>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            {sf.linkInvalidDesc}
          </p>
          <p className="mt-6">
            <a
              href="/onboarding"
              className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
            >
              {sf.backToRequest}
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
