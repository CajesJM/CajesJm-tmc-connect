import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../src/Controller/context/AuthContext'
import { COLORS, LandingStyles } from '../src/View/styles/LandingStyles'

const EASE_OUT_CUBIC = Easing.out(Easing.cubic)
const EASE_IN_OUT = Easing.inOut(Easing.cubic)
const EASE_OUT_BACK = Easing.out(Easing.back(1.4))

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 70,
  r: Math.random() * 1.5 + 0.5,
  delay: Math.random() * 1200,
}))

function StarParticle({
  x,
  y,
  r,
  delay,
}: {
  x: number
  y: number
  r: number
  delay: number
}) {
  const { width, height } = useWindowDimensions()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(opacity, {
          toValue: 0.1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: (x / 100) * width,
        top: (y / 100) * height,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        backgroundColor: 'rgba(200,210,255,0.9)',
        opacity,
      }}
    />
  )
}

function PulseRing({ delay = 0 }: { delay?: number }) {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(scale, {
            toValue: 1.6,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        borderColor: 'rgba(165,180,252,0.4)',
        opacity,
        transform: [{ scale }],
      }}
    />
  )
}

function BlinkDot() {
  const opacity = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])
  return <Animated.View style={[LandingStyles.loadingBadgeDot, { opacity }]} />
}

export default function Landing() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isAuthenticated, userData } = useAuth()
  const { width } = useWindowDimensions()

  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [entranceComplete, setEntranceComplete] = useState(false)

  const progressIntervalRef = useRef<number | null>(null)
  const transitionTimerRef = useRef<number | null>(null)
  const entranceTimerRef = useRef<number | null>(null)

  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoRotate = useRef(new Animated.Value(0)).current

  const haloOpacity = useRef(new Animated.Value(0)).current
  const haloScale = useRef(new Animated.Value(0.4)).current

  const ringScale = useRef(new Animated.Value(0.5)).current
  const ringOpacity = useRef(new Animated.Value(0)).current

  const textOpacity = useRef(new Animated.Value(0)).current
  const textTranslate = useRef(new Animated.Value(28)).current

  const eyebrowOpacity = useRef(new Animated.Value(0)).current
  const eyebrowTranslate = useRef(new Animated.Value(14)).current

  const dotsOpacity = useRef(new Animated.Value(0)).current

  const orb1Opacity = useRef(new Animated.Value(0)).current
  const orb1Scale = useRef(new Animated.Value(0.3)).current
  const orb2Opacity = useRef(new Animated.Value(0)).current
  const orb2Scale = useRef(new Animated.Value(0.3)).current
  const orb3Opacity = useRef(new Animated.Value(0)).current
  const orb3Scale = useRef(new Animated.Value(0.3)).current
  const orb4Opacity = useRef(new Animated.Value(0)).current

  const progressOpacity = useRef(new Animated.Value(0)).current
  const badgeOpacity = useRef(new Animated.Value(0)).current
  const badgeTranslate = useRef(new Animated.Value(12)).current

  const screenOpacity = useRef(new Animated.Value(1)).current
  const screenScale = useRef(new Animated.Value(1)).current
  const logoExitScale = useRef(new Animated.Value(1)).current
  const logoExitTranslate = useRef(new Animated.Value(0)).current

  const starsOpacity = useRef(new Animated.Value(0)).current

  // ── Auth redirect
  useEffect(() => {
    if (!isAuthenticated) return
    if (userData?.role === 'main_admin') router.replace('/main_admin')
    else if (userData?.role === 'assistant_admin')
      router.replace('/assistant_admin/(tabs)/announcements')
    else if (userData?.role === 'student')
      router.replace('/student/(tabs)/announcements')
  }, [isAuthenticated, userData, router])

  const resetAnimations = useCallback(() => {
    const allValues = [
      logoOpacity,
      logoScale,
      logoRotate,
      haloOpacity,
      haloScale,
      ringScale,
      ringOpacity,
      textOpacity,
      textTranslate,
      eyebrowOpacity,
      eyebrowTranslate,
      dotsOpacity,
      orb1Opacity,
      orb1Scale,
      orb2Opacity,
      orb2Scale,
      orb3Opacity,
      orb3Scale,
      orb4Opacity,
      progressOpacity,
      badgeOpacity,
      badgeTranslate,
      screenOpacity,
      screenScale,
      logoExitScale,
      logoExitTranslate,
      starsOpacity,
    ]
    allValues.forEach((v) => v.stopAnimation())

    logoOpacity.setValue(0)
    logoScale.setValue(0.5)
    logoRotate.setValue(0)
    haloOpacity.setValue(0)
    haloScale.setValue(0.4)
    ringScale.setValue(0.5)
    ringOpacity.setValue(0)
    textOpacity.setValue(0)
    textTranslate.setValue(28)
    eyebrowOpacity.setValue(0)
    eyebrowTranslate.setValue(14)
    dotsOpacity.setValue(0)
    orb1Opacity.setValue(0)
    orb1Scale.setValue(0.3)
    orb2Opacity.setValue(0)
    orb2Scale.setValue(0.3)
    orb3Opacity.setValue(0)
    orb3Scale.setValue(0.3)
    orb4Opacity.setValue(0)
    progressOpacity.setValue(0)
    badgeOpacity.setValue(0)
    badgeTranslate.setValue(12)
    screenOpacity.setValue(1)
    screenScale.setValue(1)
    logoExitScale.setValue(1)
    logoExitTranslate.setValue(0)
    starsOpacity.setValue(0)

    setIsAnimating(false)
    setProgress(0)
    setEntranceComplete(false)

    if (progressIntervalRef.current !== null)
      clearInterval(progressIntervalRef.current)
    if (transitionTimerRef.current !== null)
      clearTimeout(transitionTimerRef.current)
    if (entranceTimerRef.current !== null)
      clearTimeout(entranceTimerRef.current)
    progressIntervalRef.current = null
    transitionTimerRef.current = null
    entranceTimerRef.current = null
  }, [])

  // ── Progress ticker
  const startProgressTicker = useCallback(() => {
    setProgress(0)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const remaining = 100 - prev
        const step = Math.max(1, remaining * 0.1)
        const next = prev + step
        if (next >= 100) {
          clearInterval(progressIntervalRef.current!)
          progressIntervalRef.current = null
          return 100
        }
        return next
      })
    }, 80) as unknown as number
  }, [])

  const startTransitionAnimation = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)

    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setProgress(100)

    Animated.parallel([
      Animated.timing(logoExitTranslate, {
        toValue: -60,
        duration: 650,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(logoExitScale, {
        toValue: 0.7,
        duration: 650,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),

      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 300,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(eyebrowOpacity, {
        toValue: 0,
        duration: 250,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(dotsOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),

      Animated.timing(progressOpacity, {
        toValue: 0,
        duration: 280,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(badgeOpacity, {
        toValue: 0,
        duration: 250,
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
      Animated.timing(orb4Opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(starsOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),

      Animated.sequence([
        Animated.delay(420),
        Animated.parallel([
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: 420,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(screenScale, {
            toValue: 1.04,
            duration: 420,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      router.push('/login')
    })
  }, [isAnimating])

  // ── Entrance animation
  const playEntranceAnimation = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(orb1Opacity, {
          toValue: 1,
          duration: 900,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(orb1Scale, {
          toValue: 1,
          duration: 900,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Opacity, {
          toValue: 1,
          duration: 900,
          delay: 100,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Scale, {
          toValue: 1,
          duration: 900,
          delay: 100,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(orb3Opacity, {
          toValue: 1,
          duration: 700,
          delay: 200,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(orb3Scale, {
          toValue: 1,
          duration: 700,
          delay: 200,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(orb4Opacity, {
          toValue: 1,
          duration: 800,
          delay: 150,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(starsOpacity, {
          toValue: 1,
          duration: 1000,
          delay: 300,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(haloOpacity, {
          toValue: 0.6,
          duration: 600,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 1,
          duration: 700,
          easing: EASE_OUT_BACK,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 500,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 600,
          easing: EASE_OUT_BACK,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 650,
          easing: EASE_OUT_BACK,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 750,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(eyebrowOpacity, {
          toValue: 1,
          duration: 450,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(eyebrowTranslate, {
          toValue: 0,
          duration: 450,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 550,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 550,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: 400,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(progressOpacity, {
          toValue: 1,
          duration: 500,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 500,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(badgeTranslate, {
          toValue: 0,
          duration: 500,
          easing: EASE_OUT_CUBIC,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setEntranceComplete(true)
      startProgressTicker()
      transitionTimerRef.current = setTimeout(() => {
        startTransitionAnimation()
      }, 3200) as unknown as number
    })
  }, [startProgressTicker, startTransitionAnimation])

  useEffect(() => {
    entranceTimerRef.current = setTimeout(
      playEntranceAnimation,
      250
    ) as unknown as number
    return () => {
      resetAnimations()
    }
  }, [playEntranceAnimation, resetAnimations])

  useFocusEffect(
    useCallback(() => {
      resetAnimations()
      entranceTimerRef.current = setTimeout(
        playEntranceAnimation,
        250
      ) as unknown as number
      return () => {
        resetAnimations()
      }
    }, [resetAnimations, playEntranceAnimation])
  )

  const logoRotateDeg = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const handleSkipToLogin = () => {
    if (entranceComplete && !isAnimating) startTransitionAnimation()
  }

  const clampedProgress = Math.min(progress, 100)

  return (
    <>
      <StatusBar style='light' translucent backgroundColor='transparent' />
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            flex: 1,
            opacity: screenOpacity,
            transform: [{ scale: screenScale }],
          }}
        >
          <LinearGradient
            colors={[
              COLORS.gradientStart,
              COLORS.gradientMid,
              COLORS.gradientEnd,
            ]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={LandingStyles.gradient}
          >
            {/* ── Star particles ──────────────────────────── */}
            <Animated.View
              pointerEvents='none'
              style={{ ...LandingStyles.orbsContainer, opacity: starsOpacity }}
            >
              {PARTICLES.map((p) => (
                <StarParticle
                  key={p.id}
                  x={p.x}
                  y={p.y}
                  r={p.r}
                  delay={p.delay}
                />
              ))}
            </Animated.View>

            {/* ── Floating orbs ───────────────────────────── */}
            <View style={LandingStyles.orbsContainer} pointerEvents='none'>
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
              <Animated.View
                style={[
                  LandingStyles.orb,
                  LandingStyles.orb4,
                  {
                    opacity: orb4Opacity,
                  },
                ]}
              />
            </View>

            {/* ── Main content ─────────────────────────────── */}
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
                {/* Halo */}
                <Animated.View
                  style={[
                    LandingStyles.logoHaloRing,
                    {
                      position: 'absolute',
                      opacity: haloOpacity,
                      transform: [{ scale: haloScale }],
                    },
                  ]}
                />

                {/* Pulse rings */}
                <PulseRing delay={0} />
                <PulseRing delay={900} />

                {/* Glow ring */}
                <Animated.View
                  style={[
                    LandingStyles.logoGlowRing,
                    {
                      opacity: ringOpacity,
                      transform: [{ scale: ringScale }],
                    },
                  ]}
                >
                  {/* Inner ring */}
                  <View style={LandingStyles.logoInnerRing}>
                    <Animated.Image
                      source={require('../assets/images/Logo/TMC_Connect.png')}
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
                      resizeMode='contain'
                    />
                  </View>
                </Animated.View>
              </Animated.View>

              {/* Text block */}
              <View style={{ alignItems: 'center' }}>
                {/* Eyebrow */}
                <Animated.Text
                  style={[
                    LandingStyles.eyebrow,
                    {
                      opacity: eyebrowOpacity,
                      transform: [{ translateY: eyebrowTranslate }],
                    },
                  ]}
                >
                  Welcome to
                </Animated.Text>

                {/* Brand */}
                <Animated.View
                  style={{
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslate }],
                  }}
                >
                  <Text style={{ textAlign: 'center' }}>
                    <Text style={LandingStyles.brandName}>TMC </Text>
                    <Text style={LandingStyles.brandAccent}>Connect</Text>
                  </Text>

                  <Text style={LandingStyles.subtitleLine}>
                    Your campus hub for announcements,
                  </Text>
                  <Text style={LandingStyles.subtitleLine}>
                    events, and attendance.
                  </Text>
                </Animated.View>

                {/* Dot indicator */}
                <Animated.View
                  style={[LandingStyles.dotRow, { opacity: dotsOpacity }]}
                >
                  <View style={LandingStyles.dot} />
                  <View style={LandingStyles.dotActive} />
                  <View style={LandingStyles.dot} />
                </Animated.View>
              </View>
            </View>

            {/* ── Progress section ─────────────────────────── */}
            <Animated.View
              style={[
                LandingStyles.progressSection,
                { opacity: progressOpacity },
              ]}
            >
              {/* Loading badge */}
              <Animated.View
                style={[
                  LandingStyles.loadingBadge,
                  {
                    opacity: badgeOpacity,
                    transform: [{ translateY: badgeTranslate }],
                  },
                ]}
              >
                <BlinkDot />
                <Text style={LandingStyles.loadingBadgeText}>Loading</Text>
              </Animated.View>

              {/* Progress bar + percent */}
              <View style={LandingStyles.progressRow}>
                <View style={LandingStyles.progressTrack}>
                  <View
                    style={[
                      LandingStyles.progressFill,
                      { width: `${clampedProgress}%` },
                    ]}
                  >
                    {/* Glow cap at fill end */}
                    {clampedProgress > 2 && (
                      <View style={LandingStyles.progressFillGlow} />
                    )}
                  </View>
                </View>
                <Text style={LandingStyles.progressPercent}>
                  {Math.round(clampedProgress)}%
                </Text>
              </View>

              <Text style={LandingStyles.progressLabel}>
                Preparing your experience
              </Text>

              {entranceComplete && !isAnimating && (
                <TouchableOpacity
                  onPress={handleSkipToLogin}
                  style={LandingStyles.skipHint}
                  activeOpacity={0.55}
                >
                  <Text style={LandingStyles.skipHintText}>
                    Tap anywhere to continue →
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </>
  )
}
