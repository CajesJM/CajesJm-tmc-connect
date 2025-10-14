import { Stack, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";


export default function AdminLayout() {
  const router = useRouter();
  const { role, loading } = useAuth();
  const didRedirectRef = React.useRef(false);

  React.useEffect(() => {
    if (loading) return;
    if (didRedirectRef.current) return;

    const currentRaw = (router as any).pathname ?? (router as any).asPath ?? "";
    const normalized = String(currentRaw).toLowerCase();

    // allow login page
    const isLoginPage = normalized.startsWith("/admin/login");

    if (role !== "admin" && !isLoginPage) {
      didRedirectRef.current = true;
      try {
        router.replace("/admin/login");
      } catch (err) {
        console.warn("admin redirect failed", err);
      }
    }
  }, [loading, role, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
  <Stack screenOptions={{ headerShown: true }}>
    {/* hide header for admin/login */}
    <Stack.Screen name="login" options={{ headerShown: false }} />

    {/* keep header hidden for these admin screens too (add or remove as needed) */}
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="announcement/index" options={{ headerShown: false }} />
    <Stack.Screen name="announcement/create" options={{ headerShown: false }} />
    <Stack.Screen name="announcement/[id]" options={{ headerShown: false }} />
  </Stack>
);
}