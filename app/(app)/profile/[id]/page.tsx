import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserById } from "@/lib/data/repository";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getUserById(id);
  if (!user) return notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-theme-border/60 bg-theme-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-theme-primary">
          {user.name || "Unknown"}
        </h1>

        <div className="mt-2 text-sm text-theme-muted space-y-1">
          <div>Role: {user.role}</div>
          {"church" in user && (user as any).church ? (
            <div>Church: {(user as any).church}</div>
          ) : null}
          {"username" in user && (user as any).username ? (
            <div>Username: {(user as any).username}</div>
          ) : null}
          {user.affiliation ? <div>Affiliation: {user.affiliation}</div> : null}
          {user.bio ? (
            <div className="mt-2 whitespace-pre-wrap text-theme-primary/90">
              {user.bio}
            </div>
          ) : null}
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