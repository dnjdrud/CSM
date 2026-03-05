/**
 * Send transactional emails via Resend (server-only).
 * Invite: admin-invite link. Reset: password reset. Approval: signup completion.
 * Login magic links are handled by Supabase natively (signInWithOtp).
 */
import { sendEmail } from "@/lib/email/resend";
import {
  buildInviteEmail,
  buildResetPasswordEmail,
  buildApprovalEmail,
} from "@/lib/email/templates";

export async function sendInviteEmail(to: string, inviteUrl: string): Promise<void> {
  const { html, text } = buildInviteEmail({ inviteUrl });
  await sendEmail({
    to: to.trim().toLowerCase(),
    subject: "You're invited to join Cellah",
    html,
    text,
  });
}

export async function sendResetPasswordEmail(to: string, resetUrl: string): Promise<void> {
  const { html, text } = buildResetPasswordEmail({ resetUrl });
  await sendEmail({
    to: to.trim().toLowerCase(),
    subject: "Reset your Cellah password",
    html,
    text,
  });
}

export async function sendApprovalEmail(to: string, completionUrl: string): Promise<void> {
  const { html, text } = buildApprovalEmail({ completionUrl });
  await sendEmail({
    to: to.trim().toLowerCase(),
    subject: "Your access is approved — complete your signup",
    html,
    text,
  });
}
