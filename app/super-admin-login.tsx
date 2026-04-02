import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from "../context/AuthContext";
import { db } from '../lib/firebaseConfig';
import { styles } from '../styles/SuperAdminLogin';

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '20%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
  },
  cancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  success: {
    color: '#10b981',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default function SuperAdminLogin() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Lockout state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);

  const usernameAnim = useRef(new Animated.Value(username ? 1 : 0)).current;
  const passwordAnim = useRef(new Animated.Value(password ? 1 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const animationDuration = 180;

  const saveLockoutState = (attempts: number, lockoutTime: number | null) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('superAdminLoginAttempts', JSON.stringify({
        failedAttempts: attempts,
        lockoutUntil: lockoutTime,
      }));
    }
  };

  const restoreLockoutState = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('superAdminLoginAttempts');
      if (stored) {
        try {
          const { failedAttempts: storedAttempts, lockoutUntil: storedLockout } = JSON.parse(stored);
          if (storedLockout && storedLockout > Date.now()) {
            setFailedAttempts(storedAttempts);
            setLockoutUntil(storedLockout);
          } else {
            localStorage.removeItem('superAdminLoginAttempts');
            setFailedAttempts(0);
            setLockoutUntil(null);
          }
        } catch (e) {
          console.error('Failed to restore lockout state:', e);
          localStorage.removeItem('superAdminLoginAttempts');
        }
      }
    }
  };

  useEffect(() => {
    restoreLockoutState();
  }, []);

  const animateLabel = (animValue: Animated.Value, toValue: number) => {
    Animated.timing(animValue, {
      toValue,
      duration: animationDuration,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    animateLabel(usernameAnim, username ? 1 : 0);
  }, [username]);

  useEffect(() => {
    animateLabel(passwordAnim, password ? 1 : 0);
  }, [password]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
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
          localStorage.removeItem('superAdminLoginAttempts');
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
      localStorage.removeItem('superAdminLoginAttempts');
      setError(null);
    }
  }, [lockoutUntil]);

  useEffect(() => {
    if (lockoutUntil && lockoutUntil > Date.now() && remainingLockoutSeconds > 0) {
      setError(`Too many failed attempts. Please wait ${remainingLockoutSeconds} second${remainingLockoutSeconds !== 1 ? 's' : ''} before trying again.`);
    }
  }, [remainingLockoutSeconds, lockoutUntil]);

  const forceLabelsUp = () => {
    if (username) animateLabel(usernameAnim, 1);
    if (password) animateLabel(passwordAnim, 1);
  };

  const handleLogin = async () => {
    forceLabelsUp();
    if (busy || authLoading) return;
    setError(null);

    // Check lockout
    if (lockoutUntil && lockoutUntil > Date.now()) {
      return;
    } else if (lockoutUntil && lockoutUntil <= Date.now()) {
      // Reset lockout if expired
      setLockoutUntil(null);
      setFailedAttempts(0);
      setRemainingLockoutSeconds(0);
      localStorage.removeItem('superAdminLoginAttempts');
    }

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setBusy(true);
    setLoadingMessage("Verifying credentials");

    try {
      // 1. Check username in Firestore
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid username or password");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role !== 'main_admin') {
        throw new Error("Access denied. This portal is for administrators only.");
      }

      // 2. Attempt Firebase login
      await login(userData.email, password);

      // 3. Success: reset attempts & lockout, navigate
      setFailedAttempts(0);
      setLockoutUntil(null);
      setRemainingLockoutSeconds(0);
      setError(null);
      localStorage.removeItem('superAdminLoginAttempts');
      setLoadingMessage("Access granted! Loading dashboard");
      try {
        await router.replace('/main_admin');
      } catch (navError) {
        console.error("Navigation error:", navError);
        setError("Unable to open the dashboard. Please restart the app.");
        setBusy(false);
      }
    } catch (err: any) {
      console.log("Login error:", err.message);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 3) {

        const lockoutTime = Date.now() + 60 * 1000;
        setLockoutUntil(lockoutTime);
        setRemainingLockoutSeconds(60);
        saveLockoutState(newAttempts, lockoutTime);
        setError(`Too many failed attempts. Please wait 60 seconds before trying again.`);
      } else {
        setError(`Invalid username or password. ${3 - newAttempts} attempt(s) remaining.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
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

      if (userData.role !== 'main_admin') {
        setForgotMessage("This account does not have admin privileges.");
        setForgotLoading(false);
        return;
      }

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
      console.error("Forgot password error:", error);
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

  const isLoading = busy || authLoading;
  const isLockedOut = lockoutUntil && lockoutUntil > Date.now();

  const usernameLabelStyle = {
    transform: [
      { translateY: usernameAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) },
      { scale: usernameAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) },
    ],
  };

  const passwordLabelStyle = {
    transform: [
      { translateY: passwordAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) },
      { scale: passwordAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) },
    ],
  };

  const features = [
    { icon: "people-outline" as const, label: "User Management" },
    { icon: "calendar-outline" as const, label: "Event Scheduler" },
    { icon: "megaphone-outline" as const, label: "Announcements" },
    { icon: "checkmark-circle-outline" as const, label: "Attendance" },
    { icon: "bar-chart-outline" as const, label: "Analytics" },
    { icon: "shield-checkmark-outline" as const, label: "Admin Controls" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar barStyle="light-content" />

      {/* Loading Modal */}
      <Modal transparent visible={isLoading} animationType="fade">
        <LoadingScreen
          message={loadingMessage || "Loading Dashboard"}
          subMessage="Please wait while we prepare your workspace"
        />
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        transparent
        visible={forgotModalVisible}
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>Reset Password</Text>
            <Text style={modalStyles.subtitle}>
              Enter your username to receive a password reset email.
            </Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Username"
              placeholderTextColor="#94a3b8"
              value={forgotUsername}
              onChangeText={setForgotUsername}
              autoCapitalize="none"
              editable={!forgotLoading}
            />
            {forgotMessage && (
              <Text style={[
                modalStyles.error,
                forgotMessage.startsWith('✓') && modalStyles.success
              ]}>
                {forgotMessage}
              </Text>
            )}
            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={() => {
                  setForgotModalVisible(false);
                  setForgotMessage(null);
                  setForgotUsername("");
                }}
                disabled={forgotLoading}
              >
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalStyles.button,
                  modalStyles.submitButton,
                  forgotLoading && modalStyles.disabled,
                ]}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={modalStyles.submitText}>Send Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>

          {/* LEFT COLUMN */}
          <LinearGradient
            colors={['#0a2b4a', '#1e4a76', '#3182ce']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.leftColumn, { flex: 1.15 }]}
          >
            <View style={{
              position: 'absolute', top: -80, right: -80,
              width: 360, height: 360, borderRadius: 180,
              backgroundColor: 'rgba(14,165,233,0.06)',
            }} />
            <View style={{
              position: 'absolute', bottom: -60, left: -40,
              width: 260, height: 260, borderRadius: 130,
              backgroundColor: 'rgba(14,165,233,0.04)',
            }} />

            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/Logo/TMC_Connect.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.logoText}>TMC Connect</Text>
                <Text style={styles.logoSub}>Admin Portal</Text>
              </View>
            </View>

            <View style={styles.headlineTag}>
              <View style={styles.headlineTagDot} />
              <Text style={styles.headlineTagText}>Main Administrator</Text>
            </View>

            <Text style={styles.welcomeTitle}>
              Manage your{'\n'}
              <Text style={styles.welcomeTitleAccent}>organization</Text>
              {'\n'}from one place.
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Access the full administrative suite — oversee users, events, announcements, attendance, and system-wide approvals.
            </Text>

            <View style={styles.featuresGrid}>
              {features.map((item, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Ionicons name={item.icon} size={15} color="#0ea5e9" />
                  </View>
                  <Text style={styles.featureLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <Animated.View
            style={[
              styles.rightColumn,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.card}>

              <View style={styles.cardHeader}>
                <View style={styles.cardBadge}>
                  <View style={styles.cardBadgeIcon}>
                    <Ionicons name="shield-checkmark" size={14} color="#0ea5e9" />
                  </View>
                  <Text style={styles.cardBadgeText}>Secure Access</Text>
                </View>
                <Text style={styles.title}>Administrator Login</Text>
                <Text style={styles.subtitle}>Restricted to main administrators only</Text>
              </View>

              <View style={styles.divider} />

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={[
                  styles.inputContainer,
                  usernameFocused && styles.inputContainerFocused,
                ]}>
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color={usernameFocused ? '#0ea5e9' : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <View style={styles.floatingLabelWrapper}>
                    <Animated.Text style={[styles.floatingLabel, usernameLabelStyle]}>
                      Enter your username
                    </Animated.Text>
                    <TextInput
                      placeholder=""
                      placeholderTextColor="transparent"
                      value={username}
                      onChangeText={setUsername}
                      style={[styles.input, styles.inputWithIcon]}
                      autoCapitalize="none"
                      editable={!isLoading && !isLockedOut}
                      onFocus={() => {
                        setUsernameFocused(true);
                        animateLabel(usernameAnim, 1);
                      }}
                      onBlur={() => {
                        setUsernameFocused(false);
                        if (!username) animateLabel(usernameAnim, 0);
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused,
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={17}
                    color={passwordFocused ? '#0ea5e9' : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <View style={styles.floatingLabelWrapper}>
                    <Animated.Text style={[styles.floatingLabel, passwordLabelStyle]}>
                      Enter your password
                    </Animated.Text>
                    <TextInput
                      placeholder=""
                      placeholderTextColor="transparent"
                      value={password}
                      onChangeText={setPassword}
                      style={[styles.input, styles.inputWithIcon]}
                      secureTextEntry={!showPassword}
                      editable={!isLoading && !isLockedOut}
                      onFocus={() => {
                        setPasswordFocused(true);
                        animateLabel(passwordAnim, 1);
                      }}
                      onBlur={() => {
                        setPasswordFocused(false);
                        if (!password) animateLabel(passwordAnim, 0);
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    disabled={isLoading || !!isLockedOut}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={passwordFocused ? '#0ea5e9' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setKeepLoggedIn(!keepLoggedIn)}
                  disabled={isLoading || !!isLockedOut}
                >
                  <View style={[styles.checkbox, keepLoggedIn && styles.checkboxChecked]}>
                    {keepLoggedIn && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Keep me logged in</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setForgotModalVisible(true)}
                  disabled={isLoading || !!isLockedOut}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, (isLoading || !!isLockedOut) && styles.disabled]}
                onPress={handleLogin}
                disabled={isLoading || !!isLockedOut}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={18} color="#ffffff" />
                <Text style={styles.buttonText}>Sign In to Dashboard</Text>
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <TouchableOpacity
                  onPress={() => router.push('/login')}
                  style={styles.backLink}
                  disabled={isLoading || !!isLockedOut}
                >
                  <Text style={styles.backLinkText}>← Back to User Login</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.securityNote}>
                <Ionicons name="lock-closed" size={11} color="#94a3b8" />
                <Text style={styles.securityNoteText}>
                  Secured with end-to-end encryption · TMC Connect v2
                </Text>
              </View>

            </View>
          </Animated.View>

        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}