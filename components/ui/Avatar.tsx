/**
 * Design system: Avatar
 * Image or initials; sizes sm | md. Focus ring when wrapped in interactive element.
 */
import Image from "next/image";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

type Size = "sm" | "md";

const sizeMap = {
  sm: { class: "h-8 w-8 text-xs", px: 32 },
  md: { class: "h-10 w-10 text-sm", px: 40 },
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
  ...props
}: React.ComponentProps<"div"> & { name: string; src?: string | null; size?: Size }) {
  const { class: sizeClass, px } = sizeMap[size];
  const base =
    "shrink-0 rounded-full overflow-hidden " +
    "focus-within:ring-2 focus-within:ring-theme-primary focus-within:ring-offset-2 " +
    `transition-shadow duration-150 ${sizeClass} ${className}`;

  if (src) {
    return (
      <div className={base} aria-hidden {...props}>
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-theme-surface-2 text-theme-muted font-medium ${base}`}
      aria-hidden
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}
