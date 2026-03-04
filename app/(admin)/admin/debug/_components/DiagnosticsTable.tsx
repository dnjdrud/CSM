"use client";

import type { DiagnosticsResult } from "../actions";

export function DiagnosticsTable({ result }: { result: DiagnosticsResult }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-theme-border bg-theme-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-theme-border bg-theme-surface-2">
            <th className="px-4 py-2 text-left font-medium text-theme-muted">Check</th>
            <th className="px-4 py-2 text-left font-medium text-theme-muted">Result</th>
          </tr>
        </thead>
        <tbody className="text-theme-text">
          <tr className="border-b border-theme-border/60">
            <td className="px-4 py-2 font-medium text-theme-muted">auth.getUser()</td>
            <td className="px-4 py-2 font-mono">
              {result.auth.error ? (
                <span className="text-red-600">{result.auth.error}</span>
              ) : result.auth.userId ? (
                <>userId={result.auth.userId}, email={result.auth.email ?? "null"}</>
              ) : (
                "null"
              )}
            </td>
          </tr>
          <tr className="border-b border-theme-border/60">
            <td className="px-4 py-2 font-medium text-theme-muted">profile (users.role)</td>
            <td className="px-4 py-2 font-mono">
              {result.profile.error ? (
                <span className="text-red-600">{result.profile.error}</span>
              ) : result.profile.role ? (
                <>profileId={result.profile.profileId}, role={result.profile.role}</>
              ) : (
                "null"
              )}
            </td>
          </tr>
          <tr className="border-b border-theme-border/60">
            <td className="px-4 py-2 font-medium text-theme-muted">posts count</td>
            <td className="px-4 py-2 font-mono">
              {result.postsCountError ? (
                <span className="text-red-600">{result.postsCountError}</span>
              ) : result.postsCount !== null ? (
                String(result.postsCount)
              ) : (
                "—"
              )}
            </td>
          </tr>
          <tr className="border-b border-theme-border/60">
            <td className="px-4 py-2 font-medium text-theme-muted">latest 5 posts</td>
            <td className="px-4 py-2 font-mono">
              {result.latestPostsError ? (
                <span className="text-red-600">{result.latestPostsError}</span>
              ) : result.latestPosts.length > 0 ? (
                <ul className="list-inside list-disc space-y-0.5">
                  {result.latestPosts.map((p) => (
                    <li key={p.id}>
                      {p.id} ({p.created_at.slice(0, 19)})
                    </li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-theme-muted">invite insert test</td>
            <td className="px-4 py-2 font-mono">
              {result.inviteTest.ok ? (
                <span className="text-green-600">OK (insert + delete)</span>
              ) : result.inviteTest.error ? (
                <span className="text-red-600">{result.inviteTest.error}</span>
              ) : (
                "—"
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
