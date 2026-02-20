import * as SecureStore from "expo-secure-store";
import {
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useState } from "react";
import { Platform } from "react-native";
import { auth, db } from "../lib/firebaseConfig";

// Define user roles
type Role = "main_admin" | "assistant_admin" | "student" | null;

interface UserData {
  email: string;
  role: Role;
  name: string;
  studentID?: number;
  active?: boolean; 
  deactivatedAt?: string;
  photoURL?: string;
  permissions?: {
    canManageUsers?: boolean;
    canManageEvents?: boolean;
    canManageAnnouncements?: boolean;
    canManageAttendance?: boolean;
    canViewAnalytics?: boolean;
  };
}

interface AuthContextValue {
  user: User | null;
  userData: UserData | null;
  role: Role;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserData>; 
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isMainAdmin: () => boolean;
  isAssistantAdmin: () => boolean;
}

const KEY_USER_DATA = "user_data";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function storeUserData(userData: UserData | null) {
  if (Platform.OS === "web") {
    if (userData) {
      localStorage.setItem(KEY_USER_DATA, JSON.stringify(userData));
    } else {
      localStorage.removeItem(KEY_USER_DATA);
    }
  } else {
    if (userData) {
      await SecureStore.setItemAsync(KEY_USER_DATA, JSON.stringify(userData));
    } else {
      await SecureStore.deleteItemAsync(KEY_USER_DATA);
    }
  }
}

async function readUserData(): Promise<UserData | null> {
  try {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(KEY_USER_DATA);
      return data ? JSON.parse(data) : null;
    } else {
      const data = await SecureStore.getItemAsync(KEY_USER_DATA);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.warn("Error reading user data:", error);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const initializeAuth = async () => {
      const storedData = await readUserData();
      if (storedData) {
        setUserData(storedData);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserData> => {
  setLoading(true);
  
  try { 
    console.log("AuthContext - Starting login for:", email);
    
    if (!email || !password) {
      setLoading(false);
      throw new Error("Email and password are required");
    }

    if (!email.includes('@')) {
      setLoading(false);
      throw new Error("Invalid email format");
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get user data from Firestore (including role and active status)
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (!userDoc.exists()) {
      setLoading(false);
      throw new Error("User account not found in database.");
    }

    const userDataFromDB = userDoc.data() as UserData & { active?: boolean };
    
    // Check if user is active
    if (userDataFromDB.active === false) {
      // Sign out the user since they're deactivated
      await signOut(auth);
      setLoading(false);
      throw new Error("This account has been deactivated. Please contact an administrator.");
    }
    
    // Validate that role exists
    if (!userDataFromDB.role) {
      setLoading(false);
      throw new Error("User role not assigned. Contact administrator.");
    }

    const completeUserData = {
      ...userDataFromDB,
      email: firebaseUser.email || userDataFromDB.email,
    };

    setUser(firebaseUser);
    setUserData(completeUserData);
    await storeUserData(completeUserData);
    
    console.log("Login successful. Role:", completeUserData.role);
    setLoading(false);
    
    return completeUserData; 
    
  } catch (error: any) {
    console.log("AuthContext - Login error:", error);
    setLoading(false);
    
    // Better error messages
    if (error.code === 'auth/invalid-credential') {
      throw new Error("Invalid email or password."); 
    } else if (error.code === 'auth/user-not-found') {
      throw new Error("User not found.");
    } else if (error.code === 'auth/wrong-password') {
      throw new Error("Incorrect password.");
    } else if (error.message.includes("deactivated")) {
      throw error;
    } else {
      throw new Error("Login failed. Please try again.");
    }
  }
};

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      await storeUserData(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Helper functions for role checking
  const hasPermission = (permission: string): boolean => {
    if (!userData) return false;
    if (userData.role === 'main_admin') return true;
    return userData.permissions?.[permission as keyof typeof userData.permissions] || false;
  };

  const isMainAdmin = (): boolean => {
    return userData?.role === 'main_admin';
  };

  const isAssistantAdmin = (): boolean => {
    return userData?.role === 'assistant_admin';
  };

  const value: AuthContextValue = {
    user,
    userData,
    role: userData?.role || null,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    isMainAdmin,
    isAssistantAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};