import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "./context/AuthContext";

export default function Login() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (role !== "admin" && role !== "student") {
      Alert.alert("Invalid role", "Redirecting to landing...");
      router.replace("/");
    }
  }, [role]);

  const handleLogin = async () => {
    if (busy) return;
    setError(null);

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setBusy(true);
    try {
      const validAdmin = username === "admin" && password === "admin123";
      const validStudent = username === "student" && password === "student123";

      if (
        (role === "admin" && validAdmin) ||
        (role === "student" && validStudent)
      ) {
        await login(role);
        router.replace(`/${role}`);
      } else {
        setError("Invalid username or password");
        Alert.alert("Login Failed", "Invalid username or password");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      Alert.alert("Login Error", err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const isAdmin = role === "admin";
  const accentColor = isAdmin ? "#1E88E5" : "#2E7D32";

  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.headerBg, { backgroundColor: accentColor }]} />
      <View style={styles.card}>
        <Text style={[styles.title, { color: accentColor }]}>
          {isAdmin ? "Admin" : "Student"} Login
        </Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={(v) => {
            setUsername(v);
            setError(null);
          }}
          style={styles.input}
          autoCapitalize="none"
        />

        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            style={styles.inputWithIcon}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword((s) => !s)}
            style={styles.iconBtn}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Text style={styles.icon}>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: accentColor, shadowColor: accentColor }, busy && styles.disabled]}
          onPress={handleLogin}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F1F8E9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  headerBg: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "35%",
    borderBottomRightRadius: 120,
  },
  card: {
    width: width > 400 ? "85%" : "95%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: "#fafafa",
    fontSize: 16,
  },
  inputWrap: {
    position: "relative",
    marginBottom: 14,
  },
  inputWithIcon: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 44,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    fontSize: 16,
  },
  iconBtn: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },
  icon: {
    fontSize: 18,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  disabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  error: {
    color: "#D32F2F",
    marginBottom: 10,
    textAlign: "center",
  },
});
