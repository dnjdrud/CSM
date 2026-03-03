import Link from "next/link";

export default function SupportThankYouPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Thank you
      </h1>
      <p className="mt-6 text-gray-800 font-sans leading-relaxed">
        Your intention to support this work has been noted. In a full implementation, you would complete your gift securely. We are grateful for your support.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block text-sm font-medium text-gray-800 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
      >
        Return home
      </Link>
    </div>
  );
}
