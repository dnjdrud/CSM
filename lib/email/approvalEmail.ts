/**
 * Approval email copy and body builder. Calm, community tone.
 * Actual sending is done by Supabase Edge Function send-approval-email.
 */

export const APPROVAL_EMAIL_SUBJECT = "Your access is approved — complete your signup";

export function buildApprovalEmailBody(link: string): string {
  return `Your request to join has been approved. Complete your signup by opening the link below and setting your password.

${link}

This link expires in 7 days. If you didn't request access, you can ignore this email.`;
}
