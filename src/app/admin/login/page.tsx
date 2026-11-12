import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AppShell } from "@/components/AppShell";
import { Notice, Title } from "@/components/ui";
import { isAdminConfigured } from "@/server/config";
import { getSession } from "@/server/session";

export default async function AdminLoginPage() {
  const s = await getSession();
  if (s?.role === "son") redirect("/admin");

  return (
    <AppShell>
      <Title>관리자</Title>
      {s && (
        <div className="mb-6">
          <Notice>지금은 부모님 계정으로 들어와 있어요. 관리자로 로그인하면 그 로그인은 끝나요.</Notice>
        </div>
      )}
      {isAdminConfigured() ? (
        <AdminLoginForm />
      ) : (
        <Notice tone="error" title="설정 필요">
          서버 환경변수 ADMIN_PASSWORD(10자 이상)와 SESSION_SECRET(32자 이상)을 설정한 뒤 서버를 다시 시작하세요.
        </Notice>
      )}
    </AppShell>
  );
}
