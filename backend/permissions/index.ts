/**
 * Backend permissions: guards, rate limit, admin.
 */
export { canViewPost } from "@/lib/domain/guards";
export {
  assertRateLimit,
  RATE_LIMIT_EXCEEDED,
  RATE_LIMIT_MESSAGE,
} from "@/lib/security/rateLimit";
export { getAdminOrNull } from "@/lib/admin/guard";
