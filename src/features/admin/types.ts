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

export interface AdminUserDetail {
  userId: number;
  email: string;
  name: string;
  nickname: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  birthDate: string | null;
  birthYear: number | null;
  gender: 'MALE' | 'FEMALE' | null;
  region: string | null;
  signupInterest: string | null;
  bio: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AdminUserUpdateRequest {
  name: string;
  nickname: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  region: string | null;
  signupInterest: string | null;
  bio: string | null;
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
  adminInquiry: boolean;
  secret: boolean;
  accessible: boolean;
  answered: boolean;
}

export interface CommunityPostUpdateRequest {
  category: string;
  title: string;
  content: string;
  hashtags: string[];
  imageUrls: string[];
  imageAlignment: string | null;
  commentsDisabled: boolean;
  commentsHidden: boolean;
  adminInquiry: boolean;
  secret: boolean;
}
