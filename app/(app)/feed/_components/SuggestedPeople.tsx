import Link from "next/link";
import { suggestPeopleToFollow } from "@/lib/data/repository";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";
import { ProfileFollowButton } from "@/app/(app)/profile/[id]/_components/ProfileFollowButton";

type Props = {
  currentUserId: string;
  role: UserRole;
};

export async function SuggestedPeople({ currentUserId, role }: Props) {
  const suggestions = await suggestPeopleToFollow({ currentUserId, role, limit: 5 });
  if (suggestions.length === 0) return null;

  return (
    <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
        함께할 사람들
      </p>
      <div className="space-y-3">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3">
            <Link href={`/profile/${user.id}`} className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {ROLE_DISPLAY[user.role]}{user.denomination ? ` · ${user.denomination}` : ""}
              </p>
            </Link>
            <ProfileFollowButton profileId={user.id} following={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
