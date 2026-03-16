"use client";

type FlashBannerProps = {
  title: string;
  body: string;
  optional?: string;
};

/** Subtle informational banner. No red/error styling. */
export function FlashBanner({ title, body, optional }: FlashBannerProps) {
  return (
    <div
      role="status"
      className="border border-theme-border bg-theme-surface-2 text-theme-text rounded-xl px-4 py-3"
      aria-live="polite"
    >
      <p className="font-medium text-[15px]">{title}</p>
      <p className="mt-1 text-[14px] text-theme-text-2">{body}</p>
      {optional && <p className="mt-2 text-[13px] text-theme-muted">{optional}</p>}
    </div>
  );
}
