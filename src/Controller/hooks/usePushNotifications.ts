import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { useRouter } from 'expo-router'
import { doc, updateDoc } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { db } from '../../Model/lib/firebaseConfig'
import { useAuth } from '../context/AuthContext'

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>('')
  const [notification, setNotification] = useState<any>(null)
  const { user } = useAuth()
  const router = useRouter()

  const notificationListener = useRef<any>(null)
  const responseListener = useRef<any>(null)

  const isExpoGo = Constants.appOwnership === 'expo'

  if (isExpoGo) {
    console.log('Push notifications are disabled in Expo Go.')
    return { expoPushToken: '', notification: null }
  }

  useEffect(() => {
    let isMounted = true

    const setupNotifications = async () => {
      const Notifications = await import('expo-notifications')

      Notifications.default.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      })

      if (Platform.OS === 'android') {
        await Notifications.default.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        })
      }

      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.default.getPermissionsAsync()
        let finalStatus = existingStatus
        if (existingStatus !== 'granted') {
          const { status } =
            await Notifications.default.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus === 'granted') {
          const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId
          try {
            const pushTokenData =
              await Notifications.default.getExpoPushTokenAsync({ projectId })
            const token = pushTokenData.data
            if (isMounted) setExpoPushToken(token)

            // Save token to Firestore
            if (user?.uid) {
              const userRef = doc(db, 'users', user.uid)
              await updateDoc(userRef, { expoPushToken: token })
            }
          } catch (error) {
            console.error('Error getting push token:', error)
          }
        } else {
          console.log('Push notification permission denied')
        }
      } else {
        console.log('Must use physical device for push notifications')
      }

      // Set up listeners
      notificationListener.current =
        Notifications.default.addNotificationReceivedListener(
          (notification) => {
            if (isMounted) setNotification(notification)
          }
        )

      responseListener.current =
        Notifications.default.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data as {
              screen?: string
              params?: Record<string, string>
            }
            if (data?.screen) {
              router.push(data.screen as any)
            }
          }
        )
    }

    setupNotifications()

    return () => {
      isMounted = false
      // Cleanup listeners if they exist
      if (notificationListener.current) notificationListener.current.remove()
      if (responseListener.current) responseListener.current.remove()
    }
  }, [user, router])

  return { expoPushToken, notification }
}
