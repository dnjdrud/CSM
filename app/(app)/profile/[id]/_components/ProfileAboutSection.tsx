import type { User } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAboutRoleCopy } from "@/lib/profile/roleProfileConfig";

type Props = {
  user: User;
};

export function ProfileAboutSection({ user }: Props) {
  const aboutRoleCopy = getAboutRoleCopy(user.role);
  const hasContent = user.bio || user.affiliation || aboutRoleCopy;

  if (!hasContent) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="This space is quiet for now."
      />
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-gray-800 font-sans">
      {user.bio && (
        <p className="leading-relaxed whitespace-pre-wrap">{user.bio}</p>
      )}
      {user.affiliation && (
        <p className="mt-3 text-gray-500 text-sm">{user.affiliation}</p>
      )}
      {aboutRoleCopy && (
        <p className="mt-3 text-gray-600 text-sm italic">{aboutRoleCopy}</p>
      )}
    </div>
  );
}
