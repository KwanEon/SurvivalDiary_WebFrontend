import type { ApiEnvelope, TokenData, User } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

let accessToken: string | null = null;
let refreshRequest: Promise<string | null> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !body?.success) {
    throw new ApiError(
      body?.error?.message ?? '요청을 처리하지 못했습니다.',
      body?.error?.code ?? null,
      response.status,
    );
  }
  return body.data;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/auth/web/token/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => parseEnvelope<TokenData>(response))
      .then((tokens) => {
        setAccessToken(tokens.accessToken);
        return tokens.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export async function restoreAccessToken() {
  return refreshAccessToken();
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData))
    headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, init, false);
    sessionExpiredHandler?.();
  }
  return parseEnvelope<T>(response);
}

export async function exchangeSocialCode(
  provider: 'kakao' | 'naver',
  authorizationCode: string,
  redirectUri: string,
  state?: string,
) {
  const response = await fetch(`${API_BASE_URL}/auth/web/social/${provider}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, redirectUri, state }),
  });
  const tokens = await parseEnvelope<TokenData>(response);
  setAccessToken(tokens.accessToken);
  return tokens;
}

export async function loginWithEmail(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/web/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const tokens = await parseEnvelope<TokenData>(response);
  setAccessToken(tokens.accessToken);
  return tokens;
}

export interface SignupInput {
  email: string;
  password: string;
  nickname: string;
  phone: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  signupInterests: string[];
}

export async function signup(input: SignupInput) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await parseEnvelope<null>(response);
}

export const getMe = () => apiRequest<User>('/users/me');

export async function logoutRequest() {
  await fetch(`${API_BASE_URL}/auth/web/logout`, { method: 'POST', credentials: 'include' });
  setAccessToken(null);
}
