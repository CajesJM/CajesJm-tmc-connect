import { initializeApp } from 'firebase/app'
import { Auth, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: 'AIzaSyCdtS1KbDFuqAsCpC5HMoP0-9tULYZQyC0',
  authDomain: 'tmc-connect-92a46.firebaseapp.com',
  projectId: 'tmc-connect-92a46',
  storageBucket: 'tmc-connect-92a46.firebasestorage.app',
  messagingSenderId: '542575332413',
  appId: '1:542575332413:web:e522b8a86c2f9b4b4fee54',
  measurementId: 'G-1SKKFCZJ47',
}

const app = initializeApp(firebaseConfig)
let auth: Auth

const isNative =
  typeof navigator !== 'undefined' &&
  (navigator.product === 'ReactNative' ||
    navigator.userAgent === 'React Native')

if (isNative) {
  try {
    const { initializeAuth } = require('firebase/auth')
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default
    const { getReactNativePersistence } = require('firebase/auth')

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  } catch (error: any) {
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app)
      console.warn('Auth already initialized, using existing instance.')
    } else {
      throw error
    }
  }
} else {
  auth = getAuth(app)
}

const db = getFirestore(app)
const storage = getStorage(app)

export { auth, db, storage }
