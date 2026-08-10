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
  phone: string | null;
  birthDate: string | null;
  birthYear: number | null;
  gender: 'MALE' | 'FEMALE' | null;
  region: string | null;
  signupInterest: string | null;
  bio: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}
