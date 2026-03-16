import Link from "next/link";
import { Section, SectionHeader, SectionBody } from "@/components/ui/Section";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  isFirst?: boolean;
  children: React.ReactNode;
};

export function ProfileSection({
  id,
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = "See all",
  isFirst = false,
  children,
}: Props) {
  const actionSlot = seeAllHref ? (
    <Link
      href={seeAllHref}
      className="text-[13px] font-medium text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded shrink-0 transition-colors"
    >
      {seeAllLabel}
    </Link>
  ) : undefined;

  return (
    <Section aria-labelledby={`section-${id}`} className={isFirst ? "pt-0" : ""}>
      <SectionHeader
        id={`section-${id}`}
        title={title}
        subtitle={subtitle}
        actionSlot={actionSlot}
      />
      <SectionBody>{children}</SectionBody>
    </Section>
  );
}
