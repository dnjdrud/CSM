/**
 * POST /api/auth/mobile/request — Send magic link for mobile app (deep link).
 * Body: { email: string }
 * Creates DB token, sends email with cellah://auth/verify?id=X&token=Y deep link.
 */
import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth/magicLink';
import { sendEmail } from '@/lib/email/resend';

export async function POST(request: Request) {
  let body: { email?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

  const result = await createMagicLink(email);
  if ('error' in result) {
    if (result.error === 'USER_NOT_FOUND') return NextResponse.json({ ok: true, notRegistered: true });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Build deep link for mobile app
  const deepLink = `cellah://auth/verify?id=${encodeURIComponent(result.id)}&token=${encodeURIComponent(result.rawToken)}`;

  const text = `셀라 앱 로그인\n\n아래 링크를 탭하면 바로 로그인됩니다.\n\n${deepLink}\n\n이 링크는 1시간 후 만료됩니다.`;
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
  <p style="color:#333;font-size:18px;font-weight:600;">셀라 앱 로그인</p>
  <p style="color:#555;">아래 버튼을 탭하면 바로 로그인됩니다.</p>
  <p style="margin:24px 0;"><a href="${deepLink}" style="display:inline-block;padding:12px 24px;background:#1f2937;color:#fff;text-decoration:none;border-radius:8px;">셀라 앱으로 로그인</a></p>
  <p style="color:#888;font-size:13px;">이 링크는 1시간 후 만료됩니다.</p>
</body></html>`;

  try {
    await sendEmail({ to: email, subject: '셀라 앱 로그인', html, text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `이메일 발송 실패: ${msg}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
