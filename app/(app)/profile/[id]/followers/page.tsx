import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUserId } from "@/lib/auth/session";
import { getUserById, listFollowers, listFollowingIds } from "@/lib/data/repository";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { ProfileFollowButton } from "../_components/ProfileFollowButton";

export const dynamic = "force-dynamic";

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, followers, currentUserId] = await Promise.all([
    getUserById(id),
    listFollowers(id),
    getAuthUserId(),
  ]);

  if (!user) notFound();

  const viewerFollowingIds = currentUserId ? await listFollowingIds(currentUserId) : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-5">
        <Link
          href={`/profile/${id}`}
          className="text-[13px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← {user.name}
        </Link>
        <h1 className="mt-3 text-[18px] font-semibold text-gray-900">
          Followers
          <span className="ml-2 text-[15px] font-normal text-gray-500">{followers.length}</span>
        </h1>
      </div>

      {followers.length === 0 ? (
        <p className="text-[14px] text-gray-500 py-6">No followers yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100" role="list">
          {followers.map((person) => (
            <li key={person.id} className="flex items-center gap-3 py-3">
              <Link href={`/profile/${person.id}`} className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded-full">
                <Avatar name={person.name} src={person.avatarUrl} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${person.id}`}
                  className="text-[14px] font-medium text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded"
                >
                  {person.name}
                </Link>
                <p className="text-[12px] text-gray-500 truncate">
                  {ROLE_DISPLAY[person.role]}
                  {person.affiliation ? ` · ${person.affiliation}` : ""}
                </p>
              </div>
              {currentUserId && currentUserId !== person.id && (
                <ProfileFollowButton
                  profileId={person.id}
                  following={viewerFollowingIds.includes(person.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
