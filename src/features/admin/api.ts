import { apiRequest } from '../auth';
import type { CommunityPost, PageResponse } from '../community/types';

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

export function getAdminUsers(query = '', page = 0, size = 20) {
  return apiRequest<PageResponse<AdminUser>>(`/admin/users?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
}

export function getAdminUserExpenses(userId: number) {
  return apiRequest<AdminExpense[]>(`/admin/users/${userId}/expenses`);
}

export function getAdminPosts(page = 0, size = 20) {
  return apiRequest<PageResponse<CommunityPost>>(`/admin/community/posts?page=${page}&size=${size}`);
}

export function answerAdminPost(postId: number, content: string) {
  return apiRequest(`/admin/community/posts/${postId}/answer`, { method: 'POST', body: JSON.stringify({ content }) });
}

export function deleteAdminPost(postId: number) {
  return apiRequest<void>(`/admin/community/posts/${postId}`, { method: 'DELETE' });
}
