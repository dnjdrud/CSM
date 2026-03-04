/**
 * Resend email client and sendEmail utility.
 * Server-only: never import from client. Used for approval, invite, magic-link, password-reset.
 *
 * 승인제 플로우: (1) 사용자가 request-access로 가입 요청 → (2) 관리자가 승인 시 approval 이메일 발송
 * (sendApprovalEmail) → (3) 사용자가 링크로 /auth/complete에서 비밀번호 설정 후 가입 완료.
 * 별도로 관리자가 이메일만으로 초대하는 invite 플로우는 auth_invites + sendInviteEmail으로 처리.
 */
import { Resend } from "resend";
import { logError, logInfo } from "@/lib/logging/systemLogger";

function getFrom(): string {
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return "Cellah <onboarding@resend.dev>";
  if (raw.includes("<") && raw.includes(">")) return raw;
  return `Cellah <${raw}>`;
}

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send a single email via Resend.
 * Uses EMAIL_FROM for "from" (supports "Name <email>" or plain email).
 * Logs to system_logs on failure so /admin/system-logs shows the reason.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, html, text } = params;
  const toArray = Array.isArray(to) ? to : [to];
  const from = getFrom();
  const client = getClient();

  logInfo("SERVER_ACTION", "[Resend] send attempt", {
    to: toArray,
    subject,
    from,
    hasKey: !!process.env.RESEND_API_KEY?.trim(),
  });

  if (!client) {
    const msg = `RESEND_API_KEY is not set. Set it in .env.local (local) or in Vercel Environment Variables (production).`;
    logError("SERVER_ACTION", "[Resend] " + msg, { to: toArray, subject });
    throw new Error(msg);
  }

  const { data, error } = await client.emails.send({
    from,
    to: toArray,
    subject,
    html,
    text: text ?? undefined,
  });

  if (error) {
    const msg = `Resend API error: ${error.message}. (If using your own domain, verify it in Resend dashboard. For testing use EMAIL_FROM=onboarding@resend.dev)`;
    logError("SERVER_ACTION", "[Resend] send failed", {
      to: toArray,
      subject,
      resendMessage: error.message,
    });
    throw new Error(msg);
  }

  logInfo("SERVER_ACTION", "[Resend] send success", {
    to: toArray,
    subject,
    id: (data as { id?: string })?.id,
  });
}
