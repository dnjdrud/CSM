import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getProfileWithError } from "@/lib/data/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function DebugPanel({
  userId,
  role,
}: {
  userId: string | null;
  role: string | null;
}) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div
      className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900"
      role="status"
      aria-label="DEV ONLY session debug"
    >
      <p>
        <strong>DEV ONLY</strong> Session: userId={userId ?? "—"} role={role ?? "—"}
      </p>
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  const { user, errorMessage } = await getProfileWithError(id);

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <DebugPanel userId={session?.userId ?? null} role={session?.role ?? null} />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-xl font-semibold">Profile fetch failed</h1>
          {errorMessage ? (
            <p className="mt-2 text-sm">{errorMessage}</p>
          ) : (
            <p className="mt-2 text-sm">User not found or repository error.</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <DebugPanel userId={session?.userId ?? null} role={session?.role ?? null} />
      <div className="rounded-2xl border border-theme-border/60 bg-theme-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-theme-primary">
          {user.name || "Unknown"}
        </h1>

        <div className="mt-2 space-y-1 text-sm text-theme-muted">
          <div>Role: {user.role}</div>
          {"church" in user && (user as { church?: string }).church ? (
            <div>Church: {(user as { church: string }).church}</div>
          ) : null}
          {"username" in user && (user as { username?: string }).username ? (
            <div>Username: {(user as { username: string }).username}</div>
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
