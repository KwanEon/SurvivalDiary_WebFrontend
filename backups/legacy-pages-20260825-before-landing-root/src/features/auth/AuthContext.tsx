import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getMe, logoutRequest, restoreAccessToken, setSessionExpiredHandler } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  completeLogin: () => Promise<void>;
  refreshUser: () => Promise<User>;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => setUser(null), []);

  const refreshUser = useCallback(async () => {
    const currentUser = await getMe();
    setUser(currentUser);
    return currentUser;
  }, []);

  const completeLogin = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  const updateUser = useCallback((currentUser: User) => setUser(currentUser), []);

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
      refreshUser,
      updateUser,
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          clearSession();
        }
      },
    }),
    [user, isLoading, completeLogin, refreshUser, updateUser, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
