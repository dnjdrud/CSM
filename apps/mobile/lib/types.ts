export type UserRole = 'LAY' | 'MINISTRY_WORKER' | 'PASTOR' | 'MISSIONARY' | 'SEMINARIAN' | 'ADMIN';

export const ROLE_DISPLAY: Record<UserRole, string> = {
  LAY: '평신도',
  MINISTRY_WORKER: '전도사',
  PASTOR: '목사',
  MISSIONARY: '선교사',
  SEMINARIAN: '신학생',
  ADMIN: '관리자',
};

export type PostCategory = 'GENERAL' | 'DEVOTIONAL' | 'MINISTRY' | 'TESTIMONY' | 'PHOTO' | 'PRAYER' | 'CELL' | 'CONTENT' | 'REQUEST' | 'MISSION';

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  GENERAL: '일반',
  DEVOTIONAL: '묵상',
  MINISTRY: '사역',
  TESTIMONY: '간증',
  PHOTO: '사진',
  PRAYER: '기도',
  CELL: '셀',
  CONTENT: '컨텐츠',
  REQUEST: '요청',
  MISSION: '선교',
};

export type ReactionType = 'PRAYED' | 'WITH_YOU';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  bio?: string;
  affiliation?: string;
  church?: string | null;
  username?: string | null;
  createdAt: string;
  denomination?: string | null;
  faithYears?: number | null;
  avatarUrl?: string | null;
}

export interface Post {
  id: string;
  authorId: string;
  category: PostCategory;
  content: string;
  visibility: string;
  tags: string[];
  createdAt: string;
  youtubeUrl?: string | null;
  mediaUrls?: string[];
  isSubscriberOnly?: boolean;
}

export interface PostWithAuthor extends Post {
  author: User;
  reactionCount: number;
  myReaction?: ReactionType | null;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  parentId?: string | null;
  likeCount?: number;
  isLiked?: boolean;
}

export interface Notification {
  id: string;
  type: string;
  actorId?: string | null;
  actor?: User | null;
  postId?: string | null;
  commentId?: string | null;
  message?: string | null;
  read: boolean;
  createdAt: string;
}
