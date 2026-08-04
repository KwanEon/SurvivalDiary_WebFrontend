/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KAKAO_REST_API_KEY?: string;
  readonly VITE_NAVER_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
