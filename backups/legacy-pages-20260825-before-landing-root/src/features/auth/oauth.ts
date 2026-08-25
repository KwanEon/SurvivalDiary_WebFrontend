export type SocialProvider = 'kakao' | 'naver';

const callbackUrl = (provider: SocialProvider) =>
  `${window.location.origin}/auth/callback/${provider}`;

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function startSocialLogin(provider: SocialProvider, returnTo = '/') {
  sessionStorage.setItem('auth:returnTo', returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/');
  const redirectUri = callbackUrl(provider);
  const state = randomState();
  sessionStorage.setItem(`auth:${provider}State`, state);

  if (provider === 'kakao') {
    const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;
    if (!clientId) throw new Error('카카오 로그인 환경변수가 설정되지 않았습니다.');
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', state });
    window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`);
    return;
  }

  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  if (!clientId) throw new Error('네이버 로그인 환경변수가 설정되지 않았습니다.');
  const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state });
  window.location.assign(`https://nid.naver.com/oauth2.0/authorize?${params}`);
}

export function getCallbackUrl(provider: SocialProvider) {
  return callbackUrl(provider);
}
