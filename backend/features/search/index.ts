/**
 * Backend feature: search (posts, people, tags).
 */
export {
  searchPosts,
  searchPeople,
  searchTags,
  listAllTags,
  listPopularTags,
} from "@/lib/data/searchRepository";
export { listPostsByTag } from "@/lib/data/postRepository";
