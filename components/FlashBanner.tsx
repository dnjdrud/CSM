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
      className="border border-gray-200 bg-gray-50 text-gray-800 rounded-lg px-4 py-3"
      aria-live="polite"
    >
      <p className="font-medium text-[15px]">{title}</p>
      <p className="mt-1 text-[14px] text-gray-600">{body}</p>
      {optional && <p className="mt-2 text-[13px] text-gray-500">{optional}</p>}
    </div>
  );
}
