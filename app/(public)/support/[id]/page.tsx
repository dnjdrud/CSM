import Link from "next/link";
import { getMinistryById } from "@/lib/data/repository";
import { notFound } from "next/navigation";

export default async function SupportMinistryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ministry = getMinistryById(id);
  if (!ministry) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/support"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-8 inline-block"
      >
        ← Back to support
      </Link>
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Support this work
      </h1>
      <p className="mt-4 text-gray-800 font-sans leading-relaxed">
        Support given here is intentional and dignified. No public goals, no amounts on display. Your support goes to work you trust—between you, the ministry, and the Lord.
      </p>

      <section className="mt-10 border-b border-gray-200 pb-10" aria-labelledby="ministry-name">
        <h2 id="ministry-name" className="text-lg font-serif font-normal text-gray-800">
          {ministry.name}
        </h2>
        {ministry.location && (
          <p className="mt-0.5 text-sm text-gray-500">{ministry.location}</p>
        )}
        <p className="mt-3 text-gray-800 font-sans leading-relaxed">
          {ministry.description}
        </p>
        {ministry.supportAccount != null && ministry.supportAccount !== "" ? (
          <div className="mt-6 rounded-md border border-gray-200 bg-gray-50/80 p-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
              Support account
            </h3>
            <p className="mt-2 text-[15px] text-gray-800 font-sans leading-relaxed whitespace-pre-wrap">
              {ministry.supportAccount}
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-gray-200 bg-gray-50/50 p-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Support account
            </h3>
            <p className="mt-2 text-sm text-gray-500 font-sans">
              Details to be added.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
