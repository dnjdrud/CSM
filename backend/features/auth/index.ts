/**
 * Backend feature: auth (profile provisioning, deactivate, restore).
 */
export {
  createUserProfileInSupabase,
  deactivateUser,
  restoreUser,
} from "@/lib/data/repository";
export { ensureProfileForBypassEmail } from "@/lib/data/userProvisioning";
