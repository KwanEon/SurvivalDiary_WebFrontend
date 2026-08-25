export type CommunityCategory = 'ALL' | 'FREE' | 'INFO' | 'CERTIFICATION' | 'QUESTION';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface CommunityPost {
  postId: number;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
  nickname: string | null;
  imageUrls: string[];
  imageAlignment: string | null;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  liked: boolean;
  bookmarked: boolean;
  owner: boolean;
  authorRole: 'USER' | 'ADMIN';
  commentsDisabled: boolean;
  commentsHidden: boolean;
}

export interface CreatePostInput {
  category: string;
  title: string;
  content: string;
  hashtags?: string[];
  imageUrls?: string[];
  imageAlignment?: string;
  commentsDisabled?: boolean;
  commentsHidden?: boolean;
}

export interface CommunityComment {
  commentId: number;
  content: string;
  createdAt: string;
  author: string;
  nickname: string | null;
  owner: boolean;
}
