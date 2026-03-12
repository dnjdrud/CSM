import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "질문하기 – Cellah" };

export default function TheologyAskPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/theology" className="text-[12px] text-theme-muted hover:text-theme-primary">← 신학</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">질문하기</h1>
      </div>
      <ComingSoon
        title="신학 질문하기"
        description="신앙과 신학에 관한 궁금증을 자유롭게 질문하세요."
        backHref="/theology"
        backLabel="신학으로"
        icon="🤔"
      />
    </TimelineContainer>
  );
}
