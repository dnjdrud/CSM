import { AppShell } from "@/components/AppShell";
import { Actions, Title } from "@/components/ui";
import { GUIDE } from "@/content/intro";
import { requireParent } from "@/server/session";

export default async function WelcomeGuidePage() {
  await requireParent();
  return (
    <AppShell backHref="/welcome/letter" roomsLink logout>
      <p className="mb-2 text-muted">처음 안내 3 / 3</p>
      <Title>{GUIDE.title}</Title>
      <ol className="grid list-decimal gap-4 pl-7">
        {GUIDE.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
      <Actions>
        <form action="/api/intro/complete" method="post">
          <button type="submit" className="btn btn-primary">
            방 목록 보기
          </button>
        </form>
      </Actions>
    </AppShell>
  );
}
