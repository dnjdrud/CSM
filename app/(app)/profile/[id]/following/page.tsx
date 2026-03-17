import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUserId } from "@/lib/auth/session";
import { getUserById, listFollowing, listFollowingIds } from "@/lib/data/repository";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { ProfileFollowButton } from "../_components/ProfileFollowButton";

export const dynamic = "force-dynamic";

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, following, currentUserId] = await Promise.all([
    getUserById(id),
    listFollowing(id),
    getAuthUserId(),
  ]);

  if (!user) notFound();

  const viewerFollowingIds = currentUserId ? await listFollowingIds(currentUserId) : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-5">
        <Link
          href={`/profile/${id}`}
          className="text-[13px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded"
        >
          ← {user.name}
        </Link>
        <h1 className="mt-3 text-[18px] font-semibold text-theme-text">
          Following
          <span className="ml-2 text-[15px] font-normal text-theme-muted">{following.length}</span>
        </h1>
      </div>

      {following.length === 0 ? (
        <p className="text-[14px] text-theme-muted py-6">Not following anyone yet.</p>
      ) : (
        <ul className="list-none p-0 space-y-1" role="list">
          {following.map((person) => (
            <li key={person.id} className="flex items-center gap-3 py-3">
              <Link href={`/profile/${person.id}`} className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded-full">
                <Avatar name={person.name} src={person.avatarUrl} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${person.id}`}
                  className="text-[14px] font-medium text-theme-text hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded"
                >
                  {person.name}
                </Link>
                <p className="text-[12px] text-theme-muted truncate">
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
