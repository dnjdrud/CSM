/**
 * Backend feature: auth (profile provisioning, deactivate, restore).
 */
export { createUserProfileInSupabase } from "@/lib/data/repository";
export { deactivateUser, restoreUser } from "@/lib/data/userRepository";
export { ensureProfileForBypassEmail } from "@/lib/data/userProvisioning";
