import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebaseConfig";
import { COLORS, LoginStyles } from "../styles/LoginStyles";

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [busy, setBusy]                     = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [showPassword, setShowPassword]     = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Lockout state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);

  // Forgot password state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const isLoading = busy || loading;
  const isLockedOut = lockoutUntil && lockoutUntil > Date.now();

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
  };

  const saveLockoutState = async (attempts: number, lockoutTime: number | null) => {
    try {
      await AsyncStorage.setItem('studentLoginAttempts', JSON.stringify({
        failedAttempts: attempts,
        lockoutUntil: lockoutTime,
      }));
    } catch (e) {
      // Silently fail to avoid disrupting login flow
    }
  };

  const restoreLockoutState = async () => {
    try {
      const stored = await AsyncStorage.getItem('studentLoginAttempts');
      if (stored) {
        const { failedAttempts: storedAttempts, lockoutUntil: storedLockout } = JSON.parse(stored);
        if (storedLockout && storedLockout > Date.now()) {
          setFailedAttempts(storedAttempts);
          setLockoutUntil(storedLockout);
        } else {
          await AsyncStorage.removeItem('studentLoginAttempts');
          setFailedAttempts(0);
          setLockoutUntil(null);
        }
      }
    } catch (e) {
      try {
        await AsyncStorage.removeItem('studentLoginAttempts');
      } catch (err) {
        // Silently fail
      }
    }
  };

  useEffect(() => {
    restoreLockoutState();
  }, []);

  // Countdown effect for lockout
  useEffect(() => {
    let interval: number;
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const updateRemaining = () => {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        setRemainingLockoutSeconds(remaining);
        if (remaining === 0) {
          setLockoutUntil(null);
          setFailedAttempts(0);
          setRemainingLockoutSeconds(0);
          AsyncStorage.removeItem('studentLoginAttempts').catch(() => {});
          setError(null);
        }
      };
      updateRemaining();
      interval = setInterval(updateRemaining, 1000);
      return () => clearInterval(interval);
    } else if (lockoutUntil && lockoutUntil <= Date.now()) {
      setLockoutUntil(null);
      setFailedAttempts(0);
      setRemainingLockoutSeconds(0);
      AsyncStorage.removeItem('studentLoginAttempts').catch(() => {});
      setError(null);
    }
  }, [lockoutUntil]);

  useEffect(() => {
    if (lockoutUntil && lockoutUntil > Date.now() && remainingLockoutSeconds > 0) {
      setError(`Too many failed attempts. Please wait ${remainingLockoutSeconds} second${remainingLockoutSeconds !== 1 ? 's' : ''} before trying again.`);
    }
  }, [remainingLockoutSeconds, lockoutUntil]);

  const handleFailedAttempt = (errorMessage: string) => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    if (newAttempts >= 3) {
      const lockoutTime = Date.now() + 60 * 1000;
      setLockoutUntil(lockoutTime);
      setRemainingLockoutSeconds(60);
      saveLockoutState(newAttempts, lockoutTime).catch(() => {});
      setError(`Too many failed attempts. Please wait 60 seconds before trying again.`);
    } else {
      setError(`${errorMessage} ${3 - newAttempts} attempt(s) remaining.`);
    }
    Alert.alert("Login Failed", errorMessage);
  };

  const handleForgotPassword = async () => {
    if (!forgotUsername.trim()) {
      setForgotMessage("Please enter your username");
      return;
    }

    setForgotLoading(true);
    setForgotMessage(null);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', forgotUsername.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setForgotMessage("Username not found");
        setForgotLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;

      if (!email) {
        setForgotMessage("No email address associated with this account. Please contact support.");
        setForgotLoading(false);
        return;
      }

      if (!isValidEmail(email)) {
        setForgotMessage("The email address on file is invalid. Please contact support.");
        setForgotLoading(false);
        return;
      }

      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);

      setForgotMessage("✓ Password reset email sent! Check your inbox.");
      setForgotLoading(false);

      setTimeout(() => {
        setForgotModalVisible(false);
        setForgotUsername("");
        setForgotMessage(null);
      }, 2000);

    } catch (error: any) {
      let errorMessage = "Failed to send reset email. Please try again later.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with that email. Please contact support.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address. Please contact support.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      }
      setForgotMessage(errorMessage);
      setForgotLoading(false);
    }
  };

  const handleLogin = async () => {
    if (busy || isLockedOut) return;
    setError(null);

    // Check lockout
    if (lockoutUntil && lockoutUntil > Date.now()) {
      return;
    } else if (lockoutUntil && lockoutUntil <= Date.now()) {
      // Reset lockout if expired
      setLockoutUntil(null);
      setFailedAttempts(0);
      setRemainingLockoutSeconds(0);
      AsyncStorage.removeItem('studentLoginAttempts').catch(() => {});
    }

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setBusy(true);
    setLoadingMessage("Verifying credentials");

    try {
      setLoadingMessage("Checking user account");
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setBusy(false);
        handleFailedAttempt("Invalid username or password");
        return;
      }

      const userDoc  = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role === "main_admin") {
        setBusy(false);
        setError("Main administrators must use the Admin Portal");
        Alert.alert(
          "Access Denied",
          "Main administrators must login through the Admin Portal.\n\nPlease visit: /super-admin-login"
        );
        return;
      }

      setLoadingMessage("Authenticating");
      const loggedInUser = await login(userData.email, password);

      let targetRoute = "/student";
      if (loggedInUser.role === "assistant_admin") targetRoute = "/assistant_admin";

      setFailedAttempts(0);
      setLockoutUntil(null);
      setRemainingLockoutSeconds(0);
      setError(null);
      AsyncStorage.removeItem('studentLoginAttempts').catch(() => {});
      setLoadingMessage("Redirecting to dashboard...");
      setTimeout(() => {
        router.replace(targetRoute as any);
      }, 300);

    } catch (err: any) {
      setBusy(false);
      
      let errorMessage = "Invalid username or password. Please try again.";

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password"     ||
        err.code === "auth/user-not-found"
      ) {
        errorMessage = "Invalid username or password";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }

      handleFailedAttempt(errorMessage);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Forgot Password Modal */}
      <Modal
        transparent
        visible={forgotModalVisible}
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
          <View style={[{ width: '80%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }]}>
            <Text style={[{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' }]}>Reset Password</Text>
            <Text style={[{ fontSize: 14, color: '#64748b', marginBottom: 20, textAlign: 'center' }]}>
              Enter your username to receive a password reset email.
            </Text>
            <TextInput
              style={[{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1e293b', backgroundColor: '#f8fafc', marginBottom: 12 }]}
              placeholder="Username"
              placeholderTextColor="#94a3b8"
              value={forgotUsername}
              onChangeText={setForgotUsername}
              autoCapitalize="none"
              editable={!forgotLoading}
            />
            {forgotMessage && (
              <Text style={[{ color: forgotMessage.startsWith('✓') ? '#10b981' : '#ef4444', fontSize: 12, marginBottom: 16, textAlign: 'center' }]}>
                {forgotMessage}
              </Text>
            )}
            <View style={[{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }]}>
              <TouchableOpacity
                style={[{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' }]}
                onPress={() => {
                  setForgotModalVisible(false);
                  setForgotMessage(null);
                  setForgotUsername("");
                }}
                disabled={forgotLoading}
              >
                <Text style={[{ color: '#64748b', fontWeight: '600' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#0ea5e9', opacity: forgotLoading ? 0.6 : 1 }]}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[{ color: '#fff', fontWeight: '600' }]}>Send Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={LoginStyles.root}>

        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={LoginStyles.header}
        >
          <View style={LoginStyles.statusBarSpacer} />

          <View style={LoginStyles.logoWrapper}>
            <View style={LoginStyles.logoGlow}>
              <Image
                source={require("../assets/images/Logo/TMC_Connect.png")}
                style={LoginStyles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={LoginStyles.appName}>TMC Connect</Text>
          </View>
        </LinearGradient>

        {/* ── Form area ─────────────────────────────────────────── */}
        <KeyboardAvoidingView
          style={LoginStyles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={LoginStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View style={LoginStyles.titleRow}>
              <Text>
                <Text style={LoginStyles.title}>Welcome </Text>
                <Text style={LoginStyles.titleAccent}>Back</Text>
                <Text style={LoginStyles.title}>!</Text>
              </Text>
            </View>
            <Text style={LoginStyles.subtitle}>
              Sign in to continue to TMC Campus Hub
            </Text>

            {/* Username input */}
            <View
              style={[
                LoginStyles.inputWrapper,
                usernameFocused && LoginStyles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={usernameFocused ? COLORS.gradientStart : COLORS.iconTint}
                style={LoginStyles.inputIcon}
              />
              <TextInput
                placeholder="Username"
                placeholderTextColor={COLORS.placeholderGray}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (error) setError(null);
                }}
                style={LoginStyles.input}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                editable={!isLoading && !isLockedOut}
              />
              {username.length > 0 && (
                <Ionicons name="checkmark-circle" size={18} color={COLORS.gradientStart} />
              )}
            </View>

            {/* Password input */}
            <View
              style={[
                LoginStyles.inputWrapper,
                passwordFocused && LoginStyles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? COLORS.gradientStart : COLORS.iconTint}
                style={LoginStyles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                placeholder="Password"
                placeholderTextColor={COLORS.placeholderGray}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError(null);
                }}
                style={[LoginStyles.input, { flex: 1 }]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                editable={!isLoading && !isLockedOut}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                style={LoginStyles.eyeButton}
                disabled={isLoading || !!isLockedOut}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={passwordFocused ? COLORS.gradientStart : COLORS.iconTint}
                />
              </TouchableOpacity>
            </View>

            {/* Error banner */}
            {error ? (
              <View style={LoginStyles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.errorRed} />
                <Text style={LoginStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign In button */}
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                LoginStyles.buttonGradient,
                isLoading && LoginStyles.buttonDisabled,
              ]}
            >
              <TouchableOpacity
                style={LoginStyles.button}
                onPress={handleLogin}
                disabled={isLoading || !!isLockedOut}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={LoginStyles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            {/* Forgot password */}
            <TouchableOpacity
              style={LoginStyles.forgotRow}
              onPress={() => setForgotModalVisible(true)}
              disabled={isLoading || !!isLockedOut}
            >
              <Text style={LoginStyles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={LoginStyles.dividerRow}>
              <View style={LoginStyles.dividerLine} />
              <Text style={LoginStyles.dividerLabel}>Secure Login</Text>
              <View style={LoginStyles.dividerLine} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Modal transparent visible={isLoading} animationType="fade">
        <LoadingScreen
          message={loadingMessage || "Signing you in..."}
          subMessage="Please wait while we prepare your dashboard"
        />
      </Modal>
    </>
  );
}