import Link from "next/link";
import type { User } from "@/lib/domain/types";
import { listOpenReports } from "@/lib/data/moderationRepository";
import { getUserById } from "@/lib/data/repository";
import { Card, CardContent } from "@/components/ui/Card";
import { ModerationReportActions } from "./_components/ModerationReportActions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminModerationPage() {
  const reports = await listOpenReports();
  const userIds = new Set<string>();
  reports.forEach((r) => {
    userIds.add(r.reporterId);
    if (r.targetUserId) userIds.add(r.targetUserId);
  });
  const userList = await Promise.all(
    Array.from(userIds).map(async (id) => ({ id, user: await getUserById(id) }))
  );
  const users = new Map<string, User | null>();
  userList.forEach(({ id, user }) => users.set(id, user));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Moderation
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Open reports. Resolve, hide post, or delete comment (with confirmation).
      </p>

      {reports.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No open reports.</p>
      ) : (
        <Card className="mt-8">
          <CardContent>
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Type</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Reason</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Reporter</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Target</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 text-gray-800">{r.type}</td>
                  <td className="py-3 pr-4 text-gray-600">{r.reason ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/profile/${r.reporterId}`}
                      className="text-gray-800 hover:underline"
                    >
                      {users.get(r.reporterId)?.name ?? r.reporterId.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    {r.targetUserId ? (
                      <Link
                        href={`/profile/${r.targetUserId}`}
                        className="text-gray-800 hover:underline"
                      >
                        {users.get(r.targetUserId)?.name ?? r.targetUserId.slice(0, 8)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{formatDate(r.createdAt)}</td>
                  <td className="py-3">
                    <ModerationReportActions
                      report={r}
                      postLink={r.postId ? `/post/${r.postId}` : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
