import { apiRequest } from '../auth';
import type {
  CommunityComment,
  CommunityPost,
  CreatePostInput,
  PageResponse,
} from './types';

export function getCommunityPosts(category?: string, page = 0, size = 20, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (category) params.set('category', category);
  return apiRequest<PageResponse<CommunityPost>>(`/community/posts?${params.toString()}`, {
    signal,
  });
}

export function getPopularCommunityPosts(size = 5, signal?: AbortSignal) {
  return apiRequest<PageResponse<CommunityPost>>(`/community/posts/popular?size=${size}`, { signal });
}

export function getCommunityPost(postId: number, signal?: AbortSignal) {
  return apiRequest<CommunityPost>(`/community/posts/${postId}`, { signal });
}

export function createCommunityPost(input: CreatePostInput) {
  return apiRequest<CommunityPost>('/community/posts', {
    method: 'POST',
    body: JSON.stringify(normalizePostInput(input)),
  });
}

export function updateCommunityPost(postId: number, input: CreatePostInput) {
  return apiRequest<CommunityPost>(`/community/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(normalizePostInput(input)),
  });
}

function normalizePostInput(input: CreatePostInput) {
  return {
    ...input,
    hashtags: input.hashtags ?? [],
    imageUrls: input.imageUrls ?? [],
    imageAlignment: input.imageAlignment ?? 'center',
    commentsDisabled: input.commentsDisabled ?? false,
    commentsHidden: input.commentsHidden ?? false,
  };
}

export function deleteCommunityPost(postId: number) {
  return apiRequest<void>(`/community/posts/${postId}`, { method: 'DELETE' });
}

export function toggleCommunityLike(postId: number) {
  return apiRequest<CommunityPost>(`/community/posts/${postId}/like`, { method: 'POST' });
}

export function toggleCommunityBookmark(postId: number) {
  return apiRequest<CommunityPost>(`/community/posts/${postId}/bookmark`, { method: 'POST' });
}

export function getCommunityComments(postId: number, signal?: AbortSignal) {
  return apiRequest<CommunityComment[]>(`/community/posts/${postId}/comments`, { signal });
}

export function createCommunityComment(postId: number, content: string) {
  return apiRequest<CommunityComment>(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function deleteCommunityComment(commentId: number) {
  return apiRequest<void>(`/community/posts/comments/${commentId}`, { method: 'DELETE' });
}
