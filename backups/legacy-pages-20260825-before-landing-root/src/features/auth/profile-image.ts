import { API_BASE_URL } from './api';

const supportedProtocols = new Set(['http:', 'https:']);

export function resolveProfileImageUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return null;

  try {
    const frontendOrigin =
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const frontendProtocol = typeof window === 'undefined' ? 'http:' : window.location.protocol;
    const apiUrl = new URL(API_BASE_URL, frontendOrigin);
    const profileImageUrl = new URL(trimmedValue, `${apiUrl.origin}/`);

    if (!supportedProtocols.has(profileImageUrl.protocol)) return null;

    if (frontendProtocol === 'https:' && profileImageUrl.protocol === 'http:') {
      profileImageUrl.protocol = 'https:';
    }

    return profileImageUrl.toString();
  } catch {
    return null;
  }
}
