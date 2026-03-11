import type { ReactNode } from "react";

/** Renders text with @word tokens highlighted. */
export function MentionText({ text }: { text: string }): ReactNode {
  const parts = text.split(/(@\S+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^@\S+/.test(part) ? (
          <span key={i} className="text-blue-600 font-medium">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
