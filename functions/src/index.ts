import { Expo } from 'expo-server-sdk'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onCall } from 'firebase-functions/v2/https'

admin.initializeApp()
const expo = new Expo()

// ─── Secure endpoint to save push token ──────────────────
export const registerPushToken = onCall(async (request) => {
  // request.auth is always available when authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to register for notifications.'
    )
  }

  const { expoPushToken } = request.data
  if (!expoPushToken || typeof expoPushToken !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The expoPushToken is required and must be a string.'
    )
  }

  const userRef = admin.firestore().collection('users').doc(request.auth.uid)
  await userRef.update({ expoPushToken })

  console.log(`Token saved for user ${request.auth.uid}`)
  return { success: true }
})

// ─── Send push when a new announcement is created ─────────
export const sendAnnouncementPushNotification = onDocumentCreated(
  'announcements/{announcementId}',
  async (event) => {
    const snapshot = event.data
    if (!snapshot) {
      console.log('No data associated with the event')
      return
    }

    const announcement = snapshot.data()

    const usersSnapshot = await admin
      .firestore()
      .collection('users')
      .where('expoPushToken', '!=', null)
      .get()

    const messages: any[] = []
    usersSnapshot.forEach((doc) => {
      const token = doc.data().expoPushToken

      if (!Expo.isExpoPushToken(token)) {
        console.error(`Invalid token for user ${doc.id}: ${token}`)
        return
      }

      messages.push({
        to: token,
        sound: 'default',
        title: announcement.title || 'New announcement',
        body: (announcement.content || '').substring(0, 100),
        data: { announcementId: event.params.announcementId },
      })
    })

    const chunks = expo.chunkPushNotifications(messages)
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk)
        console.log('Notifications sent successfully')
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }
  }
)

// ─── Send push when a new event is created ─────────
export const sendEventPushNotification = onDocumentCreated(
  'events/{eventId}',
  async (event) => {
    const snapshot = event.data
    if (!snapshot) {
      console.log('No data associated with the event')
      return
    }

    const eventData = snapshot.data()

    const usersSnapshot = await admin
      .firestore()
      .collection('users')
      .where('expoPushToken', '!=', null)
      .get()

    const messages: any[] = []
    usersSnapshot.forEach((doc) => {
      const token = doc.data().expoPushToken

      if (!Expo.isExpoPushToken(token)) {
        console.error(`Invalid token for user ${doc.id}: ${token}`)
        return
      }

      messages.push({
        to: token,
        sound: 'default',
        title: eventData.title || 'New event',
        body: (eventData.description || eventData.details || '').substring(
          0,
          100
        ),
        data: { eventId: event.params.eventId },
      })
    })

    const chunks = expo.chunkPushNotifications(messages)
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk)
        console.log('Event notifications sent successfully')
      } catch (error) {
        console.error('Error sending event notification:', error)
      }
    }
  }
)

// ─── Send push when a new penalty is created ─────────
export const sendPenaltyPushNotification = onDocumentCreated(
  'penalties/{penaltyId}',
  async (event) => {
    const snapshot = event.data
    if (!snapshot) {
      console.log('No data associated with the penalty event')
      return
    }

    const penalty = snapshot.data()

    // The penalized student's UID – adjust the field name if necessary
    const studentId: string | undefined = penalty.studentId
    if (!studentId) {
      console.error('Penalty document missing studentId')
      return
    }

    // 1. Fetch the student's push token from the users collection
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(studentId)
      .get()
    if (!userDoc.exists) {
      console.error(`User ${studentId} not found`)
      return
    }

    const userData = userDoc.data()
    const pushToken: string | undefined = userData?.expoPushToken

    if (!pushToken) {
      console.log(`User ${studentId} has no push token`)
      return
    }

    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Invalid push token for user ${studentId}: ${pushToken}`)
      return
    }

    // 2. Build the notification
    const title = penalty.eventTitle
      ? `Penalty: ${penalty.type} from ${penalty.eventTitle}`
      : `Penalty: ${penalty.type}`

    const body = (penalty.consequences || '').substring(0, 100)

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: {
        penaltyId: event.params.penaltyId,
        screen: 'penalties',
      },
    }

    // 3. Send it
    try {
      const tickets = await expo.sendPushNotificationsAsync([message])
      tickets.forEach((ticket) => {
        if (ticket.status === 'error') {
          console.error('Error sending penalty notification:', ticket.message)

          if (ticket.details?.error === 'DeviceNotRegistered') {
            admin.firestore().collection('users').doc(studentId).update({
              expoPushToken: null,
            })
          }
        }
      })
      console.log('Penalty notification sent to', studentId)
      await admin
        .firestore()
        .collection('penalties')
        .doc(event.params.penaltyId)
        .update({
          notified: true,
        })
    } catch (error) {
      console.error('Failed to send penalty notification:', error)
    }
  }
)
