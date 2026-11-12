import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Actions, Paragraphs, Title } from "@/components/ui";
import { INTRO } from "@/content/intro";
import { requireParent } from "@/server/session";

export default async function WelcomeIntroPage() {
  await requireParent();
  return (
    <AppShell roomsLink logout>
      <p className="mb-2 text-muted">처음 안내 1 / 3</p>
      <Title>{INTRO.title}</Title>
      <Paragraphs items={INTRO.paragraphs} />
      <Actions>
        <Link href="/welcome/letter" className="btn btn-primary">
          다음
        </Link>
      </Actions>
    </AppShell>
  );
}
