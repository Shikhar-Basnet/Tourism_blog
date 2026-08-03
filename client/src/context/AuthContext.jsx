import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCurrentUser, logoutUser } from "../services/authService.js";

export const AuthContext = createContext(null);

// Hard ceiling on the initial session check. If anything in the auth chain
// hangs (network stall, refresh deadlock, etc.), this guarantees the app
// still renders as "logged out" instead of showing "Checking session..."
// indefinitely. A real, valid session finishes in well under this time.
const SESSION_CHECK_TIMEOUT_MS = 10000;

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const authVersion = useRef(0);

  const loadUser = useCallback(async () => {
    const versionAtRequestStart = authVersion.current;

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Session check timed out")), SESSION_CHECK_TIMEOUT_MS)
    );

    try {
      const currentUser = await Promise.race([fetchCurrentUser(), timeout]);
      if (authVersion.current === versionAtRequestStart) setUserState(currentUser);
    } catch {
      if (authVersion.current === versionAtRequestStart) setUserState(null);
    } finally {
      if (authVersion.current === versionAtRequestStart) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      authVersion.current += 1;
      setUserState(null);
      setLoading(false);
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  const setUser = (nextUser) => {
    authVersion.current += 1;
    setUserState(nextUser);
    setLoading(false);
  };

  const logout = async () => {
    authVersion.current += 1;
    try {
      await logoutUser();
    } finally {
      queryClient.clear();
      setUserState(null);
      setLoading(false);
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