import type { SocialProvider } from './api';

const stateKey = (provider: SocialProvider) => `survivalDiary.oauthState.${provider}`;

export function callbackUri(provider: SocialProvider) {
  return `${window.location.origin}/auth/callback/${provider}`;
}

export function startSocialLogin(provider: SocialProvider) {
  const state = crypto.randomUUID();
  sessionStorage.setItem(stateKey(provider), state);
  const redirectUri = callbackUri(provider);

  if (provider === 'kakao') {
    const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;
    if (!clientId) throw new Error('VITE_KAKAO_REST_API_KEY가 설정되지 않았습니다.');
    const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', state });
    window.location.assign(`https://kauth.kakao.com/oauth/authorize?${query}`);
    return;
  }

  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  if (!clientId) throw new Error('VITE_NAVER_CLIENT_ID가 설정되지 않았습니다.');
  const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', state });
  window.location.assign(`https://nid.naver.com/oauth2.0/authorize?${query}`);
}

export function consumeAndValidateState(provider: SocialProvider, returnedState: string) {
  const expected = sessionStorage.getItem(stateKey(provider));
  sessionStorage.removeItem(stateKey(provider));
  return Boolean(expected && returnedState && expected === returnedState);
}
