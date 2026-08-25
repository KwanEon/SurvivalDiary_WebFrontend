export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
  } | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AdminSessionUser {
  userId: number;
  role: 'USER' | 'ADMIN';
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
