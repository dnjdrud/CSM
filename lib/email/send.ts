/**
 * Send transactional emails via Resend (server-only).
 * Invite: admin-invite link. Magic link: login. Reset: password reset. Approval: signup completion.
 */
import { sendEmail } from "@/lib/email/resend";
import {
  buildInviteEmail,
  buildMagicLinkEmail,
  buildResetPasswordEmail,
  buildApprovalEmail,
  buildApprovalLoginEmail,
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

export async function sendMagicLinkEmail(to: string, loginUrl: string): Promise<void> {
  const { html, text } = buildMagicLinkEmail({ loginUrl });
  await sendEmail({
    to: to.trim().toLowerCase(),
    subject: "Sign in to Cellah",
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

export async function sendApprovalLoginEmail(to: string, loginUrl: string): Promise<void> {
  const { html, text } = buildApprovalLoginEmail({ loginUrl });
  await sendEmail({
    to: to.trim().toLowerCase(),
    subject: "셀라 가입이 승인되었습니다 — 로그인하기",
    html,
    text,
  });
}
