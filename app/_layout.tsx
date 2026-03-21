import { Stack } from "expo-router";
import { ActivityIndicator, LogBox, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

LogBox.ignoreLogs([
  'Invalid DOM property',
  'Unknown event handler property',
]);

function RootLayoutContent() {
  const { loading } = useAuth();
  const { colors } = useTheme(); 

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }, 
      }}
    >
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
    <ThemeProvider> 
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </ThemeProvider>
  );
}