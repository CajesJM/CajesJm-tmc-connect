import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./context/AuthContext";

export default function HomeRedirect() {
  const router = useRouter();
  const { isAuthenticated, role, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        if (role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/student");
        }
      } else {
        router.replace("/landing"); 
      }
    }
  }, [loading, isAuthenticated, role, router]);

  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
