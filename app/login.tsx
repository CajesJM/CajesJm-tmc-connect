import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from '../lib/firebaseConfig';
import { LoginStyles } from "../styles/LoginStyles";

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuth();


  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isMainAdmin = (email: string) => {

    const mainAdminEmails = [
      'mainadmin@tmc.edu',
      'systemadmin@tmc.edu',
      'superadmin@tmc.edu',
      'admin@tmc.edu'
    ];

    const mainAdminPatterns = [
      /^main\.admin/i,
      /^system\.admin/i,
      /^super\.admin/i
    ];

    if (mainAdminEmails.includes(email.toLowerCase())) {
      return true;
    }

    for (const pattern of mainAdminPatterns) {
      if (pattern.test(email)) {
        return true;
      }
    }

    return false;
  };

  const handleLogin = async () => {
  if (busy) return;
  setError(null);

  if (!username || !password) {
    setError("Please enter username and password");
    return;
  }

  setBusy(true);
  try {
    console.log("Looking up username:", username);
    
    // Find the user by username in Firestore
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("Username not found in database");
      setError("Invalid username or password");
      Alert.alert("Login Failed", "Invalid username or password");
      setBusy(false);
      return;
    }

    // Get the user data
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log("Found user with email:", userData.email);
    console.log("User role:", userData.role);

    if (userData.role === 'main_admin') {
      console.log("Main admin attempted to login through regular portal - blocked");
      setError("Main administrators must use the Admin Portal");
      Alert.alert(
        "Access Denied", 
        "Main administrators must login through the Admin Portal.\n\nPlease visit: /super-admin-login"
      );
      setBusy(false);
      return;
    }

    const loggedInUser = await login(userData.email, password);
    
    console.log("Login successful. User role:", loggedInUser.role);
    

    let targetRoute = '/student'; 
    
    if (loggedInUser.role === 'assistant_admin') {
      targetRoute = '/assistant_admin';
    }
    
    console.log("Redirecting to:", targetRoute);
    
    setTimeout(() => {
      router.replace(targetRoute as any);
    }, 300);
    
  } catch (err: any) {
    console.log("Login error:", err.message);
    
    let errorMessage = "Invalid username or password. Please try again.";
    
    if (err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found') {
      errorMessage = "Invalid username or password";
    } else if (err.code === 'auth/too-many-requests') {
      errorMessage = "Too many failed attempts. Please try again later.";
    } else if (err.code === 'auth/network-request-failed') {
      errorMessage = "Network error. Please check your connection.";
    }
    
    setError(errorMessage);
    Alert.alert("Login Failed", errorMessage);
  } finally {
    setBusy(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={LoginStyles.outerContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <View style={LoginStyles.cosmicBg} />
      <View style={LoginStyles.nebulaBg} />

      <ScrollView
        contentContainerStyle={LoginStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={LoginStyles.card}>
          <View style={LoginStyles.logoContainer}>
            <Image
              source={require('../assets/images/Logo/TMC_Connect.png')}
              style={LoginStyles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={LoginStyles.title}>Campus Hub Login</Text>
          <Text style={LoginStyles.subtitle}>Sign in with your username</Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (error) setError(null);
            }}
            style={LoginStyles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <View style={LoginStyles.inputWrap}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              style={LoginStyles.inputWithIcon}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              style={LoginStyles.iconBtn}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="rgba(255, 255, 255, 0.7)"
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={LoginStyles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[LoginStyles.button, (busy || loading) && LoginStyles.disabled]}
            onPress={handleLogin}
            disabled={busy || loading}
          >
            {busy || loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={LoginStyles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>


        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  adminHint: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  adminHintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});