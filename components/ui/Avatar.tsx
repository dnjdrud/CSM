import Image from "next/image";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

type Size = "sm" | "md";

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
  ...props
}: React.ComponentProps<"div"> & { name: string; src?: string | null; size?: Size }) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const base = `shrink-0 rounded-full ${sizeClass} ${className}`;

  if (src) {
    return (
      <div className={`${base} overflow-hidden`} aria-hidden {...props}>
        <Image
          src={src}
          alt={name}
          width={size === "sm" ? 32 : 40}
          height={size === "sm" ? 32 : 40}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gray-200 text-gray-600 font-medium ${base}`}
      aria-hidden
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}
