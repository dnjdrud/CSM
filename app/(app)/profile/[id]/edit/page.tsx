import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAuthUserId } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/repository";
import { ProfileEditForm } from "./_components/ProfileEditForm";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [currentUserId, user] = await Promise.all([
    getAuthUserId(),
    getUserById(id),
  ]);

  if (!user) notFound();
  if (currentUserId !== id) redirect(`/profile/${id}`);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/profile/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← 프로필로 돌아가기
        </Link>
      </div>
      <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight mb-6">
        프로필 편집
      </h1>
      <ProfileEditForm user={user} />
    </div>
  );
}
