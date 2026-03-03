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
  size = "md",
  className = "",
  ...props
}: React.ComponentProps<"div"> & { name: string; size?: Size }) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium ${sizeClass} ${className}`}
      aria-hidden
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}
