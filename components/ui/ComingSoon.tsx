import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  icon?: string;
};

export function ComingSoon({
  title,
  description = "이 기능은 곧 출시될 예정입니다.",
  backHref,
  backLabel = "돌아가기",
  icon = "🚧",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <span className="text-5xl mb-4" aria-hidden>{icon}</span>
      <h2 className="text-lg font-semibold text-theme-text mb-2">{title}</h2>
      <p className="text-[14px] text-theme-muted max-w-xs leading-relaxed mb-6">{description}</p>
      {backHref && (
        <Link
          href={backHref}
          className="rounded-lg border border-theme-border px-4 py-2 text-[13px] text-theme-primary hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}
