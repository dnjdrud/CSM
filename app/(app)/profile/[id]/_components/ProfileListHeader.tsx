import Link from "next/link";

type Props = {
  profileId: string;
  title: string;
  subtitle: string;
};

/** Back link + title + subtitle for profile list pages (notes, testimonies, posts). */
export function ProfileListHeader({ profileId, title, subtitle }: Props) {
  return (
    <>
      <div className="pt-4 pb-4">
        <Link
          href={`/profile/${profileId}`}
          className="text-[14px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← Back to profile
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
        {title}
      </h1>
      <p className="mt-1 text-[15px] text-gray-600 leading-relaxed">
        {subtitle}
      </p>
    </>
  );
}
