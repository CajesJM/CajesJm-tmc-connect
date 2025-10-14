import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

type Role = "admin" | "student" | null;
type AuthContextValue = {
  role: Role;
  loading: boolean;
  isAuthenticated: boolean;
  login: (newRole: Role) => Promise<void>;
  logout: () => Promise<void>;
};

const KEY_ROLE = "role";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Platform-aware storage helpers:
 * - Web -> localStorage
 * - Native -> expo-secure-store
 */
async function storeRole(role: Role) {
  if (Platform.OS === "web") {
    if (role) localStorage.setItem(KEY_ROLE, role);
    else localStorage.removeItem(KEY_ROLE);
  } else {
    if (role) await SecureStore.setItemAsync(KEY_ROLE, role);
    else await SecureStore.deleteItemAsync(KEY_ROLE);
  }
}

async function readRole(): Promise<Role> {
  if (Platform.OS === "web") {
    const v = localStorage.getItem(KEY_ROLE);
    return v === "admin" || v === "student" ? (v as Role) : null;
  } else {
    const v = await SecureStore.getItemAsync(KEY_ROLE);
    return v === "admin" || v === "student" ? (v as Role) : null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      // 🔥 Force clear role for testing
      await storeRole(null);

      const stored = await readRole();
      if (!mounted) return;
      if (stored) setRole(stored);
    } catch (err) {
      console.warn("AuthProvider: readRole failed", err);
    } finally {
      if (mounted) setLoading(false);
    }
  })();
  return () => {
    mounted = false;
  };
}, []);


  const login = async (newRole: Role) => {
    if (!newRole) throw new Error("login requires a role");
    await storeRole(newRole);
    setRole(newRole);
  };

  const logout = async () => {
    await storeRole(null);
    setRole(null);
  };

  const value: AuthContextValue = {
    role,
    loading,
    isAuthenticated: !!role,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};