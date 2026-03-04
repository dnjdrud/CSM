/**
 * Backend feature: profile (user, follow, block, mute).
 */
export {
  getUserById,
  getProfileWithError,
  listFollowingIds,
  listFollowerIds,
  toggleFollow,
  isBlocked,
  isMuted,
  toggleBlock,
  toggleMute,
} from "@/lib/data/repository";
