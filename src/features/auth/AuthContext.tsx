import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, logoutRequest, restoreAccessToken, setSessionExpiredHandler } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  completeLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => setUser(null);

  const completeLogin = async () => {
    const currentUser = await getMe();
    setUser(currentUser);
  };

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    void restoreAccessToken()
      .then((token) => (token ? getMe() : null))
      .then(setUser)
      .catch(clearSession)
      .finally(() => setIsLoading(false));
    return () => setSessionExpiredHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      completeLogin,
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          clearSession();
        }
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
