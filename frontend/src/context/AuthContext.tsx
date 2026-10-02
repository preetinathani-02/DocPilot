import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type AuthUser,
  fetchCurrentUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  refreshSession,
  registerUser,
} from "@/lib/auth";
import { setAccessToken } from "@/lib/tokenStore";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // On first load, there's no access token in memory yet (page reload wipes
  // it). Try a silent refresh using the httpOnly cookie to recover the
  // session without asking the user to log in again.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await refreshSession();
      if (cancelled) return;

      if (result) {
        const me = await fetchCurrentUser();
        if (!cancelled) setUser(me);
      }
      if (!cancelled) setIsInitializing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const res = await registerUser({ email, password, full_name: fullName });
      setUser(res.user);
    },
    []
  );

  const loginGoogle = useCallback(async (idToken: string) => {
    const res = await loginWithGoogle(idToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isInitializing,
        login,
        register,
        loginGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
