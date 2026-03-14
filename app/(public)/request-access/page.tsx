import Link from "next/link";
import { RequestAccessForm } from "./_components/RequestAccessForm";
import { getServerT } from "@/lib/i18n/server";

export const metadata = {
  title: "Request access — CSM",
  description: "Request access to join the community. Await admin approval.",
};

export default async function RequestAccessPage() {
  const t = await getServerT();
  const sf = t.signupForm;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          {sf.requestTitle}
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          {sf.requestDesc}
        </p>
        <RequestAccessForm />
        <p className="mt-6 text-center text-sm text-gray-500">
          {sf.alreadyHaveAccount}{" "}
          <Link href="/login" className="font-medium text-gray-700 underline hover:text-gray-900">
            {sf.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
