/**
 * Approval email copy and body builder. Calm, community tone.
 * Sending is done via Resend from the Next.js server (sendApprovalEmail in lib/email/send).
 */

export const APPROVAL_EMAIL_SUBJECT = "Your access is approved — complete your signup";

export function buildApprovalEmailBody(link: string): string {
  return `Your request to join has been approved. Complete your signup by opening the link below and setting your password.

${link}

This link expires in 7 days. If you didn't request access, you can ignore this email.`;
}
