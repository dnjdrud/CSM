import Link from "next/link";
import { listAuditLogs } from "@/lib/data/adminRepository";
import { getUserById } from "@/lib/data/repository";
import { Card, CardContent } from "@/components/ui/Card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminAuditPage() {
  const entries = await listAuditLogs({ limit: 100 });
  const actorIds = [...new Set(entries.map((e) => e.actorId))];
  const actorMap = new Map<string, string>();
  await Promise.all(
    actorIds.map(async (id) => {
      const u = await getUserById(id);
      actorMap.set(id, u?.name ?? id.slice(0, 8));
    })
  );

  return (
    <div className="">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Audit Log
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Read-only. Latest admin actions.
      </p>

      {entries.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No audit entries yet.</p>
      ) : (
        <Card className="mt-8">
          <CardContent>
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Time</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Actor</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Action</th>
                <th className="text-left py-2 font-medium text-gray-700">Target</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 text-gray-500">{formatDate(e.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/profile/${e.actorId}`}
                      className="text-gray-800 hover:underline"
                    >
                      {actorMap.get(e.actorId) ?? e.actorId.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-800">{e.action}</td>
                  <td className="py-3 text-gray-600">
                    {e.targetType}: {e.targetId ?? "—"}
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
