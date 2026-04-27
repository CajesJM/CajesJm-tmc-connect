const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { Expo } = require('expo-server-sdk')
const { defineSecret } = require('firebase-functions/params')

admin.initializeApp()

// --- NEW: Define the Expo Access Token as a Secret Parameter ---
const expoAccessToken = defineSecret('EXPO_ACCESS_TOKEN')

/**
 * Keeps Firebase Auth email in sync when a user's email changes in Firestore.
 */
exports.syncUserEmail = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    // ... (your existing code kept exactly as is) ...
    const beforeData = change.before.data()
    const afterData = change.after.data()
    const userId = context.params.userId

    if (beforeData.email === afterData.email) {
      return null
    }

    const oldEmail = beforeData.email
    const newEmail = afterData.email

    console.log(
      `User ${userId} email changed from ${oldEmail} to ${newEmail}. Updating Auth...`
    )

    try {
      await admin.auth().updateUser(userId, { email: newEmail })
      console.log(`Successfully updated email for user ${userId}`)
    } catch (error) {
      console.error(`Failed to update email for user ${userId}:`, error)
    }

    return null
  })

/**
 * Sends an Expo push notification whenever a new notification document is
 * created in the 'notifications' collection.
 */
exports.sendPushOnNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notificationData = snap.data()

    // 1. Identify the target user
    const userId = notificationData.userId
    if (!userId) {
      console.error('Notification missing userId, aborting push.')
      return null
    }

    try {
      // 2. Fetch user profile
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .get()
      if (!userDoc.exists) {
        console.error('User not found:', userId)
        return null
      }

      const userData = userDoc.data()
      const pushToken = userData.expoPushToken
      const notificationsEnabled = userData.notificationEnabled !== false

      // 3. Validate token and preferences
      if (!pushToken) {
        console.log('No Expo push token for user:', userId)
        return null
      }

      if (!Expo.isExpoPushToken(pushToken)) {
        console.error('Invalid Expo push token for user:', userId, pushToken)
        return null
      }

      if (!notificationsEnabled) {
        console.log('Notifications disabled for user:', userId)
        return null
      }

      // 4. Build the push message
      const message = {
        to: pushToken,
        sound: 'default',
        title: notificationData.title || 'New Notification',
        body: notificationData.message || '',
        data: {
          screen: notificationData.data?.screen || '/(tabs)/notifications',
          ...notificationData.data,
        },
      }

      // 5. Initialize Expo client using the secret's value
      const expo = new Expo({ accessToken: expoAccessToken.value() })

      // 6. Send via Expo push service
      const ticket = await expo.sendPushNotificationsAsync([message])
      console.log('Push sent:', JSON.stringify(ticket))
    } catch (error) {
      console.error('Error processing push notification:', error)
    }

    return null
  })
