import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "./context/AuthContext";
import { LoginStyles } from "./styles/LoginStyles";

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (busy) return;
    setError(null);

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setBusy(true);
    try {
      const loginEmail = username.includes("@") ? username : `${username}@tmc.edu`;
      await login(loginEmail, password);
    } catch (err: any) {
      console.log("Login error:", err.message);
      const errorMessage = "Invalid username or password. Please try again.";
      setError(errorMessage);
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={LoginStyles.outerContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={LoginStyles.cosmicBg} />
      <View style={LoginStyles.nebulaBg} />

      <View style={LoginStyles.card}>
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
          />
          <TouchableOpacity
            onPress={() => setShowPassword((s) => !s)}
            style={LoginStyles.iconBtn}
          >
            <Text style={LoginStyles.icon}>{showPassword ? "🙈" : "👁️"}</Text>
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

        <View style={LoginStyles.demoAccounts}>
          <Text style={LoginStyles.demoTitle}>Demo Accounts:</Text>
          <Text style={LoginStyles.demoText}>Admin: admin / admin123</Text>
          <Text style={LoginStyles.demoText}>Student: john.cajes / 2024001</Text>
          <Text style={LoginStyles.demoNote}>Format: username / password</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
