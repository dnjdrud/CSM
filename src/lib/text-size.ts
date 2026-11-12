export const TEXT_SIZE_COOKIE = "fh_text";
export const TEXT_SIZES = ["md", "lg", "xl"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const TEXT_SIZE_LABEL: Record<TextSize, string> = { md: "보통", lg: "크게", xl: "아주 크게" };

export function parseTextSize(v: string | undefined): TextSize {
  return (TEXT_SIZES as readonly string[]).includes(v ?? "") ? (v as TextSize) : "md";
}

export function nextTextSize(v: TextSize): TextSize {
  return TEXT_SIZES[(TEXT_SIZES.indexOf(v) + 1) % TEXT_SIZES.length];
}
