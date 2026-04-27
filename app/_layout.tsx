import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Platform, View } from 'react-native'
import { AuthProvider, useAuth } from '../src/Controller/context/AuthContext'
import { ThemeProvider, useTheme } from '../src/Controller/context/ThemeContext'

function RootLayoutContent() {
  const { user, loading, userData } = useAuth()
  const { colors } = useTheme()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return

    const currentRoute = segments[0] || 'index'
    const isWeb = Platform.OS === 'web'

    const publicRoutes = isWeb
      ? ['index', 'login', 'super-admin-login']
      : ['index', 'login', 'super-admin-login']

    const isPublic = publicRoutes.includes(currentRoute)

    const loginRoute = isWeb ? '/super-admin-login' : '/login'

    if (!user && !isPublic) {
      router.replace(loginRoute)
      return
    }

    if (user && isPublic) {
      const role = userData?.role
      if (role === 'student') router.replace('/student')
      else if (role === 'assistant_admin') router.replace('/assistant_admin')
      else if (role === 'main_admin') router.replace('/main_admin')
    }
  }, [user, loading, segments])

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size='large' color={colors.accent.primary} />
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='login' />
      <Stack.Screen name='super-admin-login' />
      <Stack.Screen name='assistant_admin' />
      <Stack.Screen name='main_admin' />
      <Stack.Screen name='student' />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
