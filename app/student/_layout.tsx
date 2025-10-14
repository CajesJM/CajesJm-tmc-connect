// app/student/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";


function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const target = isAuthenticated ? (role === "admin" ? "/admin" : "/student") : "/";

    // try a few router props for compatibility
    const currentRaw =
      (router as any).pathname ?? (router as any).asPath ?? (router as any).route ?? "";

    if (!currentRaw) return;

    // if we're already inside the target route (including nested routes) do nothing
    const normalized = String(currentRaw).toLowerCase();
    const isInTarget =
      (target === "/" && normalized === "/") || normalized.startsWith(target.toLowerCase());

    if (!isInTarget) {
      try {
        router.replace(target);
      } catch (err) {
        console.warn("router.replace failed", err);
      }
    }
  }, [loading, isAuthenticated, role, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function StudentLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}