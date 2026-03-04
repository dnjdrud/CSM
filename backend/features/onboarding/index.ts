/**
 * Backend feature: onboarding (signup request, approve, reject, complete).
 */
export type { CompletionLinkStatus } from "@/lib/data/signupRepository";
export {
  createSignupRequest,
  listSignupRequests,
  approveSignupRequest,
  rejectSignupRequest,
  getCompletionLinkStatus,
  verifyApprovalToken,
  createAdminProfileForOnboarding,
  consumeApprovalTokenAndCreateUser,
} from "@/lib/data/signupRepository";
