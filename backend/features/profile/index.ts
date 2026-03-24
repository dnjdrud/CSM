/**
 * Backend feature: profile (user, follow, block, mute).
 */
export { getUserById } from "@/lib/data/userRepository";
export { getUserByIdWithError as getProfileWithError } from "@/lib/data/userRepository";
export {
  listFollowingIds,
  listFollowerIds,
  listFollowers,
  listFollowing,
  toggleFollow,
} from "@/lib/data/followRepository";
// isBlocked / isMuted / toggleBlock / toggleMute are in-memory client-side state
export { isBlocked, isMuted, toggleBlock, toggleMute } from "@/lib/data/repository";
