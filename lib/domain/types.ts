/**
 * Domain types for SNS-scale expansion.
 * Canonical contracts; can add runtime validation (e.g. zod) later.
 */

export type UserRole = "LAY" | "MINISTRY_WORKER" | "PASTOR" | "MISSIONARY" | "SEMINARIAN" | "ADMIN";

export type Visibility = "PUBLIC" | "MEMBERS" | "FOLLOWERS" | "PRIVATE";

export type PostCategory = "PRAYER" | "DEVOTIONAL" | "MINISTRY" | "TESTIMONY";

export type ReactionType = "PRAYED" | "WITH_YOU";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  bio?: string;
  affiliation?: string;
  church?: string | null;
  username?: string | null;
  createdAt: string; // ISO
  /** Set when user deactivates account; reversible within 7 days. */
  deactivatedAt?: string | null; // ISO
  denomination?: string | null;
  faithYears?: number | null;
  /** 외부 후원 링크 (토스, 카카오페이, 계좌번호 안내 등). */
  supportUrl?: string | null;
  /** Supabase Storage public URL for profile photo. */
  avatarUrl?: string | null;
}

export interface Post {
  id: string;
  authorId: string;
  category: PostCategory;
  content: string;
  visibility: Visibility;
  /** Lowercase normalized in storage; max 5 per post. */
  tags: string[];
  createdAt: string;
  /** Optional reflection prompt for devotional */
  reflectionPrompt?: string;
  /** True for the single Daily Prayer thread for that day (admin-created). */
  isDailyPrayer?: boolean;
  /** Date (YYYY-MM-DD) for which this is the Daily Prayer thread; set when isDailyPrayer is true. */
  dailyPrayerDate?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  parentId?: string;
}

export interface Reaction {
  postId: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export type SupportPurpose = "ONGOING" | "PROJECT" | "URGENT";
export type SupportStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

/** Support intent stored in DB. */
export interface SupportIntent {
  id: string;
  ministryId: string;
  donorId: string | null;
  purpose: SupportPurpose;
  amountKrw: number;
  status: SupportStatus;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payment transaction linked to an intent. */
export interface SupportTransaction {
  id: string;
  intentId: string;
  provider: "TOSS";
  providerPaymentId: string | null;
  providerOrderId: string;
  amountKrw: number;
  status: string; // DONE | CANCELLED
  createdAt: string;
}

// ------------ Cell chat system ------------

export type CellType = "OPEN" | "PRIVATE";

export interface Cell {
  id: string;
  type: CellType;
  title: string;
  creatorId: string;
  topicTags: string[];
  createdAt: string;
  memberCount?: number;
}

export interface CellMembership {
  cellId: string;
  userId: string;
  role: "MEMBER" | "MODERATOR";
  createdAt: string;
}

export interface CellMessage {
  id: string;
  cellId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}


/** Legacy draft type (unused). */
export interface SupportDraft {
  id: string;
  ministryId: string;
  purpose: SupportPurpose;
  amountKrw: number;
}

/** Aggregated reaction counts per post (PRAYED / WITH_YOU). */
export type ReactionCounts = { prayed: number; withYou: number };

/** UI view: post with author, viewer reaction state, and optional counts. */
export interface PostWithAuthor extends Post {
  author: User;
  /** Current user's reactions only. */
  reactionsByCurrentUser: { prayed: boolean; withYou: boolean };
  /** Aggregated counts; omit or empty when not loaded. */
  reactionCounts?: ReactionCounts;
  /** Total comment count for the post. */
  commentCount?: number;
}

/** Ministry or worker that can receive support. No goals, no public amounts. */
export interface Ministry {
  id: string;
  name: string;
  description: string;
  location?: string;
  /** Bank account or transfer details for support (optional). */
  supportAccount?: string;
}

/** Display labels for roles (single source of truth). */
export const ROLE_DISPLAY: Record<UserRole, string> = {
  LAY: "Layperson",
  MINISTRY_WORKER: "Ministry Worker",
  PASTOR: "Pastor",
  MISSIONARY: "Missionary",
  SEMINARIAN: "Seminarian",
  ADMIN: "Admin",
};

/** Display labels for post categories. */
export const CATEGORY_LABELS: Record<PostCategory, string> = {
  PRAYER: "Prayer request",
  DEVOTIONAL: "Devotional",
  MINISTRY: "Ministry update",
  TESTIMONY: "Testimony",
};

/** Notification types for in-app list (no push/email in MVP). */
export type NotificationType =
  | "FOLLOWED_YOU"
  | "COMMENTED_ON_YOUR_POST"
  | "REACTED_TO_YOUR_POST"
  | "REPLIED_TO_YOUR_COMMENT"
  | "REACTED_TO_YOUR_COMMENT"
  | "MENTIONED_IN_COMMENT"
  | "NEW_MESSAGE";

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  actorId: string;
  postId?: string;
  createdAt: string; // ISO
  readAt?: string;   // ISO
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export interface ConversationPreview {
  partner: User;
  latestMessage: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
}

/** Moderation actions (mock storage; no backend). */
export type ModerationActionType =
  | "REPORT_POST"
  | "REPORT_COMMENT"
  | "BLOCK_USER"
  | "MUTE_USER";

export interface ModerationAction {
  id: string;
  type: ModerationActionType;
  actorId: string;
  targetUserId?: string;
  postId?: string;
  commentId?: string;
  reason?: string;
  createdAt: string; // ISO
}

/** Moderation report (DB: public.moderation_reports). */
export type ModerationReportType = "REPORT_POST" | "REPORT_COMMENT";

export type ModerationReportStatus = "OPEN" | "RESOLVED";

export interface ModerationReport {
  id: string;
  type: ModerationReportType;
  reporterId: string;
  targetUserId?: string;
  postId?: string;
  commentId?: string;
  reason?: string;
  status: ModerationReportStatus;
  createdAt: string; // ISO
  resolvedAt?: string; // ISO
  resolvedBy?: string;
}

/** Invite status computed from row. */
/** Signup request status (approval flow). */
export type SignupRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

/** Signup request row (no password; not an Auth user until completion). */
export interface SignupRequest {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  church: string | null;
  bio: string | null;
  affiliation: string | null;
  denomination: string | null;
  faithYears: number | null;
  status: SignupRequestStatus;
  createdAt: string; // ISO
  reviewedAt: string | null; // ISO
  reviewedBy: string | null;
  reviewNote: string | null;
}

/** One row from audit_logs (admin actions). */
export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string; // ISO
}

// =============================================================
// Prayer requests (community prayer board)
// =============================================================

export type PrayerCategory = "PERSONAL" | "FAMILY" | "CELL" | "CHURCH" | "MISSION" | "SOCIAL";

export const PRAYER_CATEGORY_LABELS: Record<PrayerCategory, string> = {
  PERSONAL: "개인",
  FAMILY: "가족",
  CELL: "셀",
  CHURCH: "교회",
  MISSION: "선교",
  SOCIAL: "사회",
};

export interface PrayerRequest {
  id: string;
  userId: string;
  content: string;
  category: PrayerCategory;
  visibility: "PUBLIC" | "CELL" | "PRIVATE";
  answeredAt?: string | null;
  answerNote?: string | null;
  createdAt: string;
  /** Joined author */
  author?: User;
  /** Count of intercessions */
  intercessorCount?: number;
  /** Whether the current viewer has prayed */
  hasPrayed?: boolean;
}

export interface PrayerIntercession {
  id: string;
  prayerRequestId: string;
  userId: string;
  message?: string | null;
  createdAt: string;
  author?: User;
}

// =============================================================
// Notification preferences
// =============================================================

export interface NotificationPrefs {
  pushComments: boolean;
  pushReactions: boolean;
  pushFollowers: boolean;
  pushCellMessages: boolean;
  pushPrayerResponses: boolean;
  emailWeeklyDigest: boolean;
  emailCellInvites: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  pushComments: true,
  pushReactions: true,
  pushFollowers: true,
  pushCellMessages: true,
  pushPrayerResponses: true,
  emailWeeklyDigest: false,
  emailCellInvites: true,
};

// =============================================================
// Missionary projects
// =============================================================

export type MissionaryProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface MissionaryProject {
  id: string;
  missionaryId: string;
  title: string;
  country?: string | null;
  field?: string | null;
  description?: string | null;
  status: MissionaryProjectStatus;
  createdAt: string;
  missionary?: User;
  supporterCount?: number;
  hasPrayerSupport?: boolean;
}

export interface MissionaryReport {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
}

export type SupportType = "PRAYER" | "FINANCIAL";

export interface MissionarySupporter {
  id: string;
  projectId: string;
  userId: string;
  supportType: SupportType;
  createdAt: string;
  user?: User;
}

// =============================================================
// Theology Q&A
// =============================================================

export type TheologyCategory =
  | "GENERAL"
  | "SALVATION"
  | "ESCHATOLOGY"
  | "ECCLESIOLOGY"
  | "ETHICS"
  | "BIBLE";

export const THEOLOGY_CATEGORY_LABELS: Record<TheologyCategory, string> = {
  GENERAL:      "일반",
  SALVATION:    "구원론",
  ESCHATOLOGY:  "종말론",
  ECCLESIOLOGY: "교회론",
  ETHICS:       "기독교 윤리",
  BIBLE:        "성경 해석",
};

export interface TheologyQuestion {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: TheologyCategory;
  createdAt: string;
  author?: User;
  answerCount?: number;
}

export interface TheologyAnswer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;
  author?: User;
  voteCount?: number;
  hasVoted?: boolean;
}

/** Private note types for My Space (not in feed/search). */
export type NoteType = "PRAYER" | "GRATITUDE" | "MEDITATION";

/** Prayer note status for overview (optional column on notes). */
export type PrayerNoteStatus = "ONGOING" | "ANSWERED";

export interface Note {
  id: string;
  userId: string;
  type: NoteType;
  title?: string;
  content: string;
  tags: string[];
  isArchived?: boolean;
  /** Prayer status: ONGOING (default) or ANSWERED. Only for type PRAYER. */
  status?: PrayerNoteStatus;
  /** When true, note is visible on the user's public profile. Never in feed/search. */
  shareToProfile?: boolean;
  /** Set when this note was published to the community feed (one-time copy-to-post). */
  publishedPostId?: string;
  /** How this prayer was answered (only when type PRAYER and status ANSWERED). */
  answerNote?: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}
