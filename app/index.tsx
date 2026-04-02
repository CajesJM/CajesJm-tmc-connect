import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from "../context/AuthContext";
import { COLORS, LandingStyles } from "../styles/LandingStyles";

import { Easing } from "react-native";

const EASE_OUT_CUBIC = Easing.out(Easing.cubic);
const EASE_IN_OUT = Easing.inOut(Easing.cubic);

export default function Landing() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, userData } = useAuth();
  const { width } = useWindowDimensions();

  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entranceComplete, setEntranceComplete] = useState(false);

  const progressIntervalRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const entranceTimerRef = useRef<number | null>(null);

  // Entrance
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(24)).current;
  const orb1Opacity = useRef(new Animated.Value(0)).current;
  const orb1Scale = useRef(new Animated.Value(0.4)).current;
  const orb2Opacity = useRef(new Animated.Value(0)).current;
  const orb2Scale = useRef(new Animated.Value(0.4)).current;
  const orb3Opacity = useRef(new Animated.Value(0)).current;
  const orb3Scale = useRef(new Animated.Value(0.4)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;

  // Exit
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
  const logoExitScale = useRef(new Animated.Value(1)).current;
  const logoExitTranslate = useRef(new Animated.Value(0)).current;

  // ── Auth-based redirect ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    if (userData?.role === "main_admin") {
      router.replace("/main_admin");
    } else if (userData?.role === "assistant_admin") {
      router.replace("/assistant_admin/(tabs)/announcements");
    } else if (userData?.role === "student") {
      router.replace("/student/(tabs)/announcements");
    }
  }, [isAuthenticated, userData, router]);

  // ── Reset all animated values ────────────────────────────────
  const resetAnimations = useCallback(() => {
    [
      logoOpacity, logoScale, logoRotate, ringScale, ringOpacity,
      textOpacity, textTranslate, orb1Opacity, orb1Scale,
      orb2Opacity, orb2Scale, orb3Opacity, orb3Scale,
      progressOpacity, screenOpacity, screenTranslateY,
      logoExitScale, logoExitTranslate,
    ].forEach((v) => v.stopAnimation());

    logoOpacity.setValue(0);
    logoScale.setValue(0.6);
    logoRotate.setValue(0);
    ringScale.setValue(0.5);
    ringOpacity.setValue(0);
    textOpacity.setValue(0);
    textTranslate.setValue(24);
    orb1Opacity.setValue(0);
    orb1Scale.setValue(0.4);
    orb2Opacity.setValue(0);
    orb2Scale.setValue(0.4);
    orb3Opacity.setValue(0);
    orb3Scale.setValue(0.4);
    progressOpacity.setValue(0);
    screenOpacity.setValue(1);
    screenTranslateY.setValue(0);
    logoExitScale.setValue(1);
    logoExitTranslate.setValue(0);

    setIsAnimating(false);
    setProgress(0);
    setEntranceComplete(false);

    if (progressIntervalRef.current !== null) clearInterval(progressIntervalRef.current);
    if (transitionTimerRef.current !== null) clearTimeout(transitionTimerRef.current);
    if (entranceTimerRef.current !== null) clearTimeout(entranceTimerRef.current);
    progressIntervalRef.current = null;
    transitionTimerRef.current = null;
    entranceTimerRef.current = null;
  }, [
    logoOpacity, logoScale, logoRotate, ringScale, ringOpacity,
    textOpacity, textTranslate, orb1Opacity, orb1Scale,
    orb2Opacity, orb2Scale, orb3Opacity, orb3Scale,
    progressOpacity, screenOpacity, screenTranslateY,
    logoExitScale, logoExitTranslate,
  ]);

  // ── Progress ticker ────────────────────────────────────────────
  const startProgressTicker = useCallback(() => {
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / 30;
        if (next >= 100) {
          clearInterval(progressIntervalRef.current!);
          progressIntervalRef.current = null;
          return 100;
        }
        return next;
      });
    }, 100) as unknown as number;
  }, []);

  // ── Exit / transition animation ────────────────────────────────
  const startTransitionAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(100);

    Animated.parallel([
      Animated.timing(logoExitTranslate, {
        toValue: -80,
        duration: 700,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(logoExitScale, {
        toValue: 0.65,
        duration: 700,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 350,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(progressOpacity, {
        toValue: 0,
        duration: 300,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(orb1Opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(orb2Opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(orb3Opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.sequence([
        Animated.delay(500),
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 400,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      router.push("/login");
    });
  }, [
    isAnimating, logoExitTranslate, logoExitScale, textOpacity,
    progressOpacity, orb1Opacity, orb2Opacity, orb3Opacity,
    screenOpacity, router,
  ]);

  // ── Entrance animation ─────────────────────────────────────────
  const playEntranceAnimation = useCallback(() => {
    Animated.sequence([
      // 1. Orbs bloom in
      Animated.parallel([
        Animated.timing(orb1Opacity, { toValue: 1, duration: 700, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(orb1Scale, { toValue: 1, duration: 700, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(orb2Opacity, { toValue: 1, duration: 700, delay: 100, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(orb2Scale, { toValue: 1, duration: 700, delay: 100, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(orb3Opacity, { toValue: 1, duration: 700, delay: 200, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(orb3Scale, { toValue: 1, duration: 700, delay: 200, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
      ]),

      // 2. Glow ring expands
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 1, duration: 500, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1, duration: 600, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
      ]),

      // 3. Logo spins in
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 600, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(logoRotate, { toValue: 1, duration: 700, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
      ]),

      // 4. Text slides up + fades in
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 550, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 550, easing: EASE_OUT_CUBIC, useNativeDriver: true }),
      ]),

      // 5. Progress bar fades in
      Animated.timing(progressOpacity, { toValue: 1, duration: 400, easing: EASE_OUT_CUBIC, useNativeDriver: true }),

    ]).start(() => {
      setEntranceComplete(true);
      startProgressTicker();
      transitionTimerRef.current = setTimeout(() => {
        startTransitionAnimation();
      }, 3000) as unknown as number;
    });
  }, [
    orb1Opacity, orb1Scale, orb2Opacity, orb2Scale, orb3Opacity, orb3Scale,
    ringOpacity, ringScale, logoOpacity, logoScale, logoRotate,
    textOpacity, textTranslate, progressOpacity,
    startProgressTicker, startTransitionAnimation,
  ]);

  // ── Lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    entranceTimerRef.current = setTimeout(playEntranceAnimation, 300) as unknown as number;
    return () => { resetAnimations(); };
  }, [playEntranceAnimation, resetAnimations]);

  useFocusEffect(
    useCallback(() => {
      resetAnimations();
      entranceTimerRef.current = setTimeout(playEntranceAnimation, 300) as unknown as number;
      return () => { resetAnimations(); };
    }, [resetAnimations, playEntranceAnimation])
  );

  // ── Derived animated styles ────────────────────────────────────
  const logoRotateDeg = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleSkipToLogin = () => {
    if (entranceComplete && !isAnimating) startTransitionAnimation();
  };

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            flex: 1,
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          }}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={LandingStyles.gradient}
          >

            {/* ── Floating orbs ─────────────────────────────────── */}
            <View style={LandingStyles.orbsContainer} pointerEvents="none">
              <Animated.View
                style={[
                  LandingStyles.orb,
                  LandingStyles.orb1,
                  {
                    opacity: orb1Opacity,
                    transform: [{ scale: orb1Scale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  LandingStyles.orb,
                  LandingStyles.orb2,
                  {
                    opacity: orb2Opacity,
                    transform: [{ scale: orb2Scale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  LandingStyles.orb,
                  LandingStyles.orb3,
                  {
                    opacity: orb3Opacity,
                    transform: [{ scale: orb3Scale }],
                  },
                ]}
              />
            </View>

            {/* ── Main content ──────────────────────────────────── */}
            <View style={LandingStyles.mainContainer}>

              <Animated.View
                style={[
                  LandingStyles.logoSection,
                  {
                    transform: [
                      { translateY: logoExitTranslate },
                      { scale: logoExitScale },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    LandingStyles.logoGlowRing,
                    {
                      opacity: ringOpacity,
                      transform: [{ scale: ringScale }],
                    },
                  ]}
                >
                  <Animated.View style={LandingStyles.logoInnerRing}>
                    <Animated.Image
                      source={require("../assets/images/Logo/TMC_Connect.png")}
                      style={[
                        LandingStyles.logo,
                        {
                          opacity: logoOpacity,
                          transform: [
                            { scale: logoScale },
                            { rotate: logoRotateDeg },
                          ],
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </Animated.View>
              </Animated.View>

              {/* Text content */}
              <Animated.View
                style={[
                  LandingStyles.textContent,
                  {
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslate }],
                  },
                ]}
              >
                <Text style={LandingStyles.eyebrow}>Welcome to</Text>

                <Text>
                  <Text style={LandingStyles.brandName}>TMC </Text>
                  <Text style={LandingStyles.brandAccent}>Connect</Text>
                </Text>

                <Text style={[LandingStyles.subtitleLine, { marginTop: 8 }]}>
                  Your campus hub for announcements,
                </Text>
                <Text style={LandingStyles.subtitleLine}>
                  events, and attendance
                </Text>

                {/* Dot indicator row */}
                <View style={LandingStyles.dotRow}>
                  <View style={LandingStyles.dot} />
                  <View style={LandingStyles.dotActive} />
                  <View style={LandingStyles.dot} />
                </View>
              </Animated.View>
            </View>

            {/* ── Progress section ──────────────────────────────── */}
            <Animated.View
              style={[LandingStyles.progressSection, { opacity: progressOpacity }]}
            >
              <View style={LandingStyles.progressRow}>
                <View style={LandingStyles.progressTrack}>
                  <View
                    style={[
                      LandingStyles.progressFill,
                      { width: `${Math.min(progress, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={LandingStyles.progressPercent}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <Text style={LandingStyles.progressLabel}>
                Loading login screen...
              </Text>

              {entranceComplete && !isAnimating && (
                <TouchableOpacity
                  onPress={handleSkipToLogin}
                  style={LandingStyles.skipHint}
                  activeOpacity={0.6}
                >
                  <Text style={LandingStyles.skipHintText}>Tap to continue</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

          </LinearGradient>
        </Animated.View>
      </View>
    </>
  );
}