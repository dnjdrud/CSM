import type { ReactNode } from "react";

export function Title({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h1 id={id} className="mb-6 text-title font-bold">
      {children}
    </h1>
  );
}

export function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="prose-warm">
      {items.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** Bottom action area: pushes the single main action to the lower part of the screen. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-auto grid gap-3 pt-10">{children}</div>;
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "error";
  title?: string;
  children: ReactNode;
}) {
  const cls = tone === "error" ? "bg-error-bg text-error" : "bg-surface text-text";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl p-5 ${cls}`}>
      {title && <p className="mb-2 font-bold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
