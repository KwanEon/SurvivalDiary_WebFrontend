export interface TokenData {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface User {
  userId: number;
  email: string | null;
  name: string;
  nickname: string | null;
  profileImageUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}
