import Link from "next/link";
import { RequestAccessForm } from "./_components/RequestAccessForm";

export const metadata = {
  title: "Request access — CSM",
  description: "Request access to join the community. Await admin approval.",
};

export default function RequestAccessPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          Request access
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Submit your details. An admin will review your request. You’ll receive an email with a link to complete signup (valid 7 days) once approved.
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
