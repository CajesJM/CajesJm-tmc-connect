import { Stack } from "expo-router";
import { ActivityIndicator, LogBox, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

LogBox.ignoreLogs([
  'Invalid DOM property',
  'Unknown event handler property',
]);
function RootLayoutContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="super-admin-login" /> 
      <Stack.Screen name="assistant_admin" />
      <Stack.Screen name="main_admin" />
      <Stack.Screen name="student" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}