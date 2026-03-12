import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "신학 – Cellah" };

export default function TheologyPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <h1 className="text-xl font-semibold text-theme-text">신학</h1>
      </div>
      <ComingSoon
        title="신학 Q&A"
        description="신앙과 신학에 관한 질문을 나누고 목사님, 신학자들의 답변을 들어보세요."
        icon="✝️"
      />
    </TimelineContainer>
  );
}
