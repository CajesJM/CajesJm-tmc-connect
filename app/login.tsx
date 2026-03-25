import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import LoadingScreen from '../components/LoadingScreen'; // <-- Import the shared component
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
  const [loadingMessage, setLoadingMessage] = useState<string>("");  // <-- new state

  // Combine local busy with auth loading
  const isLoading = busy || loading;

  const handleLogin = async () => {
    if (busy) return;
    setError(null);

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setBusy(true);
    setLoadingMessage("Verifying credentials");

    try {
      console.log("Looking up username:", username);

      setLoadingMessage("Checking user account");
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

      setLoadingMessage("Authenticating");
      const loggedInUser = await login(userData.email, password);

      console.log("Login successful. User role:", loggedInUser.role);

      let targetRoute = '/student';

      if (loggedInUser.role === 'assistant_admin') {
        targetRoute = '/assistant_admin';
      }

      console.log("Redirecting to:", targetRoute);

      setLoadingMessage("Redirecting to dashboard...");
      // Short delay to show the loading screen before redirect
      setTimeout(() => {
        router.replace(targetRoute as any);
      }, 300);  // Keep original delay

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
      // Clear busy state only after redirect if needed, otherwise keep it until modal closes
      // The redirect will unmount this screen anyway, so we don't need to setBusy(false) here.
      // But to avoid a state update on an unmounted component, we can set it false after a short delay.
      // Since redirect may happen after the setTimeout, we'll delay resetting busy.
      setTimeout(() => {
        if (busy) setBusy(false);
      }, 500);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../assets/images/background/tmc.jpg')}
        style={LoginStyles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay for better text readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.65)']}
          style={LoginStyles.overlay}
        />

        <KeyboardAvoidingView
          style={LoginStyles.outerContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <ScrollView
            contentContainerStyle={LoginStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={LoginStyles.card}>
              {/* Animated Logo Container */}
              <View style={LoginStyles.logoContainer}>
                <View style={LoginStyles.logoGlow}>
                  <Image
                    source={require('../assets/images/Logo/TMC_Connect.png')}
                    style={LoginStyles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={LoginStyles.title}>Welcome Back</Text>
              <Text style={LoginStyles.subtitle}>Sign in to continue to TMC Campus Hub</Text>

              {/* Username Input */}
              <View style={LoginStyles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" style={LoginStyles.inputIcon} />
                <TextInput
                  placeholder="Username"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (error) setError(null);
                  }}
                  style={LoginStyles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View style={LoginStyles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={LoginStyles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  style={[LoginStyles.input, { flex: 1 }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  style={LoginStyles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={LoginStyles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={18} color="#FF6B6B" />
                  <Text style={LoginStyles.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[LoginStyles.button, (isLoading) && LoginStyles.disabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={LoginStyles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Optional: Forgot Password Link */}
              <TouchableOpacity
                style={LoginStyles.forgotPassword}
                onPress={() => Alert.alert("Forgot Password", "Please contact your administrator")}
                disabled={isLoading}
              >
                <Text style={LoginStyles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Decorative Elements */}
              <View style={LoginStyles.decorativeLine}>
                <View style={LoginStyles.line} />
                <Text style={LoginStyles.decorativeText}>Secure Login</Text>
                <View style={LoginStyles.line} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* Loading Modal */}
      <Modal
        transparent={true}
        visible={isLoading}
        animationType="fade"
      >
        <LoadingScreen
          message={loadingMessage || "Signing you in..."}
          subMessage="Please wait while we prepare your dashboard"
        />
      </Modal>
    </>
  );
}