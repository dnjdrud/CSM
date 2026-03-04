/**
 * Token generation and verification for invite, magic-link, password-reset.
 * Raw token is only returned once; DB stores only hash. One-time use + expiry enforced by callers.
 */
import { randomBytes, createHmac, timingSafeEqual } from "crypto";

const TOKEN_BYTES = 32;
const SALT = process.env.TOKEN_HMAC_SECRET ?? "cellah-invite-default-change-in-production";

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Hash token with HMAC-SHA256 (hex). Store this in DB; never store raw token.
 */
export function hashToken(raw: string): string {
  return createHmac("sha256", SALT).update(raw.trim()).digest("hex");
}

/**
 * Constant-time comparison. Returns true if raw token matches the stored hash.
 */
export function verifyToken(raw: string, storedHash: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || !storedHash) return false;
  const computed = hashToken(trimmed);
  if (computed.length !== storedHash.length) return false;
  try {
    return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}
