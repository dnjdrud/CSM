/**
 * Notification data access. Re-exports from repository; swap for API later.
 */
export {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  countUnreadNotifications,
} from "@/lib/data/repository";

/** Alias for badge/API use. Same as countUnreadNotifications. */
export { countUnreadNotifications as getUnreadNotificationsCount } from "@/lib/data/repository";
