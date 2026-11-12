import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Title } from "@/components/ui";
import { getSession } from "@/server/session";

export default async function LoginChoosePage() {
  const s = await getSession();
  if (s) redirect(s.role === "son" ? "/admin" : "/rooms");

  return (
    <AppShell>
      <Title>누구신가요?</Title>
      <p className="mb-8">본인을 골라 눌러주세요.</p>
      <div className="grid gap-4">
        <Link href="/login/mother" className="btn btn-primary min-h-20 text-2xl">
          엄마
        </Link>
        <Link href="/login/father" className="btn btn-primary min-h-20 text-2xl">
          아빠
        </Link>
      </div>
    </AppShell>
  );
}
