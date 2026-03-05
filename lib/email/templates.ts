/**
 * Email templates for invite, password-reset, and approval.
 * Returns { html, text } for Resend. Simple HTML with button link.
 */

export function buildInviteEmail(params: { inviteUrl: string }): { html: string; text: string } {
  const { inviteUrl } = params;
  const text = `You're invited to join Cellah.

Open the link below to complete your signup. This link expires in 7 days.

${inviteUrl}

If you didn't expect this invite, you can ignore this email.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invitation</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="color: #333;">You're invited to join Cellah.</p>
  <p style="color: #555;">Open the link below to complete your signup. This link expires in 7 days.</p>
  <p style="margin: 24px 0;"><a href="${escapeHtml(inviteUrl)}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Complete signup</a></p>
  <p style="color: #888; font-size: 14px;">If you didn't expect this invite, you can ignore this email.</p>
</body>
</html>`;
  return { html: html.trim(), text };
}

export function buildResetPasswordEmail(params: { resetUrl: string }): { html: string; text: string } {
  const { resetUrl } = params;
  const text = `Reset your Cellah password

Click the link below to set a new password. This link expires in 1 hour.

${resetUrl}

If you didn't request a password reset, you can ignore this email.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset password</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="color: #333;">Reset your Cellah password</p>
  <p style="color: #555;">Click the link below to set a new password. This link expires in 1 hour.</p>
  <p style="margin: 24px 0;"><a href="${escapeHtml(resetUrl)}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Reset password</a></p>
  <p style="color: #888; font-size: 14px;">If you didn't request a password reset, you can ignore this email.</p>
</body>
</html>`;
  return { html: html.trim(), text };
}

/** Approval (signup request approved) — completion link. */
export function buildApprovalEmail(params: { completionUrl: string }): { html: string; text: string } {
  const { completionUrl } = params;
  const text = `Your request to join has been approved. Complete your signup by opening the link below and setting your password.

${completionUrl}

This link expires in 7 days. If you didn't request access, you can ignore this email.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Access approved</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="color: #333;">Your request to join has been approved.</p>
  <p style="color: #555;">Complete your signup by opening the link below and setting your password.</p>
  <p style="margin: 24px 0;"><a href="${escapeHtml(completionUrl)}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Complete signup</a></p>
  <p style="color: #888; font-size: 14px;">This link expires in 7 days. If you didn't request access, you can ignore this email.</p>
</body>
</html>`;
  return { html: html.trim(), text };
}

/** Magic link (sign-in link) email. */
export function buildMagicLinkEmail(params: { magicUrl: string }): { html: string; text: string } {
  const { magicUrl } = params;
  const text = `Sign in to Cellah\n\nClick the link below to sign in. This link expires in 1 hour.\n\n${magicUrl}\n\nIf you didn't request this, you can ignore this email.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sign in to Cellah</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="color: #333;">Sign in to Cellah</p>
  <p style="color: #555;">Click the link below to sign in. This link expires in 1 hour.</p>
  <p style="margin: 24px 0;"><a href="${escapeHtml(magicUrl)}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Sign in</a></p>
  <p style="color: #888; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
</body>
</html>`;
  return { html: html.trim(), text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
