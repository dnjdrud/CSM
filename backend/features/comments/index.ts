/**
 * Backend feature: comments (CRUD, by post).
 */
export {
  addComment,
  listCommentsByPostId,
  deleteComment,
  updateComment,
  getCommentAuthorId,
} from "@/lib/data/commentRepository";
