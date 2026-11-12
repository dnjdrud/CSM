import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Actions, Paragraphs, Title } from "@/components/ui";
import { publishedIntroLetter } from "@/content/rooms";
import { requireParent } from "@/server/session";

export default async function WelcomeLetterPage() {
  await requireParent();
  // Only published text (admin 편지·카드 관리) is ever shown to parents.
  const letter = publishedIntroLetter();
  return (
    <AppShell backHref="/welcome" roomsLink logout>
      <p className="mb-2 text-muted">처음 안내 2 / 3</p>
      <Title>{letter.title}</Title>
      <article className="panel">
        {letter.paragraphs ? (
          <Paragraphs items={letter.paragraphs} />
        ) : (
          <p>아들이 편지를 다듬고 있어요. 준비되면 이곳에서 읽으실 수 있어요.</p>
        )}
      </article>
      <Actions>
        <Link href="/welcome/guide" className="btn btn-primary">
          다음
        </Link>
      </Actions>
    </AppShell>
  );
}
