// Shared, non-secret role definitions. Safe for client and server.

export const PARENT_ROLES = ["mother", "father"] as const;
export type ParentRole = (typeof PARENT_ROLES)[number];
export type Role = ParentRole | "son";

export function isParentRole(value: unknown): value is ParentRole {
  return value === "mother" || value === "father";
}

export const PARENT_LABEL: Record<ParentRole, string> = {
  mother: "엄마",
  father: "아빠",
};
