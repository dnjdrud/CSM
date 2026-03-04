import { TimelineContainer } from "@/components/TimelineContainer";

export default function CellHomePage() {
  return (
    <TimelineContainer>
      <section className="px-4 py-8 space-y-4">
        <h1 className="text-xl font-semibold text-theme-text">Cell &amp; Messenger</h1>
        <p className="text-sm text-theme-muted leading-relaxed">
          This area will become the home for{" "}
          <strong className="font-semibold">Private Cell</strong> (1:1 and small-group prayer
          conversations) and{" "}
          <strong className="font-semibold">Open Cell</strong> (interest-based open prayer and
          fellowship rooms). For now, use the community feed and your profile to share prayer
          requests and testimonies.
        </p>
      </section>
    </TimelineContainer>
  );
}

