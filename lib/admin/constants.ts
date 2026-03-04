/**
 * Admin action and target type constants. Single source of truth for audit log.
 */

export const ADMIN_ACTION = {
  HIDE_POST: "HIDE_POST",
  DELETE_COMMENT: "DELETE_COMMENT",
  RESOLVE_REPORT: "RESOLVE_REPORT",
  BLOCK_USER: "BLOCK_USER",
  MUTE_USER: "MUTE_USER",
  CHANGE_ROLE: "CHANGE_ROLE",
  PIN_POST: "PIN_POST",
  UNPIN_POST: "UNPIN_POST",
  CREATE_DAILY_PRAYER: "CREATE_DAILY_PRAYER",
  APPROVE_SIGNUP_REQUEST: "APPROVE_SIGNUP_REQUEST",
  REJECT_SIGNUP_REQUEST: "REJECT_SIGNUP_REQUEST",
  APPROVE_SIGNUP: "APPROVE_SIGNUP",
  REJECT_SIGNUP: "REJECT_SIGNUP",
  COMPLETE_SIGNUP: "COMPLETE_SIGNUP",
} as const;

export type AdminActionType = (typeof ADMIN_ACTION)[keyof typeof ADMIN_ACTION];

export const AUDIT_TARGET_TYPE = {
  POST: "post",
  COMMENT: "comment",
  USER: "user",
  REPORT: "report",
  SIGNUP_REQUEST: "signup_request",
} as const;

export type AuditTargetType = (typeof AUDIT_TARGET_TYPE)[keyof typeof AUDIT_TARGET_TYPE];
