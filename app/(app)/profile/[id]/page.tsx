// app/(app)/profile/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserById } from "@/lib/data/repository"; // 이미 HeaderWrapper에서 쓰는 그 함수

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUserById(params.id);
  if (!user) return notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-theme-border/60 bg-theme-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-theme-primary">
          {user.name || "Unknown"}
        </h1>

        <div className="mt-2 text-sm text-theme-muted">
          <div>Role: {user.role}</div>
          {user.affiliation ? <div>Affiliation: {user.affiliation}</div> : null}
          {user.bio ? <div className="mt-2 whitespace-pre-wrap">{user.bio}</div> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/profile/${user.id}/posts`}
            className="rounded-lg border border-theme-border/60 bg-theme-surface-2 px-3 py-2 text-sm text-theme-primary hover:opacity-80"
          >
            Posts
          </Link>
          <Link
            href={`/profile/${user.id}/notes`}
            className="rounded-lg border border-theme-border/60 bg-theme-surface-2 px-3 py-2 text-sm text-theme-primary hover:opacity-80"
          >
            Notes
          </Link>
          <Link
            href={`/profile/${user.id}/testimonies`}
            className="rounded-lg border border-theme-border/60 bg-theme-surface-2 px-3 py-2 text-sm text-theme-primary hover:opacity-80"
          >
            Testimonies
          </Link>
        </div>
      </div>
    </main>
  );
}