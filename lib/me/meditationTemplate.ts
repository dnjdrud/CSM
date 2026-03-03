/**
 * Structured content for meditation notes. Stored as markdown in notes.content.
 */

export const MEDITATION_SECTIONS = ["Scripture", "Observation", "Reflection", "Prayer"] as const;
export type MeditationSection = (typeof MEDITATION_SECTIONS)[number];

export interface MeditationFields {
  scripture: string;
  observation: string;
  reflection: string;
  prayer: string;
}

const SECTION_HEADING = (name: string) => `## ${name}`;

export function buildMeditationContent(fields: MeditationFields): string {
  const parts: string[] = [];
  if (fields.scripture.trim()) {
    parts.push(SECTION_HEADING("Scripture"), "", fields.scripture.trim(), "");
  }
  parts.push(SECTION_HEADING("Observation"), "", fields.observation.trim(), "");
  parts.push(SECTION_HEADING("Reflection"), "", fields.reflection.trim(), "");
  parts.push(SECTION_HEADING("Prayer"), "", fields.prayer.trim(), "");
  return parts.join("\n").trim();
}

export function parseMeditationContent(content: string): MeditationFields {
  const sections: Record<string, string> = {};
  const regex = /^##\s+(.+)$/gm;
  let lastIndex = 0;
  let lastHeading = "";

  let match = regex.exec(content);
  while (match) {
    if (lastHeading) {
      const body = content.slice(lastIndex, match.index).replace(/^\n+|\n+$/g, "").trim();
      sections[lastHeading] = body;
    }
    lastHeading = match[1].trim();
    lastIndex = regex.lastIndex;
    match = regex.exec(content);
  }
  if (lastHeading) {
    const body = content.slice(lastIndex).replace(/^\n+|\n+$/g, "").trim();
    sections[lastHeading] = body;
  }

  return {
    scripture: sections["Scripture"] ?? "",
    observation: sections["Observation"] ?? "",
    reflection: sections["Reflection"] ?? "",
    prayer: sections["Prayer"] ?? "",
  };
}

/** Returns section title and body pairs in order for display. */
export function getMeditationSections(content: string): { title: string; body: string }[] {
  const fields = parseMeditationContent(content);
  const out: { title: string; body: string }[] = [];
  if (fields.scripture) out.push({ title: "Scripture", body: fields.scripture });
  out.push({ title: "Observation", body: fields.observation });
  out.push({ title: "Reflection", body: fields.reflection });
  out.push({ title: "Prayer", body: fields.prayer });
  return out.filter((s) => s.body.trim().length > 0);
}
