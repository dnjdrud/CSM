import type { UserRole } from "@/lib/domain/types";

export type ProfileTab = "activity" | "notes" | "about";

/** Default tab when ?tab= is not provided. Role-aware homepage emphasis. */
export const ROLE_PROFILE_CONFIG: Record<UserRole, ProfileTab> = {
  LAY: "notes",
  MINISTRY_WORKER: "about",
  PASTOR: "about",
  MISSIONARY: "notes",
  SEMINARIAN: "notes",
  ADMIN: "activity",
};

/** Intro copy for the Notes tab, by role. Fallback for missing roles. */
export const NOTES_INTRO_BY_ROLE: Partial<Record<UserRole, string>> = {
  MISSIONARY: "Prayer notes and reflections shared from the field.",
  SEMINARIAN: "Notes from study, questions, and reflection.",
  LAY: "Shared prayers and reflections.",
};

const NOTES_INTRO_FALLBACK = "Shared notes and reflections.";

export function getNotesIntroForRole(role: UserRole): string {
  return NOTES_INTRO_BY_ROLE[role] ?? NOTES_INTRO_FALLBACK;
}

/** About section role description copy. */
export const ABOUT_ROLE_COPY: Record<UserRole, string> = {
  MINISTRY_WORKER: "Serving within a local church or ministry.",
  PASTOR: "Entrusted with pastoral care and teaching.",
  MISSIONARY: "Serving across cultures and communities.",
  SEMINARIAN: "Learning, studying, and asking good questions.",
  LAY: "The steady center of the community.",
  ADMIN: "Community administrator.",
};

export function getAboutRoleCopy(role: UserRole): string | undefined {
  return ABOUT_ROLE_COPY[role];
}

/** Profile section id for section-based layout. */
export type ProfileSectionId = "notes" | "testimonies" | "posts" | "about";

/** Section order by role. Testimonies section is omitted when hasTestimonies is false (for LAY, SEMINARIAN, PASTOR). */
export function getProfileSectionOrder(
  role: UserRole,
  hasTestimonies: boolean
): ProfileSectionId[] {
  const base: Record<UserRole, ProfileSectionId[]> = {
    MISSIONARY: ["notes", "testimonies", "posts", "about"],
    LAY: ["notes", "posts", "about"],
    SEMINARIAN: ["notes", "posts", "about"],
    PASTOR: ["posts", "notes", "about"],
    MINISTRY_WORKER: ["posts", "notes", "about"],
    ADMIN: ["posts", "notes", "about"],
  };
  let order = base[role];
  if (hasTestimonies && role !== "MISSIONARY" && (role === "LAY" || role === "SEMINARIAN" || role === "PASTOR")) {
    const idx = order.indexOf("notes");
    if (role === "PASTOR") {
      order = ["posts", "testimonies", "notes", "about"];
    } else {
      order = ["notes", "testimonies", "posts", "about"];
    }
  }
  return order;
}
