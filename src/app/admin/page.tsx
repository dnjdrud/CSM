import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Notice, Title } from "@/components/ui";
import { listEditableContent } from "@/content/rooms";
import { isParentConfigured } from "@/server/config";
import { listSharedForSon } from "@/server/entries";
import { listProposalsForSon } from "@/server/proposals";
import { requireAdmin } from "@/server/session";

export default async function AdminHomePage() {
  await requireAdmin();
  const content = listEditableContent();
  const published = content.filter((c) => c.published).length;
  const letters = listSharedForSon().length;
  const waiting = listProposalsForSon().filter((p) => p.status === "proposed").length;

  return (
    <AppShell logout>
      <Title>관리자 화면</Title>

      <section className="panel mb-6" aria-labelledby="acc">
        <h2 id="acc" className="mb-3 text-2xl font-bold">
          계정 설정 상태
        </h2>
        <ul className="grid gap-2">
          <li>아빠 비밀번호: {isParentConfigured("father") ? "설정됨" : "설정 필요"}</li>
          <li>엄마 비밀번호: {isParentConfigured("mother") ? "설정됨" : "설정 필요 (MOTHER_PASSWORD, 4자리)"}</li>
        </ul>
      </section>

      <div className="mb-6 grid gap-3">
        {/* Counts only; no bodies and no read/visit tracking. */}
        <Link href="/admin/letters" className="btn btn-primary">
          부모님이 전한 글 ({letters})
        </Link>
        <Link href="/admin/proposals" className="btn btn-secondary">
          대화 제안 (답을 기다리는 제안 {waiting})
        </Link>
        <Link href="/admin/content" className="btn btn-secondary">
          편지·카드 관리 ({content.length}개 중 {published}개 게시)
        </Link>
      </div>

      <Notice>
        부모님이 ‘나만 간직하기’로 저장한 글과 초안은 부모님의 개인 비밀번호로 잠겨 있어 관리자 화면에 나오지 않고, 서버에도 암호문만
        저장돼요. 입장 녹음, 방문 기록, 읽음 여부, 머문 시간은 저장하지 않아요.
      </Notice>
    </AppShell>
  );
}
