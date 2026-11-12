// Content type definitions. Types only -- no content -- so they are safe to share.

/** Every piece of authored text carries a review status. Drafts need the son's final review. */
export type ReviewStatus = "needs_review" | "approved";

/** Text may contain {parent} which is resolved on the server per role ("어머니는" / "아버지는"). */
export type PreludeStep =
  | { kind: "text"; id: string; paragraphs: string[]; nextLabel: string }
  | { kind: "letter"; id: string; letterKey: string; nextLabel: string }
  | {
      kind: "choice";
      id: string;
      paragraphs: string[];
      options: { label: string; action: "continue" | "rooms" | "write" }[];
    };

/** A titled part of a card (e.g. 지금 하고 있는 일 / 확인된 변화 / 다음 계획). null = 준비 중. */
export type CardSection = { heading: string; paragraphs: string[] | null };

export type CardDef = {
  id: string;
  title: string;
  /** Body paragraphs; null = "준비 중". Never sent to the client before the gate. */
  body: string[] | null;
  sections?: CardSection[];
  /** Drafts (needs_review) are never shown to parents; only the admin preview shows them. */
  status: ReviewStatus;
  /** Notes for the son's review. Admin preview only, never sent to parents. */
  reviewNote?: string;
};

export type LetterDef = {
  title: string;
  paragraphs: string[] | null;
  status: ReviewStatus;
  reviewNote?: string;
};

export type RoomDef = {
  id: number;
  title: string;
  summary: string;
  /** Room 1 is the only exception (false). */
  requiresRecording: boolean;
  /** Preparation screens shown before the final recording step (allowed before the gate). */
  prelude: PreludeStep[];
  /** Sentence the parent says out loud in the final recording step. null for room 1. */
  entryPhrase: string | null;
  /** Gated body cards. */
  cards: CardDef[];
  /** Question + choices after the cards (gated, part of the body). */
  actions?: BodyActions;
  /** Room 7 only. */
  conversation?: ConversationView;
};

/** What a client component may receive about a room before the gate. No cards / body. */
export type RoomPreludeView = {
  id: number;
  title: string;
  requiresRecording: boolean;
  prelude: PreludeStep[];
  /** The sentence spoken in the final recording step (not room body). */
  entryPhrase: string | null;
  letters: Record<string, { title: string; paragraphs: string[] | null }>;
};

export type RoomListItem = {
  id: number;
  title: string;
  summary: string;
  requiresRecording: boolean;
};

/** Room body, returned only by the enter API after the gate (or rendered for room 1). */
export type RoomBodyView = {
  id: number;
  title: string;
  cards: { id: string; title: string; body: string[] | null; sections: CardSection[] | null }[];
  actions: BodyActions | null;
  conversation: ConversationView | null;
};

/**
 * Choices shown at the end of a room body (after the gate).
 *  - write: opens the writing screen (나만 간직하기 / 아들에게 전하기) with a suggested title.
 *  - dismiss: closes the question without recording anything (읽기만 할게요 / 나중에 / 더 생각하기).
 */
export type BodyAction =
  | { kind: "write"; label: string; heading: string; title: string }
  | { kind: "dismiss"; label: string; message: string };

export type BodyActions = { question: string; options: BodyAction[]; titleOptions: string[] };

/** Room 7: conversation principles + ways to start a conversation. */
export type ConversationMethod = "write" | "call" | "meet" | "with_someone" | "more_time";
export type ConversationView = {
  intro: string[];
  principles: string[];
  methods: { method: ConversationMethod; label: string; description: string }[];
  titleOptions: string[];
};
