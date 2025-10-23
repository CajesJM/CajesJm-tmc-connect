import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./context/AuthContext";
import { LandingStyles } from "./styles/LandingStyles";

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated, userData } = useAuth();
  const { width, height } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAuthenticated) {
      if (userData?.role === 'admin') {
        router.replace('/admin/(tabs)/announcements');
      } else {
        router.replace('/student/(tabs)/announcements');
      }
    }

  
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [isAuthenticated, userData]);

  const handleNavigateToLogin = () => {
    router.push("/login"); 
  };

  return (
    <SafeAreaView style={LandingStyles.container}>
 
      <View style={[LandingStyles.cosmicBg, { height: height * 0.8 }]} />
      <View style={[LandingStyles.nebulaBg, { height: height * 0.8 }]} />
      

      <View style={LandingStyles.particle1} />
      <View style={LandingStyles.particle2} />
      <View style={LandingStyles.particle3} />

 
      <Animated.View 
        style={[
          LandingStyles.orbPrimary,
          { transform: [{ translateY: floatAnim }] }
        ]} 
      />
      <Animated.View 
        style={[
          LandingStyles.orbSecondary,
          { transform: [{ translateY: Animated.multiply(floatAnim, -1) }] }
        ]} 
      />
      <View style={LandingStyles.orbTertiary} />

   
      <View style={LandingStyles.gridOverlay} />

   
      <Animated.View 
        style={[
          LandingStyles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={LandingStyles.contentGlow} />
        
     
        <Text style={LandingStyles.welcomeText}>WELCOME TO</Text>
        
      
        <Text style={LandingStyles.brand}>TMC Connect</Text>
        
      
        <View style={LandingStyles.subtitleContainer}>
          <Text style={LandingStyles.subtitleLine}>Your campus hub for</Text>
          <Text style={LandingStyles.subtitleLine}>announcements, events,</Text>
          <Text style={LandingStyles.subtitleLine}>and attendance</Text>
          <View style={LandingStyles.accentLine} />
        </View>

      
        <Animated.View 
          style={[
            LandingStyles.buttonContainer,
            { transform: [{ scale: fadeAnim }] }
          ]}
        >
          <View style={LandingStyles.buttonGlow} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNavigateToLogin}
            style={LandingStyles.button}
          >
            <Text style={LandingStyles.buttonText}>GET STARTED</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}