import { requireAdmin } from "@/lib/admin/guard";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { runDiagnostics } from "./actions";
import { DiagnosticsTable } from "./_components/DiagnosticsTable";

export const dynamic = "force-dynamic";

export default async function AdminDebugPage() {
  await requireAdmin();

  const session = await getSession();
  const supabase = await supabaseServer();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let usersRow: { id: string; role: string; name: string | null } | null = null;
  const usersResult = await supabase.from("users").select("id, role, name").eq("id", authUser?.id ?? "").single();
  if (usersResult.data) usersRow = usersResult.data as { id: string; role: string; name: string | null };

  let isAdminRpc: boolean | string = "N/A";
  try {
    const rpc = await supabase.rpc("is_admin");
    if (typeof rpc.data === "boolean") isAdminRpc = rpc.data;
    else if (rpc.error) isAdminRpc = `Error: ${rpc.error.message}`;
  } catch {
    isAdminRpc = "RPC not available";
  }

  let inviteCount: number | string = "—";
  const { count: inviteCountVal } = await supabase.from("invite_codes").select("id", { count: "exact", head: true });
  if (inviteCountVal != null) inviteCount = inviteCountVal;

  const diagnostics = await runDiagnostics();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-theme-text">Session &amp; profile debug</h1>
      <p className="mt-1 text-sm text-theme-muted">Admin-only. Use this to verify auth and profile resolution.</p>

      <dl className="mt-6 space-y-4 rounded-xl border border-theme-border bg-theme-surface p-4 text-sm">
        <div>
          <dt className="font-medium text-theme-muted">Auth user id (auth.getUser)</dt>
          <dd className="mt-0.5 font-mono text-theme-text">{authUser?.id ?? "null"}</dd>
        </div>
        <div>
          <dt className="font-medium text-theme-muted">Auth user email</dt>
          <dd className="mt-0.5 font-mono text-theme-text">{authUser?.email ?? "null"}</dd>
        </div>
        <div>
          <dt className="font-medium text-theme-muted">getSession()</dt>
          <dd className="mt-0.5 font-mono text-theme-text">
            {session ? `userId=${session.userId}, role=${session.role}` : "null"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-theme-muted">public.users row (id, role, name)</dt>
          <dd className="mt-0.5 font-mono text-theme-text">
            {usersRow
              ? `id=${usersRow.id}, role=${usersRow.role}, name=${usersRow.name ?? "null"}`
              : usersResult.error?.message ?? "no row"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-theme-muted">public.is_admin()</dt>
          <dd className="mt-0.5 font-mono text-theme-text">{String(isAdminRpc)}</dd>
        </div>
        <div>
          <dt className="font-medium text-theme-muted">invite_codes count</dt>
          <dd className="mt-0.5 font-mono text-theme-text">{inviteCount}</dd>
        </div>
      </dl>

      <h2 className="mt-8 text-lg font-semibold text-theme-text">Diagnostics (runDiagnostics)</h2>
      <DiagnosticsTable result={diagnostics} />
    </div>
  );
}
