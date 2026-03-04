/**
 * Resend email client and sendEmail utility.
 * Server-only: never import from client. Used for approval, invite, magic-link, password-reset.
 *
 * 승인제 플로우: (1) 사용자가 request-access로 가입 요청 → (2) 관리자가 승인 시 approval 이메일 발송
 * (sendApprovalEmail) → (3) 사용자가 링크로 /auth/complete에서 비밀번호 설정 후 가입 완료.
 * 별도로 관리자가 이메일만으로 초대하는 invite 플로우는 auth_invites + sendInviteEmail으로 처리.
 */
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Cellah <onboarding@resend.dev>";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key?.trim()) return null;
  return new Resend(key.trim());
}

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send a single email via Resend.
 * Uses EMAIL_FROM for "from" (supports "Name <email>" format).
 * In development, logs to console; on error throws with to/subject in message.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, html, text } = params;
  const client = getClient();

  if (process.env.NODE_ENV !== "production") {
    const toList = Array.isArray(to) ? to : [to];
    // eslint-disable-next-line no-console
    console.log("[Resend] send:", { to: toList, subject });
  }

  if (!client) {
    throw new Error(
      `Email not configured (RESEND_API_KEY). Failed to send to ${Array.isArray(to) ? to.join(", ") : to}, subject: ${subject}`
    );
  }

  const toArray = Array.isArray(to) ? to : [to];
  const { error } = await client.emails.send({
    from: FROM,
    to: toArray,
    subject,
    html,
    text: text ?? undefined,
  });

  if (error) {
    const msg = `Resend error sending to ${toArray.join(", ")} subject "${subject}": ${error.message}`;
    throw new Error(msg);
  }
}
