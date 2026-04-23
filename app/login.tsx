import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
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

  // Lockout state
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

  // Theme integration
  const { colors, isDark, toggleTheme } = useTheme()
  const styles = createLoginStyles(isDark, colors)
  const themeSpinAnim = useRef(new Animated.Value(0)).current
  const [isThemeToggling, setIsThemeToggling] = useState(false)

  // Dynamic colors based on theme
  const gradientStart = isDark ? '#4F46E5' : '#3A5BF0'
  const gradientMid = isDark ? '#7C3AED' : '#5B3FD4'
  const gradientEnd = isDark ? '#A855F7' : '#7B2FF7'
  const errorRed = '#EF4444'
  const iconTint = isDark ? '#94A3B8' : '#8B92C4'
  const placeholderGray = isDark ? '#64748B' : '#A0A3B5'
  const successGreen = '#10b981'

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
    return emailRegex.test(email)
  }

  const saveLockoutState = async (
    attempts: number,
    lockoutTime: number | null
  ) => {
    try {
      await AsyncStorage.setItem(
        'studentLoginAttempts',
        JSON.stringify({ failedAttempts: attempts, lockoutUntil: lockoutTime })
      )
    } catch (e) {
      // Silently fail
    }
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
      } catch (err) {
        // Silently fail
      }
    }
  }

  const saveForgotCooldown = async (cooldownTime: number | null) => {
    try {
      await AsyncStorage.setItem(
        'forgotPasswordCooldown',
        JSON.stringify({ cooldownUntil: cooldownTime })
      )
    } catch (e) {
      // Silently fail
    }
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
    } catch (e) {
      // Silently fail
    }
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
        `Too many failed attempts. Please wait ${remainingLockoutSeconds} second${
          remainingLockoutSeconds !== 1 ? 's' : ''
        } before trying again.`
      )
    }
  }, [remainingLockoutSeconds, lockoutUntil])

  const handleFailedAttempt = (errorMessage: string) => {
    const newAttempts = failedAttempts + 1
    setFailedAttempts(newAttempts)

    if (newAttempts >= 3) {
      const lockoutTime = Date.now() + 60 * 1000
      setLockoutUntil(lockoutTime)
      setRemainingLockoutSeconds(60)
      saveLockoutState(newAttempts, lockoutTime).catch(() => {})
      setError(
        `Too many failed attempts. Please wait 60 seconds before trying again.`
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
      if (error.code === 'auth/user-not-found') {
        errorMessage =
          'No account found with that email. Please contact support.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please contact support.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.'
      }
      setForgotMessage(errorMessage)
      setForgotLoading(false)
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
      setError('Please enter username and password')
      return
    }

    setBusy(true)
    setLoadingMessage('Verifying credentials')

    try {
      setLoadingMessage('Checking user account')
      const usersCollection = collection(db, 'users')
      const q = query(usersCollection, where('username', '==', username))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setBusy(false)
        handleFailedAttempt('Invalid username or password')
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

      let errorMessage = 'Invalid username or password. Please try again.'

      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        errorMessage = 'Invalid username or password'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.'
      }

      handleFailedAttempt(errorMessage)
    }
  }

  return (
    <>
      <StatusBar
        barStyle='light-content'
        translucent
        backgroundColor='transparent'
      />

      {/* Forgot Password Modal - Theme Aware */}
      <Modal
        transparent
        visible={forgotModalVisible}
        animationType='fade'
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '80%',
              maxWidth: 400,
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.5 : 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Reset Password
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              Enter your username to receive a password reset email. The link
              will expire in 1 hour.
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.text,
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                marginBottom: 12,
              }}
              placeholder='Username'
              placeholderTextColor={placeholderGray}
              value={forgotUsername}
              onChangeText={setForgotUsername}
              autoCapitalize='none'
              editable={!forgotLoading}
            />
            {forgotMessage && (
              <Text
                style={{
                  color: forgotMessage.startsWith('✓')
                    ? successGreen
                    : errorRed,
                  fontSize: 12,
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                {forgotMessage}
              </Text>
            )}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                }}
                onPress={() => {
                  setForgotModalVisible(false)
                  setForgotMessage(null)
                  setForgotUsername('')
                }}
                disabled={forgotLoading}
              >
                <Text
                  style={{ color: colors.textSecondary, fontWeight: '600' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor:
                    forgotCooldownUntil && forgotCooldownUntil > Date.now()
                      ? '#94a3b8'
                      : gradientStart,
                  opacity: forgotLoading ? 0.6 : 1,
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
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Wait {forgotCooldownSeconds}s
                  </Text>
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Send Email
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.root}>
        <LinearGradient
          colors={[gradientStart, gradientMid, gradientEnd]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.header}
        >
          <View style={styles.statusBarSpacer} />

          {/* Theme Toggle Button */}
          <View
            style={{
              position: 'absolute',
              top:
                Platform.OS === 'ios'
                  ? 50
                  : (StatusBar.currentHeight || 0) + 10,
              right: 20,
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              onPress={handleThemeToggle}
              disabled={isThemeToggling}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
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
                  size={22}
                  color='#ffffff'
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.logoWrapper}>
            <View style={styles.logoGlow}>
              <Image
                source={require('../assets/images/Logo/TMC_Connect.png')}
                style={styles.logo}
                resizeMode='contain'
              />
            </View>
            <Text style={styles.appName}>TMC Connect</Text>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
              Sign in to continue to TMC Campus Hub
            </Text>

            {/* Username input */}
            <View
              style={[
                styles.inputWrapper,
                usernameFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name='person-outline'
                size={20}
                color={usernameFocused ? gradientStart : iconTint}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder='Username'
                placeholderTextColor={placeholderGray}
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
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                editable={!isLoading && !isLockedOut}
              />
              {username.length > 0 && (
                <Ionicons
                  name='checkmark-circle'
                  size={18}
                  color={gradientStart}
                />
              )}
            </View>

            {/* Password input */}
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name='lock-closed-outline'
                size={20}
                color={passwordFocused ? gradientStart : iconTint}
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                placeholder='Password'
                placeholderTextColor={placeholderGray}
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
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                editable={!isLoading && !isLockedOut}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eyeButton}
                disabled={isLoading || !!isLockedOut}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={passwordFocused ? gradientStart : iconTint}
                />
              </TouchableOpacity>
            </View>

            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name='alert-circle-outline'
                  size={18}
                  color={errorRed}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign In button */}
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
                disabled={isLoading || !!isLockedOut}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color='#FFFFFF' size='small' />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => setForgotModalVisible(true)}
              disabled={isLoading || !!isLockedOut}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Secure Login</Text>
              <View style={styles.dividerLine} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Modal transparent visible={isLoading} animationType='fade'>
        <LoadingScreen
          message={loadingMessage || 'Signing you in...'}
          subMessage='Please wait while we prepare your dashboard'
        />
      </Modal>
    </>
  )
}
