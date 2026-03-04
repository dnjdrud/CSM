/**
 * Backend feature: admin (users, audit, moderation, daily prayer).
 */
export type { DashboardStats, AdminUserRow } from "@/lib/data/adminRepository";
export {
  getDashboardStats,
  listUsers,
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser,
  changeUserRole,
  listAuditLogs,
  hidePost,
  deleteComment,
  resolveModerationReport,
  createDailyPrayer,
} from "@/lib/data/adminRepository";
export {
  listOpenReports,
  listRecentReports,
  resolveReport,
  unhidePost,
  adminDeleteComment,
} from "@/lib/data/moderationRepository";
