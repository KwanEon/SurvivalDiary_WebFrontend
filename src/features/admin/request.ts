import type { ApiEnvelope } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

let accessToken: string | null = null;
let refreshRequest: Promise<string | null> | null = null;

class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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
      .then((response) => parseEnvelope<{ accessToken: string }>(response))
      .then((tokens) => {
        accessToken = tokens.accessToken;
        return tokens.accessToken;
      })
      .catch(() => {
        accessToken = null;
        return null;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/web/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const tokens = await parseEnvelope<{ accessToken: string }>(response);
  accessToken = tokens.accessToken;
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/web/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    accessToken = null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, init, false);
  }

  return parseEnvelope<T>(response);
}
