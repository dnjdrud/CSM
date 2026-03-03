import { getSystemLogs } from "@/lib/data/systemLogsRepository";
import { SystemLogsTable } from "./SystemLogsTable";
import { Suspense } from "react";

export default async function AdminSystemLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const params = await searchParams;
  const logs = await getSystemLogs({
    limit: 100,
    level: params.level ?? undefined,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        System Logs
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Last 100 entries. Click a row to expand metadata.
      </p>
      <Suspense fallback={<p className="text-sm text-gray-500 mt-4">Loading…</p>}>
        <SystemLogsTable logs={logs} />
      </Suspense>
    </div>
  );
}
