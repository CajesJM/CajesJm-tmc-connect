import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../src/Controller/context/AuthContext'
import { useTheme } from '../src/Controller/context/ThemeContext'
import { db } from '../src/Model/lib/firebaseConfig'
import LoadingScreen from '../src/View/components/LoadingScreen'
import { createLoginStyles } from '../src/View/styles/LoginStyles'

function PulseRing({
  delay = 0,
  color,
  size = 130,
}: {
  delay?: number
  color: string
  size?: number
}) {
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
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  )
}
export default function Login() {
  const router = useRouter()
  const { login, loading } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0)

  // Forgot password state
  const [forgotModalVisible, setForgotModalVisible] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [forgotCooldownUntil, setForgotCooldownUntil] = useState<number | null>(
    null
  )
  const [forgotCooldownSeconds, setForgotCooldownSeconds] = useState(0)

  const passwordRef = useRef<TextInput>(null)
  const isLoading = busy || loading
  const isLockedOut = lockoutUntil && lockoutUntil > Date.now()

  const { colors, isDark, toggleTheme } = useTheme()
  const styles = useMemo(
    () => createLoginStyles(isDark, colors),
    [isDark, colors]
  )

  const themeSpinAnim = useRef(new Animated.Value(0)).current
  const [isThemeToggling, setIsThemeToggling] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current
  const logoFadeAnim = useRef(new Animated.Value(0)).current

  const buttonScaleAnim = useRef(new Animated.Value(1)).current

  const shakeAnim = useRef(new Animated.Value(0)).current

  const gradientStart = isDark ? '#3730A3' : '#3A5BF0'
  const gradientMid = isDark ? '#5B21B6' : '#4F46E5'
  const gradientEnd = isDark ? '#7C3AED' : '#6D28D9'

  const errorRed = '#EF4444'
  const iconTint = isDark ? '#3D4E78' : '#A0A8D0'
  const placeholderColor = isDark ? '#3D4E78' : '#A0A3B5'
  const successGreen = '#10B981'

  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 12,
            color: colors.text,
          }}
        >
          Student & Assistant Admin login is only available on the mobile app.
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: colors.sidebar?.text?.secondary || '#666',
          }}
        >
          Please use the Super Admin Login portal instead:
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/super-admin-login')}
          style={{
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: '#3b82f6',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            Go to Super Admin Login
          </Text>
        </TouchableOpacity>
      </View>
    )
  }
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    }, 200)
  }, [])

  // ─── Shake on error ───────────────────────────────────────────
  const triggerShake = () => {
    shakeAnim.setValue(0)
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start()
  }

  // ─── Button press animation ───────────────────────────────────
  const onButtonPressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.96,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }

  const onButtonPressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
    return emailRegex.test(email)
  }

  // ─── Persistence helpers ──────────────────────────────────────
  const saveLockoutState = async (
    attempts: number,
    lockoutTime: number | null
  ) => {
    try {
      await AsyncStorage.setItem(
        'studentLoginAttempts',
        JSON.stringify({ failedAttempts: attempts, lockoutUntil: lockoutTime })
      )
    } catch (e) {}
  }

  const restoreLockoutState = async () => {
    try {
      const stored = await AsyncStorage.getItem('studentLoginAttempts')
      if (stored) {
        const { failedAttempts: storedAttempts, lockoutUntil: storedLockout } =
          JSON.parse(stored)
        if (storedLockout && storedLockout > Date.now()) {
          setFailedAttempts(storedAttempts)
          setLockoutUntil(storedLockout)
        } else {
          await AsyncStorage.removeItem('studentLoginAttempts')
          setFailedAttempts(0)
          setLockoutUntil(null)
        }
      }
    } catch (e) {
      try {
        await AsyncStorage.removeItem('studentLoginAttempts')
      } catch {}
    }
  }

  const saveForgotCooldown = async (cooldownTime: number | null) => {
    try {
      await AsyncStorage.setItem(
        'forgotPasswordCooldown',
        JSON.stringify({ cooldownUntil: cooldownTime })
      )
    } catch (e) {}
  }

  const restoreForgotCooldown = async () => {
    try {
      const stored = await AsyncStorage.getItem('forgotPasswordCooldown')
      if (stored) {
        const { cooldownUntil } = JSON.parse(stored)
        if (cooldownUntil && cooldownUntil > Date.now()) {
          setForgotCooldownUntil(cooldownUntil)
        } else {
          await AsyncStorage.removeItem('forgotPasswordCooldown')
          setForgotCooldownUntil(null)
        }
      }
    } catch (e) {}
  }

  const handleThemeToggle = () => {
    if (isThemeToggling) return
    setIsThemeToggling(true)
    themeSpinAnim.setValue(0)
    Animated.timing(themeSpinAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsThemeToggling(false))
    toggleTheme()
  }

  useEffect(() => {
    restoreLockoutState()
    restoreForgotCooldown()
  }, [])

  // Lockout countdown
  useEffect(() => {
    let interval: number
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const updateRemaining = () => {
        const remaining = Math.max(
          0,
          Math.ceil((lockoutUntil - Date.now()) / 1000)
        )
        setRemainingLockoutSeconds(remaining)
        if (remaining === 0) {
          setLockoutUntil(null)
          setFailedAttempts(0)
          setRemainingLockoutSeconds(0)
          AsyncStorage.removeItem('studentLoginAttempts').catch(() => {})
          setError(null)
        }
      }
      updateRemaining()
      interval = setInterval(updateRemaining, 1000)
      return () => clearInterval(interval)
    } else if (lockoutUntil && lockoutUntil <= Date.now()) {
      setLockoutUntil(null)
      setFailedAttempts(0)
      setRemainingLockoutSeconds(0)
      AsyncStorage.removeItem('studentLoginAttempts').catch(() => {})
      setError(null)
    }
  }, [lockoutUntil])

  // Forgot cooldown countdown
  useEffect(() => {
    let interval: number
    if (forgotCooldownUntil && forgotCooldownUntil > Date.now()) {
      const updateRemaining = () => {
        const remaining = Math.max(
          0,
          Math.ceil((forgotCooldownUntil - Date.now()) / 1000)
        )
        setForgotCooldownSeconds(remaining)
        if (remaining === 0) {
          setForgotCooldownUntil(null)
          setForgotCooldownSeconds(0)
          AsyncStorage.removeItem('forgotPasswordCooldown').catch(() => {})
        }
      }
      updateRemaining()
      interval = setInterval(updateRemaining, 1000)
      return () => clearInterval(interval)
    } else if (forgotCooldownUntil && forgotCooldownUntil <= Date.now()) {
      setForgotCooldownUntil(null)
      setForgotCooldownSeconds(0)
      AsyncStorage.removeItem('forgotPasswordCooldown').catch(() => {})
    }
  }, [forgotCooldownUntil])

  useEffect(() => {
    if (
      lockoutUntil &&
      lockoutUntil > Date.now() &&
      remainingLockoutSeconds > 0
    ) {
      setError(
        `Too many failed attempts. Please wait ${remainingLockoutSeconds} second${remainingLockoutSeconds !== 1 ? 's' : ''} before trying again.`
      )
    }
  }, [remainingLockoutSeconds, lockoutUntil])

  const handleFailedAttempt = (errorMessage: string) => {
    const newAttempts = failedAttempts + 1
    setFailedAttempts(newAttempts)
    triggerShake()

    if (newAttempts >= 3) {
      const lockoutTime = Date.now() + 60 * 1000
      setLockoutUntil(lockoutTime)
      setRemainingLockoutSeconds(60)
      saveLockoutState(newAttempts, lockoutTime).catch(() => {})
      setError(
        'Too many failed attempts. Please wait 60 seconds before trying again.'
      )
    } else {
      setError(`${errorMessage} ${3 - newAttempts} attempt(s) remaining.`)
    }
    Alert.alert('Login Failed', errorMessage)
  }

  const handleForgotPassword = async () => {
    if (!forgotUsername.trim()) {
      setForgotMessage('Please enter your username')
      return
    }
    if (forgotCooldownUntil && forgotCooldownUntil > Date.now()) {
      setForgotMessage(
        `Please wait ${forgotCooldownSeconds} seconds before requesting again.`
      )
      return
    }

    setForgotLoading(true)
    setForgotMessage(null)

    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', forgotUsername.trim()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setForgotMessage('Username not found')
        setForgotLoading(false)
        return
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      const accountStatus = userData.status || 'active'
      if (accountStatus !== 'active') {
        setBusy(false)
        setError(
          'Your account has been deactivated. Please contact an administrator.'
        )
        Alert.alert(
          'Account Inactive',
          'Your account has been deactivated. Please contact an administrator.'
        )
        return
      }

      if (userData.role !== 'student' && userData.role !== 'assistant_admin') {
        setForgotMessage('Account type not supported for password reset here.')
        setForgotLoading(false)
        return
      }
      const email = userData.email

      if (!email) {
        setForgotMessage(
          'No email address associated with this account. Please contact support.'
        )
        setForgotLoading(false)
        return
      }

      if (!isValidEmail(email)) {
        setForgotMessage(
          'The email address on file is invalid. Please contact support.'
        )
        setForgotLoading(false)
        return
      }

      const auth = getAuth()
      await sendPasswordResetEmail(auth, email)

      const cooldownTime = Date.now() + 60 * 1000
      setForgotCooldownUntil(cooldownTime)
      setForgotCooldownSeconds(60)
      saveForgotCooldown(cooldownTime).catch(() => {})
      setForgotMessage(
        '✓ Reset email sent! The link expires in 1 hour. Check your inbox.'
      )
      setForgotLoading(false)
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again later.'
      if (error.code === 'auth/user-not-found')
        errorMessage =
          'No account found with that email. Please contact support.'
      else if (error.code === 'auth/invalid-email')
        errorMessage = 'Invalid email address. Please contact support.'
      else if (error.code === 'auth/too-many-requests')
        errorMessage = 'Too many requests. Please try again later.'
      setForgotMessage(errorMessage)
      setForgotLoading(false)
    }
  }

  const isOnline = async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch()
      return !!(state.isConnected && state.isInternetReachable)
    } catch {
      return true
    }
  }

  const handleLogin = async () => {
    if (busy || isLockedOut) return
    setError(null)

    if (lockoutUntil && lockoutUntil > Date.now()) {
      return
    } else if (lockoutUntil && lockoutUntil <= Date.now()) {
      setLockoutUntil(null)
      setFailedAttempts(0)
      setRemainingLockoutSeconds(0)
      AsyncStorage.removeItem('studentLoginAttempts').catch(() => {})
    }

    if (!username || !password) {
      setError('Please enter your username and password.')
      triggerShake()
      return
    }

    setBusy(true)
    setLoadingMessage('Verifying credentials')

    const online = await isOnline()
    if (!online) {
      setBusy(false)
      setError(
        'No internet connection. Please check your network and try again.'
      )
      triggerShake()
      return
    }

    try {
      setLoadingMessage('Checking user account')
      const usersCollection = collection(db, 'users')
      const q = query(usersCollection, where('username', '==', username))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setBusy(false)
        handleFailedAttempt('Invalid username or password.')
        return
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()

      if (userData.role === 'main_admin') {
        setBusy(false)
        setError('Main administrators must use the Admin Portal')
        Alert.alert(
          'Access Denied',
          'Main administrators must login through the Admin Portal.\n\nPlease visit: /super-admin-login'
        )
        return
      }

      const accountStatus = userData.status || 'active'
      if (accountStatus !== 'active') {
        setBusy(false)
        setError(
          'Your account has been deactivated. Please contact an administrator.'
        )
        Alert.alert(
          'Account Inactive',
          'Your account has been deactivated. Please contact an administrator.'
        )
        return
      }

      setLoadingMessage('Authenticating')
      const loggedInUser = await login(userData.email, password)

      let targetRoute = '/student'
      if (loggedInUser.role === 'assistant_admin')
        targetRoute = '/assistant_admin'

      setFailedAttempts(0)
      setLockoutUntil(null)
      setRemainingLockoutSeconds(0)
      setError(null)
      AsyncStorage.removeItem('studentLoginAttempts').catch(() => {})
      setLoadingMessage('Redirecting to dashboard...')
      setTimeout(() => {
        router.replace(targetRoute as any)
      }, 300)
    } catch (err: any) {
      setBusy(false)

      const isNetworkError =
        err?.code === 'auth/network-request-failed' ||
        err?.code === 'unavailable' ||
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('offline') ||
        err?.message?.toLowerCase().includes('fetch')

      if (isNetworkError) {
        setError(
          'No internet connection. Please check your network and try again.'
        )
        triggerShake()
        return
      }

      let errorMessage = 'Invalid username or password.'
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        errorMessage = 'Invalid username or password.'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      }
      handleFailedAttempt(errorMessage)
    }
  }

  const accentFocused = isDark ? '#6366F1' : '#4F46E5'
  const pulseRingColor = isDark ? accentFocused : '#A5B4FC'

  return (
    <>
      <StatusBar
        barStyle='light-content'
        translucent
        backgroundColor='transparent'
      />

      {/* ── Forgot Password Modal ── */}
      <Modal
        transparent
        visible={forgotModalVisible}
        animationType='fade'
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: isDark ? '#0F1629' : '#FFFFFF',
              borderRadius: 28,
              padding: 28,
              borderWidth: 1,
              borderColor: isDark ? '#1E2A4A' : '#E2E5FF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: isDark ? 0.6 : 0.15,
              shadowRadius: 40,
              elevation: 16,
            }}
          >
            {/* Modal header */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: isDark ? '#1E2A4A' : '#EEF0FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Ionicons name='key-outline' size={24} color={accentFocused} />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDark ? '#F1F5FF' : '#0F172A',
                  letterSpacing: -0.4,
                  marginBottom: 6,
                }}
              >
                Reset Password
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? '#8892B0' : '#64748B',
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                Enter your username and we'll send a reset link to your
                registered email.
              </Text>
            </View>

            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: isDark ? '#1E2A4A' : '#D0D4F5',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: isDark ? '#F1F5FF' : '#0F172A',
                backgroundColor: isDark ? '#131929' : '#F5F6FF',
                marginBottom: 14,
                letterSpacing: 0.2,
              }}
              placeholder='Enter your username'
              placeholderTextColor={isDark ? '#3D4E78' : '#A0A3B5'}
              value={forgotUsername}
              onChangeText={setForgotUsername}
              autoCapitalize='none'
              editable={!forgotLoading}
            />

            {forgotMessage && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: forgotMessage.startsWith('✓')
                    ? 'rgba(16,185,129,0.08)'
                    : 'rgba(239,68,68,0.08)',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: forgotMessage.startsWith('✓')
                    ? 'rgba(16,185,129,0.25)'
                    : 'rgba(239,68,68,0.25)',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name={
                    forgotMessage.startsWith('✓')
                      ? 'checkmark-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={16}
                  color={forgotMessage.startsWith('✓') ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={{
                    flex: 1,
                    color: forgotMessage.startsWith('✓')
                      ? '#10B981'
                      : '#EF4444',
                    fontSize: 12,
                    lineHeight: 17,
                  }}
                >
                  {forgotMessage}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1E2A4A' : '#F0F2FF',
                }}
                onPress={() => {
                  setForgotModalVisible(false)
                  setForgotMessage(null)
                  setForgotUsername('')
                }}
                disabled={forgotLoading}
              >
                <Text
                  style={{
                    color: isDark ? '#8892B0' : '#64748B',
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor:
                    forgotCooldownUntil && forgotCooldownUntil > Date.now()
                      ? isDark
                        ? '#2D3A5A'
                        : '#C7CAE8'
                      : accentFocused,
                  opacity: forgotLoading ? 0.65 : 1,
                }}
                onPress={handleForgotPassword}
                disabled={
                  forgotLoading ||
                  (forgotCooldownUntil !== null &&
                    forgotCooldownUntil > Date.now())
                }
              >
                {forgotLoading ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : forgotCooldownUntil && forgotCooldownUntil > Date.now() ? (
                  <Text
                    style={{
                      color: isDark ? '#8892B0' : '#7B82C4',
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    Wait {forgotCooldownSeconds}s
                  </Text>
                ) : (
                  <Text
                    style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}
                  >
                    Send Link
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Main Screen ── */}
      <View style={styles.root}>
        {/* ── HEADER ── */}
        <LinearGradient
          colors={[gradientStart, gradientMid, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circle accents */}
          <View
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -20,
              left: -30,
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
          />

          <View style={styles.statusBarSpacer} />

          {/* Theme Toggle */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={handleThemeToggle}
            disabled={isThemeToggling}
            activeOpacity={0.75}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: themeSpinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  {
                    scale: themeSpinAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1],
                    }),
                  },
                ],
              }}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color='rgba(255,255,255,0.9)'
              />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoFadeAnim,
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <View
              style={{
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -24,
              }}
            >
              <PulseRing delay={0} color={pulseRingColor} size={130} />
              <PulseRing delay={900} color={pulseRingColor} size={130} />
            </View>

            <View style={styles.logoRing}>
              <Image
                source={require('../assets/images/Logo/TMC_Connect.png')}
                style={styles.logo}
                resizeMode='contain'
              />
            </View>
            <Text style={styles.appName}>TMC Connect</Text>
          </Animated.View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            {/* Title */}
            <View style={styles.titleRow}>
              <Text>
                <Text style={styles.title}>Welcome </Text>
                <Text style={styles.titleAccent}>Back</Text>
                <Text style={styles.title}>!</Text>
              </Text>
            </View>
            <Text style={styles.subtitle}>
              Sign in to continue to TMC Connect
            </Text>

            {/* ── Username ── */}
            <Animated.View
              style={{
                transform: [{ translateX: shakeAnim }],
              }}
            >
              <View
                style={[
                  styles.inputWrapper,
                  usernameFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name='person-outline'
                  size={19}
                  color={usernameFocused ? accentFocused : iconTint}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder='Username'
                  placeholderTextColor={placeholderColor}
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t)
                    if (error) setError(null)
                  }}
                  style={styles.input}
                  autoCapitalize='none'
                  autoCorrect={false}
                  returnKeyType='next'
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!isLoading && !isLockedOut}
                />
                {username.length > 0 && (
                  <Ionicons
                    name='checkmark-circle'
                    size={18}
                    color={accentFocused}
                  />
                )}
              </View>

              {/* ── Password ── */}
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name='lock-closed-outline'
                  size={19}
                  color={passwordFocused ? accentFocused : iconTint}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  placeholder='Password'
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t)
                    if (error) setError(null)
                  }}
                  style={[styles.input, { flex: 1 }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize='none'
                  autoCorrect={false}
                  returnKeyType='done'
                  onSubmitEditing={handleLogin}
                  editable={!isLoading && !isLockedOut}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={passwordFocused ? accentFocused : iconTint}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── Error Banner ── */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name='alert-circle-outline'
                  size={17}
                  color={errorRed}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ── Sign In Button ── */}
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <LinearGradient
                colors={[gradientStart, gradientMid, gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.buttonGradient,
                  isLoading && styles.buttonDisabled,
                ]}
              >
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleLogin}
                  onPressIn={onButtonPressIn}
                  onPressOut={onButtonPressOut}
                  activeOpacity={1}
                >
                  {isLoading ? (
                    <ActivityIndicator color='#FFFFFF' size='small' />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Sign In</Text>
                      <View style={styles.buttonArrow}>
                        <Ionicons name='arrow-forward' size={14} color='#fff' />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* ── Forgot Password ── */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => setForgotModalVisible(true)}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Secure Login</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Secure Badge ── */}
            <View style={styles.secureBadge}>
              <Ionicons
                name='shield-checkmark-outline'
                size={13}
                color={isDark ? '#3D4E78' : '#A0A8D0'}
              />
              <Text style={styles.secureBadgeText}>
                Protected by Firebase Auth
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Modal
        transparent
        visible={busy}
        animationType='fade'
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <LoadingScreen
            message={loadingMessage || 'Signing you in...'}
            subMessage='Please wait while we prepare your dashboard'
          />
        </View>
      </Modal>
    </>
  )
}
