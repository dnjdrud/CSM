const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://cellah.co.kr';

export async function requestMobileLogin(email: string): Promise<{ ok: boolean; notRegistered?: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/mobile/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json().catch(() => ({ ok: false, error: 'Network error' }));
}

export async function verifyMobileLogin(id: string, token: string): Promise<{ access_token?: string; refresh_token?: string; expires_at?: number; error?: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/mobile/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, token }),
  });
  return res.json().catch(() => ({ error: 'Network error' }));
}
