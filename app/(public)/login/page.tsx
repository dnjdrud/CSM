import { Suspense } from "react";
import { LoginForm } from "./_components/LoginForm";
import { FlashBanner } from "@/components/FlashBanner";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const showAccountCreated = message === "account_created";
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {showAccountCreated && (
          <FlashBanner
            title="Account created"
            body="You can sign in with your email now."
            optional="Use the link we sent you, or request a new one below."
          />
        )}
        <h1 className={`text-xl font-serif font-normal text-theme-text tracking-tight ${showAccountCreated ? "mt-6" : ""}`}>
          Sign in
        </h1>
        <p className="mt-3 text-[15px] text-theme-text-2 leading-relaxed">
          Enter your email to receive a sign-in link. No password required.
        </p>
        <Suspense fallback={<div className="mt-8 h-32 animate-pulse rounded-lg bg-theme-surface-2" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
