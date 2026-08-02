import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCurrentUser, logoutUser } from "../services/authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Bumped on every intentional auth change (login/logout). The background
  // /auth/me check that runs on mount can resolve AFTER a user has already
  // logged in through the form (e.g. it was sent while logged out, is slow,
  // and completes later) — without this guard its stale "not logged in"
  // result can overwrite a freshly-logged-in user and silently kick them
  // back out. Any in-flight check that finishes after a version bump is discarded.
  const authVersion = useRef(0);

  const loadUser = useCallback(async () => {
    const versionAtRequestStart = authVersion.current;
    try {
      const currentUser = await fetchCurrentUser();
      if (authVersion.current === versionAtRequestStart) setUserState(currentUser);
    } catch {
      if (authVersion.current === versionAtRequestStart) setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Use this (not setUserState) for any intentional, direct auth change —
  // e.g. right after a successful login response.
  const setUser = (nextUser) => {
    authVersion.current += 1;
    setUserState(nextUser);
  };

  const logout = async () => {
    authVersion.current += 1;
    try {
      await logoutUser(); // POST /auth/logout — clears cookies + DB refresh token hash
    } finally {
      queryClient.clear();
      setUserState(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    hasRole: (...roles) => !!user && roles.includes(user.role),
    refreshUser: loadUser,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}