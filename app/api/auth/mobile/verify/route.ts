/**
 * POST /api/auth/mobile/verify — Verify magic link token for mobile, return session JSON.
 * Body: { id: string; token: string }
 * Returns: { access_token, refresh_token, expires_at } or { error }
 */
import { NextResponse } from 'next/server';
import { consumeMagicLink } from '@/lib/auth/magicLink';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  let body: { id?: string; token?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const id = body.id?.trim();
  const token = body.token?.trim();
  if (!id || !token) return NextResponse.json({ error: 'id and token are required' }, { status: 400 });

  // Verify custom magic link
  const result = await consumeMagicLink(id, token);
  if (!result) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!admin || !supabaseUrl || !anonKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  // Defense: check COMPLETED status
  const { isAdminEmail } = await import('@/lib/admin/bootstrap');
  if (!isAdminEmail(result.email)) {
    const { data: signupReq } = await admin.from('signup_requests').select('id').eq('email', result.email).eq('status', 'COMPLETED').maybeSingle();
    if (!signupReq) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Generate Supabase magic link to get hashed_token
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: result.email });
  if (linkError || !linkData?.properties?.hashed_token) return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });

  // Verify OTP to get session
  const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: sessionData, error: verifyError } = await anonClient.auth.verifyOtp({ token_hash: linkData.properties.hashed_token, type: 'magiclink' });
  if (verifyError || !sessionData?.session) return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });

  const { session } = sessionData;
  return NextResponse.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
}
