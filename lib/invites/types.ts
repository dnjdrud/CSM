/**
 * Invite template keys and variant types.
 */

export type InviteTemplateKey =
  | "general"
  | "church_group"
  | "mission_team"
  | "pastoral_circle"
  | "seminary_cohort";

export type InviteTemplateVariant = "dm" | "email";

export type InviteTemplate = {
  key: InviteTemplateKey;
  label: string;
  dm: string;
  email: string;
};
