import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./context/AuthContext";
import { LandingStyles } from "./styles/LandingStyles";

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated, userData } = useAuth();
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (isAuthenticated) {
      if (userData?.role === "admin") {
        router.replace("/admin/(tabs)/announcements");
      } else {
        router.replace("/student/(tabs)/announcements");
      }
    }
  }, [isAuthenticated, userData]);

  const handleNavigateToLogin = () => {
    router.push("/login");
  };

  return (
    <SafeAreaView style={LandingStyles.container}>
      {/* Simple background layers */}
      <View style={[LandingStyles.cosmicBg, { height: height * 0.8 }]} />
      <View style={[LandingStyles.nebulaBg, { height: height * 0.8 }]} />

      {/* Content */}
      <View style={LandingStyles.content}>
        <Text style={LandingStyles.welcomeText}>WELCOME TO</Text>
        <Text style={LandingStyles.brand}>TMC Connect</Text>

        <View style={LandingStyles.subtitleContainer}>
          <Text style={LandingStyles.subtitleLine}>Your campus hub for</Text>
          <Text style={LandingStyles.subtitleLine}>announcements, events,</Text>
          <Text style={LandingStyles.subtitleLine}>and attendance</Text>
          <View style={LandingStyles.accentLine} />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNavigateToLogin}
          style={LandingStyles.button}
        >
          <Text style={LandingStyles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
