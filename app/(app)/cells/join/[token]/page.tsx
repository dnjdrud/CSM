/**
 * /cells/join/[token] – mirrors /cell/join/[token]
 * Validates the invite token, joins the cell, then redirects to /cells/[id].
 */
import { redirect } from "next/navigation";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function acceptInvite(token: string, userId: string): Promise<{ cellId: string } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "서버 오류" };

  const { data: invite } = await admin
    .from("cell_invites")
    .select("id, cell_id, used_by, expires_at")
    .eq("token", token)
    .single();

  if (!invite) return { error: "유효하지 않은 초대 링크입니다." };
  if (invite.used_by) return { error: "이미 사용된 초대 링크입니다." };
  if (new Date(invite.expires_at) < new Date()) return { error: "만료된 초대 링크입니다." };

  await admin
    .from("cell_memberships")
    .upsert(
      { cell_id: invite.cell_id, user_id: userId, role: "MEMBER" },
      { onConflict: "cell_id,user_id", ignoreDuplicates: true }
    );

  await admin.from("cell_invites").update({ used_by: userId }).eq("id", invite.id);

  return { cellId: invite.cell_id };
}

export default async function CellsJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/cells/join/${encodeURIComponent(token)}`);
  }

  const result = await acceptInvite(token, user.id);

  if ("cellId" in result) {
    redirect(`/cells/${result.cellId}`);
  }

  return (
    <TimelineContainer>
      <div className="px-4 py-16 text-center space-y-3">
        <p className="text-2xl">⚠️</p>
        <p className="font-semibold text-theme-text">{result.error}</p>
        <a href="/cells" className="text-sm text-theme-primary underline">
          셀 목록으로 돌아가기
        </a>
      </div>
    </TimelineContainer>
  );
}
