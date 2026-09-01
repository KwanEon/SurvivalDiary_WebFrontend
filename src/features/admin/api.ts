import { apiRequest, loginWithEmail, logoutSession } from './request';
import type {
  AdminSessionUser,
  AdminUserDetail,
  AdminUserUpdateRequest,
  CommunityPost,
  CommunityPostUpdateRequest,
  PageResponse,
} from './types';

export type { CommunityPost } from './types';

export interface AdminUser {
  userId: number;
  email: string;
  name: string;
  nickname: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AdminExpense {
  expenseId: number;
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  spentAt: string;
  memo: string | null;
}

export function getAdminSessionUser() {
  return apiRequest<AdminSessionUser>('/users/me');
}

export async function loginAdmin(email: string, password: string) {
  await loginWithEmail(email, password);

  try {
    const user = await getAdminSessionUser();
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 계정만 로그인할 수 있어요.');
    }
    return user;
  } catch (error) {
    await logoutSession();
    throw error;
  }
}

export function getAdminUsers(query = '', page = 0, size = 20) {
  return apiRequest<PageResponse<AdminUser>>(
    `/admin/users?query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
  );
}

export function getAdminUserExpenses(userId: number) {
  return apiRequest<AdminExpense[]>(`/admin/users/${userId}/expenses`);
}

export function getAdminUser(userId: number) {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}`);
}

export function updateAdminUser(userId: number, request: AdminUserUpdateRequest) {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function getAdminPosts(page = 0, size = 20) {
  return apiRequest<PageResponse<CommunityPost>>(
    `/admin/community/posts?page=${page}&size=${size}`,
  );
}

export function getAdminPost(postId: number) {
  return apiRequest<CommunityPost>(`/admin/community/posts/${postId}`);
}

export function updateAdminPost(postId: number, request: CommunityPostUpdateRequest) {
  return apiRequest<CommunityPost>(`/admin/community/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function answerAdminPost(postId: number, content: string) {
  return apiRequest(`/admin/community/posts/${postId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function deleteAdminPost(postId: number) {
  return apiRequest<void>(`/admin/community/posts/${postId}`, { method: 'DELETE' });
}
