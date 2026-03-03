"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SystemLogRow } from "@/lib/data/systemLogsRepository";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function SystemLogsTable({ logs }: { logs: SystemLogRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = searchParams.get("level") ?? "";

  function setLevelFilter(newLevel: string) {
    const p = new URLSearchParams(searchParams);
    if (newLevel) p.set("level", newLevel);
    else p.delete("level");
    router.push(`/admin/system-logs?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Filter by level:</span>
        <select
          value={level}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
        >
          <option value="">All</option>
          <option value="ERROR">ERROR</option>
          <option value="WARN">WARN</option>
          <option value="INFO">INFO</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2 px-3 font-medium text-gray-700">Level</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Source</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Message</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <>
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                >
                  <td className="py-2 px-3">
                    <span
                      className={
                        row.level === "ERROR"
                          ? "text-red-600"
                          : row.level === "WARN"
                            ? "text-amber-600"
                            : "text-gray-700"
                      }
                    >
                      {row.level}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-700">{row.source}</td>
                  <td className="py-2 px-3 text-gray-800 max-w-md truncate" title={row.message}>
                    {row.message}
                  </td>
                  <td className="py-2 px-3 text-gray-500">{formatDate(row.created_at)}</td>
                </tr>
                {expandedId === row.id && (
                  <tr key={`${row.id}-meta`} className="border-b border-gray-100 bg-gray-50">
                    <td colSpan={4} className="py-2 px-3">
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                        {JSON.stringify(row.metadata ?? {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length === 0 && (
        <p className="text-sm text-gray-500 py-6">No logs match the filter.</p>
      )}
    </div>
  );
}
