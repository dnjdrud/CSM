/**
 * Backend feature: posts (CRUD, by author).
 */
export {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  listPostsByAuthorId,
  toggleReaction,
} from "@/lib/data/repository";
