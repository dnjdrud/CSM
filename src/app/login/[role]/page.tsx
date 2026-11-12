import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PasscodeForm } from "@/components/PasscodeForm";
import { Notice, Title } from "@/components/ui";
import { PARENT_LABEL, isParentRole } from "@/lib/roles";
import { isParentConfigured } from "@/server/config";
import { getSession } from "@/server/session";

export default async function LoginPasswordPage({ params }: PageProps<"/login/[role]">) {
  const { role } = await params;
  if (!isParentRole(role)) notFound();

  const s = await getSession();
  if (s) redirect(s.role === "son" ? "/admin" : "/rooms");

  const label = PARENT_LABEL[role];
  const configured = isParentConfigured(role);

  return (
    <AppShell backHref="/login">
      <Title>{label} 비밀번호</Title>
      {configured ? (
        <PasscodeForm role={role} />
      ) : (
        <>
          <Notice title="아직 설정이 필요해요">
            {label} 비밀번호가 아직 준비되지 않았어요. 아들에게 알려주시면 설정해 드릴게요.
          </Notice>
          <div className="mt-8">
            <Link href="/login" className="btn btn-primary">
              처음으로 돌아가기
            </Link>
          </div>
        </>
      )}
    </AppShell>
  );
}
