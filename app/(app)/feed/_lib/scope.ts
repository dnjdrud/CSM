/** Normalize searchParams.scope to feed scope. */
export function scopeFromSearchParams(params: { scope?: string }): "ALL" | "FOLLOWING" {
  return params.scope === "following" ? "FOLLOWING" : "ALL";
}
