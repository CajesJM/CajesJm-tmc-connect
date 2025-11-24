import * as SecureStore from "expo-secure-store";
import {
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useState } from "react";
import { Platform } from "react-native";
import { auth, db } from "../../lib/firebaseConfig";

type Role = "admin" | "student" | null;

interface UserData {
  email: string;
  role: Role;
  name: string;
  studentID?: number;
}

type AuthContextValue = {
  user: User | null;
  userData: UserData | null;
  role: Role;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const KEY_USER_DATA = "user_data";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Store user data securely
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

// Read user data from secure storage
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

  // Initialize from storage on app start
  React.useEffect(() => {
    const initializeAuth = async () => {
      const storedData = await readUserData();
      if (storedData) {
        setUserData(storedData);
   
      }
    };
    initializeAuth();
  }, []);

 const login = async (email: string, password: string): Promise<void> => {
  setLoading(true);
  
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log("AuthContext - Starting login for:", email);
      
      // Basic validation before even trying Firebase
      if (!email || !password) {
        setLoading(false);
        return reject(new Error("Email and password are required"));
      }

      if (!email.includes('@')) {
        setLoading(false);
        return reject(new Error("Invalid email format"));
      }

      // Try Firebase login with extra error isolation
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (firebaseError: any) {
        console.log("AuthContext - Firebase auth failed, but caught safely");
        setLoading(false);
        // Return a generic error without the Firebase error object
        return reject(new Error("Invalid username or password."));
      }

      const firebaseUser = userCredential.user;

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists()) {
        setLoading(false);
        return reject(new Error("User account not found."));
      }

      const userDataFromDB = userDoc.data() as UserData;
      const completeUserData = {
        ...userDataFromDB,
        email: firebaseUser.email || userDataFromDB.email,
      };

      setUser(firebaseUser);
      setUserData(completeUserData);
      await storeUserData(completeUserData);
      
      setLoading(false);
      resolve();
      
    } catch (error: any) {
      console.log("AuthContext - Unexpected error:", error);
      setLoading(false);
      reject(new Error("Login failed. Please try again."));
    }
  });
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

  const value: AuthContextValue = {
    user,
    userData,
    role: userData?.role || null,
    loading,
    isAuthenticated: !!user,
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