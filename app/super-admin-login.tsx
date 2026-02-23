import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from "../context/AuthContext";
import { db } from '../lib/firebaseConfig';
import { styles } from '../styles/SuperAdminLogin';

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


  const usernameAnim = useRef(new Animated.Value(username ? 1 : 0)).current;
  const passwordAnim = useRef(new Animated.Value(password ? 1 : 0)).current;
  const animationDuration = 180;

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

  const forceLabelsUp = () => {
    if (username) animateLabel(usernameAnim, 1);
    if (password) animateLabel(passwordAnim, 1);
  };

  const handleLogin = async () => {
   
    forceLabelsUp();
    
    if (busy || authLoading) return;
    setError(null);

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setBusy(true);
    setLoadingMessage("Verifying credentials");
    
    try {
      console.log("Super Admin login attempt:", username);
      
      setLoadingMessage("Checking user account");
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid username or password");
        Alert.alert("Login Failed", "Invalid username or password");
        setBusy(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      setLoadingMessage("Verifying admin privileges");
      if (userData.role !== 'main_admin') {
        setError("Access denied. This portal is for administrators only.");
        Alert.alert("Access Denied", "This portal is for Main Administrators only");
        setBusy(false);
        return;
      }

      setLoadingMessage("Authenticating");
      const loggedInUser = await login(userData.email, password);
      
      setLoadingMessage("Access granted! Loading dashboard");

      setTimeout(() => {
        router.replace('/main_admin');
      }, 1500);
      
    } catch (err: any) {
      console.log("Login error:", err.message);
      let errorMessage = "Invalid username or password";
      setError(errorMessage);
      Alert.alert("Login Failed", errorMessage);
    } finally {

      if (!busy) {
        setTimeout(() => {
          setBusy(false);
          setLoadingMessage("");
        }, 1000);
      }
    }
  };

  const isLoading = busy || authLoading;

  const usernameLabelStyle = {
    transform: [
      {
        translateY: usernameAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -24],
        }),
      },
      {
        scale: usernameAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.85],
        }),
      },
    ],
  };

  const passwordLabelStyle = {
    transform: [
      {
        translateY: passwordAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -24],
        }),
      },
      {
        scale: passwordAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.85],
        }),
      },
    ],
  };

  return (
    <View style={styles.background}>
      <StatusBar barStyle="light-content" />
      <Image 
        source={require('../assets/images/background/superadmin-bg.jpg')} 
        style={styles.backgroundImage}
      />
      
      <Modal
        transparent={true}
        visible={isLoading}
        animationType="fade"
      >
        <LoadingScreen 
          message={loadingMessage || "Loading Dashboard"}
          subMessage="Please wait while we prepare your workspace"
        />
      </Modal>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/Logo/TMC_Connect.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Administrator Portal</Text>
            <Text style={styles.subtitle}>Secure access for main administrators only</Text>

            <View style={[styles.inputContainer, styles.floatingLabelContainer, isLoading && styles.inputDisabled]}>
              <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.9)" style={styles.inputIcon} />
              <View style={styles.floatingLabelWrapper}>
                <Animated.Text style={[styles.floatingLabel, usernameLabelStyle]}>
                  Username
                </Animated.Text>
                <TextInput
                  placeholder=""
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={username}
                  onChangeText={setUsername}
                  style={[styles.input, styles.inputWithIcon]}
                  autoCapitalize="none"
                  editable={!isLoading}
                  onFocus={() => animateLabel(usernameAnim, 1)}
                  onBlur={() => {
                    if (!username) animateLabel(usernameAnim, 0);
                  }}
                  accessibilityLabel="Username input field"
                  accessibilityHint="Enter your username"
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.floatingLabelContainer, isLoading && styles.inputDisabled]}>
              <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.9)" style={styles.inputIcon} />
              <View style={styles.floatingLabelWrapper}>
                <Animated.Text style={[styles.floatingLabel, passwordLabelStyle]}>
                  Password
                </Animated.Text>
                <TextInput
                  placeholder=""
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, styles.inputWithIcon]}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  onFocus={() => animateLabel(passwordAnim, 1)}
                  onBlur={() => {
                    if (!password) animateLabel(passwordAnim, 0);
                  }}
                  accessibilityLabel="Password input field"
                  accessibilityHint="Enter your password"
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="rgba(255, 255, 255, 0.9)" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setKeepLoggedIn(!keepLoggedIn)}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, keepLoggedIn && styles.checkboxChecked]}>
                {keepLoggedIn && <Ionicons name="checkmark" size={16} color="#000" />}
              </View>
              <Text style={styles.checkboxLabel}>Keep me logged in</Text>
            </TouchableOpacity>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, (isLoading) && styles.disabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>LOGIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert("Reset Password", "Please contact IT support")}
              style={styles.forgotLink}
              disabled={isLoading}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.backLink}
              disabled={isLoading}
            >
              <Text style={styles.backLinkText}>← Back to User Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}