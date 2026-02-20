"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken, getMe, logout as apiLogout } from "./api";

interface User {
  id: number;
  email: string;
  uuid: string;
}

interface Subscription {
  plan: string;
  expiresAt: number;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  subscription: null,
  loading: true,
  isAuthenticated: false,
  refresh: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const result = await getMe();
      if (result.success && result.user) {
        setUser(result.user);
        setSubscription(result.subscription || null);
      } else {
        setUser(null);
        setSubscription(null);
      }
    } catch {
      setUser(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(() => {
    apiLogout();
    setUser(null);
    setSubscription(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        isAuthenticated: !!user,
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
