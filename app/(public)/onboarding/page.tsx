import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/repository";
import { RequestAccessForm } from "./_components/RequestAccessForm";
import { FlashBanner } from "@/components/FlashBanner";
import Link from "next/link";

type Props = { searchParams: Promise<{ message?: string }> };

/** Request access page. Authenticated users are redirected to /feed (except ADMIN). */
export default async function OnboardingPage({ searchParams }: Props) {
  const { message } = await searchParams;
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.role !== "ADMIN") redirect("/feed");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
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
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Request access
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Submit your details. An admin will review your request. You'll receive an email with a link to complete signup (valid 7 days) once approved.
        </p>
        <RequestAccessForm />
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gray-700 underline hover:text-gray-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
