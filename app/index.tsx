import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { LandingStyles } from "../styles/LandingStyles";

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated, userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entranceComplete, setEntranceComplete] = useState(false);
  
  //intervals and timeouts
  const progressIntervalRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const entranceTimerRef = useRef<number | null>(null);

  // Animation values 
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;
  const orb3Anim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoMove = useRef(new Animated.Value(0)).current;

  const resetAnimations = useCallback(() => {
    // Stop all animations
    entranceAnim.stopAnimation();
    contentOpacity.stopAnimation();
    contentScale.stopAnimation();
    logoOpacity.stopAnimation();
    logoRotate.stopAnimation();
    orb1Anim.stopAnimation();
    orb2Anim.stopAnimation();
    orb3Anim.stopAnimation();
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    logoScale.stopAnimation();
    logoMove.stopAnimation();

    entranceAnim.setValue(0);
    contentOpacity.setValue(0);
    contentScale.setValue(0.8);
    logoOpacity.setValue(0);
    logoRotate.setValue(0);
    orb1Anim.setValue(0);
    orb2Anim.setValue(0);
    orb3Anim.setValue(0);
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    logoScale.setValue(1);
    logoMove.setValue(0);
    
    setIsAnimating(false);
    setProgress(0);
    setEntranceComplete(false);
    
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (transitionTimerRef.current !== null) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (entranceTimerRef.current !== null) {
      clearTimeout(entranceTimerRef.current);
      entranceTimerRef.current = null;
    }
  }, [
    entranceAnim, contentOpacity, contentScale, logoOpacity, logoRotate,
    orb1Anim, orb2Anim, orb3Anim, fadeAnim, slideAnim, logoScale, logoMove
  ]);

  const playEntranceAnimation = useCallback(() => {
  
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(orb1Anim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: false,
      }),
      Animated.timing(orb2Anim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: false,
      }),
      Animated.timing(orb3Anim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: false,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: false,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: false,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        delay: 600,
        useNativeDriver: false,
      }),
      Animated.timing(contentScale, {
        toValue: 1,
        duration: 800,
        delay: 600,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setEntranceComplete(true);
      startAutoTransition();
    });
  }, [entranceAnim, orb1Anim, orb2Anim, orb3Anim, logoOpacity, logoRotate, contentOpacity, contentScale]);

  const startAutoTransition = useCallback(() => {
    if (isAnimating) return;
    
    setProgress(0);
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / 30;
        if (newProgress >= 100) {
          if (progressIntervalRef.current !== null) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 100;
        }
        return newProgress;
      });
    }, 100) as unknown as number;

    transitionTimerRef.current = setTimeout(() => {
      startTransitionAnimation();
    }, 3000) as unknown as number;
  }, [isAnimating]);

  useEffect(() => {
    if (isAuthenticated) {
      if (userData?.role === "main_admin") {
        router.replace("/main_admin/(tabs)/announcements" as any);
      } else if (userData?.role === "assistant_admin") {
        router.replace("/assistant_admin/(tabs)/announcements" as any);
      } else if (userData?.role === "student") {
        router.replace("/student/(tabs)/announcements" as any);
      }
    }
  }, [isAuthenticated, userData, router]);

  useEffect(() => {
    entranceTimerRef.current = setTimeout(() => {
      playEntranceAnimation();
    }, 300) as unknown as number;

    return () => {
      resetAnimations();
    };
  }, [playEntranceAnimation, resetAnimations]);

  useFocusEffect(
    useCallback(() => {
      resetAnimations();
      entranceTimerRef.current = setTimeout(() => {
        playEntranceAnimation();
      }, 300) as unknown as number;

      return () => {
        resetAnimations();
      };
    }, [resetAnimations, playEntranceAnimation])
  );

  const startTransitionAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setProgress(100);

    Animated.parallel([
      Animated.timing(logoMove, {
        toValue: -100,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(logoScale, {
        toValue: 0.5,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start(() => {
      router.push("/login");
    });
  }, [isAnimating, fadeAnim, slideAnim, logoScale, logoMove, width, router]);

  const handleSkipToLogin = () => {
    if (entranceComplete && !isAnimating) {
      startTransitionAnimation();
    }
  };

  return (
    <SafeAreaView style={LandingStyles.container}>
    
      <View style={LandingStyles.background}>
        <Animated.View
          style={[
            LandingStyles.gradientOverlay,
            {
              opacity: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1]
              }),
            },
          ]}
        />
        
       
        <Animated.View
          style={[
            LandingStyles.slideBackground,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={LandingStyles.floatingOrbs}>
            <Animated.View 
              style={[
                LandingStyles.orb,
                LandingStyles.orb1,
                {
                  opacity: orb1Anim,
                  transform: [
                    { 
                      scale: orb1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1]
                      })
                    },
                  ],
                }
              ]} 
            />
            <Animated.View 
              style={[
                LandingStyles.orb,
                LandingStyles.orb2,
                {
                  opacity: orb2Anim,
                  transform: [
                    { 
                      scale: orb2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1]
                      })
                    },
                  ],
                }
              ]} 
            />
            <Animated.View 
              style={[
                LandingStyles.orb,
                LandingStyles.orb3,
                {
                  opacity: orb3Anim,
                  transform: [
                    { 
                      scale: orb3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1]
                      })
                    },
                  ],
                }
              ]} 
            />
          </View>
        </Animated.View>
      </View>

      <View style={LandingStyles.mainContainer}>
        {/* Content Card */}
        <Animated.View
          style={[
            LandingStyles.contentCard,
            {
              opacity: contentOpacity,
              transform: [
                { scale: contentScale }
              ],
            },
          ]}
        >
          {/* Logo Section */}
          <Animated.View
            style={[
              LandingStyles.logoSection,
              {
                opacity: logoOpacity,
                transform: [
                  { translateY: logoMove },
                  { scale: logoScale },
                  {
                    rotate: logoRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }
                ],
              },
            ]}
          >
            <Image
              source={require('../assets/images/Logo/TMC_Connect.png')}
              style={LandingStyles.logo}
              resizeMode="contain"
            />
            <View style={LandingStyles.logoGlow} />
          </Animated.View>

          {/* Text Content */}
          <View style={LandingStyles.textContent}>
            <Text style={LandingStyles.welcomeText}>WELCOME TO</Text>
            <Text style={LandingStyles.brandName}>TMC Connect</Text>
            
            <View style={LandingStyles.subtitleSection}>
              <Text style={LandingStyles.subtitle}>Your campus hub for</Text>
              <Text style={LandingStyles.subtitle}>announcements, events,</Text>
              <Text style={LandingStyles.subtitle}>and attendance</Text>
              <View style={LandingStyles.divider} />
            </View>
          </View>

       
        </Animated.View>

        {/* Progress Indicator */}
        {entranceComplete && !isAnimating && (
          <View style={LandingStyles.progressSection}>
            <View style={LandingStyles.progressContainer}>
              <View style={LandingStyles.progressBackground}>
                <View 
                  style={[
                    LandingStyles.progressFill,
                    {
                      width: `${progress}%`,
                    },
                  ]} 
                />
              </View>
              <Text style={LandingStyles.progressText}>
                {Math.round(progress)}%
              </Text>
            </View>
            <Text style={LandingStyles.progressLabel}>
              Loading login screen...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}