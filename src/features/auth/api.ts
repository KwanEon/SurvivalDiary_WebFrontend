export type SocialProvider = 'kakao' | 'naver';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
}

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  '',
);
const authBaseUrl = configuredBaseUrl.endsWith('/api')
  ? `${configuredBaseUrl}/auth`
  : `${configuredBaseUrl}/api/auth`;

export async function exchangeSocialCode(
  provider: SocialProvider,
  authorizationCode: string,
  redirectUri: string,
  state: string,
): Promise<TokenData> {
  const response = await fetch(`${authBaseUrl}/web/social/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ authorizationCode, redirectUri, state }),
  });
  const body = (await response.json()) as ApiResponse<TokenData>;
  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message || '생존일기 서버 로그인에 실패했습니다.');
  }
  return body.data;
}

export function saveSession(tokens: TokenData) {
  sessionStorage.setItem('survivalDiary.accessToken', tokens.accessToken);
  sessionStorage.setItem('survivalDiary.refreshToken', tokens.refreshToken);
}

export function hasSession() {
  return Boolean(sessionStorage.getItem('survivalDiary.accessToken'));
}
