import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-serif font-normal text-gray-800">
        Profile unavailable
      </h1>
      <p className="mt-2 text-gray-500">
        This profile does not exist or you don’t have access to view it.
      </p>
      <Link
        href="/feed"
        className="mt-6 inline-block text-sm text-gray-800 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
      >
        Back to feed
      </Link>
    </div>
  );
}
