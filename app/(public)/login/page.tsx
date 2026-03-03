import { Suspense } from "react";
import { LoginForm } from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Sign in
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Sign in with your email and password, or use Google or Kakao.
        </p>
        <Suspense fallback={<div className="mt-8 h-32 animate-pulse rounded-lg bg-gray-100" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
