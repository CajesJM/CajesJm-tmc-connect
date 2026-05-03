import * as SecureStore from 'expo-secure-store'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { auth, db } from '../../Model/lib/firebaseConfig'

type Role = 'main_admin' | 'assistant_admin' | 'student' | null

interface UserData {
  createdAt: any
  email: string
  role: Role
  name: string
  username?: string
  surname?: string
  studentID?: number
  active?: boolean
  status?: 'active' | 'inactive'
  deactivatedAt?: string
  photoURL?: string
  permissions?: {
    canManageUsers?: boolean
    canManageEvents?: boolean
    canManageAnnouncements?: boolean
    canManageAttendance?: boolean
    canViewAnalytics?: boolean
  }
}

interface AuthContextValue {
  user: User | null
  userData: UserData | null
  role: Role
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isMainAdmin: () => boolean
  isAssistantAdmin: () => boolean
  refreshUserData: () => Promise<void>
}

const KEY_USER_DATA = 'user_data'
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function storeUserData(userData: UserData | null) {
  if (Platform.OS === 'web') {
    if (userData) localStorage.setItem(KEY_USER_DATA, JSON.stringify(userData))
    else localStorage.removeItem(KEY_USER_DATA)
  } else {
    if (userData)
      await SecureStore.setItemAsync(KEY_USER_DATA, JSON.stringify(userData))
    else await SecureStore.deleteItemAsync(KEY_USER_DATA)
  }
}

async function readUserData(): Promise<UserData | null> {
  try {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(KEY_USER_DATA)
      return data ? JSON.parse(data) : null
    } else {
      const data = await SecureStore.getItemAsync(KEY_USER_DATA)
      return data ? JSON.parse(data) : null
    }
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true) // 🆕 start as true

  useEffect(() => {
    ;(async () => {
      const stored = await readUserData()
      if (stored) setUserData(stored)
    })()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (!userDoc.exists()) {
            await signOut(auth)
            setUser(null)
            setUserData(null)
            await storeUserData(null)
          } else {
            const data = userDoc.data() as UserData
            const role = data.role as string
            const status = data.status || 'active'
            const active = data.active !== false

            if (
              (role === 'student' ||
                role === 'assistant_admin' ||
                role === 'main_admin') &&
              status !== 'inactive' &&
              active
            ) {
              const freshUser: UserData = {
                ...data,
                email: firebaseUser.email || data.email,
                role: role as Role,
                surname: data.surname || '',
              }
              setUser(firebaseUser)
              setUserData(freshUser)
              await storeUserData(freshUser)
            } else {
              await signOut(auth)
              setUser(null)
              setUserData(null)
              await storeUserData(null)
              Alert.alert(
                'Account Deactivated',
                'Your account has been deactivated.'
              )
            }
          }
        } catch (error) {
          console.error('Error during auth state change:', error)
          await signOut(auth).catch(() => {})
          setUser(null)
          setUserData(null)
          await storeUserData(null)
        }
      } else {
        setUser(null)
        setUserData(null)
        await storeUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ── 3. Realtime deactivation listener
  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnapshot) => {
        if (!docSnapshot.exists()) return
        const data = docSnapshot.data()
        const isStillActive =
          (data.status ? data.status !== 'inactive' : true) &&
          data.active !== false

        if (!isStillActive) {
          signOut(auth).catch(console.error)
          setUser(null)
          setUserData(null)
          storeUserData(null)
          Alert.alert(
            'Account Deactivated',
            'Your account has been deactivated.'
          )
        }
      },
      (error) => console.error('Realtime listener error:', error)
    )

    return () => unsubscribe()
  }, [user])

  const login = async (email: string, password: string): Promise<void> => {
    if (!email || !password) throw new Error('Email and password are required')
    if (!email.includes('@')) throw new Error('Invalid email format')

    await signInWithEmailAndPassword(auth, email, password)
  }

  //  Logout ─
  const logout = async () => {
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, { expoPushToken: null })
      }

      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  //  Refresh user data
  const refreshUserData = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const fresh = userDoc.data() as UserData
        setUserData(fresh)
        await storeUserData(fresh)
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  // ── Permission helpers
  const hasPermission = (permission: string): boolean => {
    if (!userData) return false
    if (userData.role === 'main_admin') return true
    return (
      userData.permissions?.[permission as keyof typeof userData.permissions] ||
      false
    )
  }

  const isMainAdmin = () => userData?.role === 'main_admin'
  const isAssistantAdmin = () => userData?.role === 'assistant_admin'

  const value: AuthContextValue = {
    user,
    userData,
    role: userData?.role || null,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    isMainAdmin,
    isAssistantAdmin,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
