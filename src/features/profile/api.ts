import { apiRequest } from '../auth';
import type { User } from '../auth/types';

export interface UpdateProfileInput {
  name: string;
  phone: string | null;
  birthDate: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  region: string | null;
  bio: string | null;
}

export function updateProfile(input: UpdateProfileInput) {
  return apiRequest<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function uploadProfileImage(image: File) {
  const formData = new FormData();
  formData.append('image', image);
  return apiRequest<User>('/users/me/profile-image', {
    method: 'POST',
    body: formData,
  });
}

export function deleteProfileImage() {
  return apiRequest<User>('/users/me/profile-image', { method: 'DELETE' });
}
