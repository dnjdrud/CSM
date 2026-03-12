import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";

export const dynamic = "force-dynamic";

export default async function MeetingStartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const steps = [
    { href: `/cells/${id}/meeting/life`,   label: "삶 나눔",      icon: "💭", desc: "한 주 동안의 이야기를 나눠요" },
    { href: `/cells/${id}/meeting/sermon`, label: "설교 나눔",    icon: "📖", desc: "말씀을 함께 묵상해요" },
    { href: `/cells/${id}/meeting/prayer`, label: "기도제목 나눔", icon: "🙏", desc: "서로의 기도제목을 나눠요" },
    { href: `/cells/${id}/meeting/pray`,   label: "함께 기도",    icon: "✝️", desc: "모아진 기도제목으로 함께 기도해요" },
    { href: `/cells/${id}/meeting/summary`,label: "모임 요약",    icon: "📝", desc: "오늘 모임을 정리해요" },
  ];

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href={`/cells/${id}/meetings`} className="text-[12px] text-theme-muted hover:text-theme-primary">← 모임 목록</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">모임 시작</h1>
          <p className="text-[13px] text-theme-muted mt-0.5">순서에 따라 함께 진행해요</p>
        </div>

        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-surface p-4 hover:border-theme-primary/50 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-primary/10 text-sm font-bold text-theme-primary shrink-0">
                  {i + 1}
                </span>
                <span className="text-xl shrink-0" aria-hidden>{step.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium text-theme-text text-[14px]">{step.label}</p>
                  <p className="text-[12px] text-theme-muted">{step.desc}</p>
                </div>
                <span className="ml-auto text-theme-muted">›</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </TimelineContainer>
  );
}
