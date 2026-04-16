import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Types
interface PenaltyData {
  eventId: string;
  eventTitle: string;
  eventDate: any;
  studentId: string;
  studentName: string;
  studentPushToken?: string;
  type: 'absence' | 'late' | 'misconduct';
  severity: 'low' | 'medium' | 'high';
  consequences: string;
  deadline: Date;
  createdBy: string;
}

interface PushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    screen: string;
    penaltyId: string;
    eventId: string;
  };
}

// Send push notification via Expo Push API
export const sendPushNotification = async (message: PushMessage) => {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification result:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

// Create penalty for single student
export const createPenalty = async (penaltyData: PenaltyData) => {
  try {
    // 1. Create penalty document in Firestore
    const penaltyRef = await addDoc(collection(db, 'penalties'), {
      ...penaltyData,
      status: 'pending',
      notified: false,
      createdAt: serverTimestamp(),
    });

    console.log('Penalty created:', penaltyRef.id);

    // 2. Send push notification if student has token
    if (penaltyData.studentPushToken && penaltyData.studentPushToken.startsWith('ExponentPushToken')) {
      await sendPushNotification({
        to: penaltyData.studentPushToken,
        sound: 'default',
        title: '⚠️ Attendance Penalty Notice',
        body: `You have a ${penaltyData.severity} penalty for missing: ${penaltyData.eventTitle}. Tap to view consequences.`,
        data: {
          screen: '/student/penalties',
          penaltyId: penaltyRef.id,
          eventId: penaltyData.eventId,
        },
      });

      // Update penalty as notified
      await updateDoc(doc(db, 'penalties', penaltyRef.id), {
        notified: true,
        notifiedAt: serverTimestamp(),
      });

      console.log('Push notification sent to student');
    } else {
      console.log('No valid push token for student');
    }

    // 3. Add penalty to user's penalties array
    const userRef = doc(db, 'users', penaltyData.studentId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentPenalties = userDoc.data().penalties || [];
      await updateDoc(userRef, {
        penalties: [...currentPenalties, {
          penaltyId: penaltyRef.id,
          eventTitle: penaltyData.eventTitle,
          status: 'pending',
          createdAt: new Date().toISOString(), 
        }],
        unreadPenaltiesCount: (userDoc.data().unreadPenaltiesCount || 0) + 1,
      });
    }
    return penaltyRef.id;
  } catch (error) {
    console.error('Error creating penalty:', error);
    throw error;
  }
};

// Create penalties for ALL missing students at once
export const createBulkPenalties = async (
  students: Array<{
    id: string;
    name: string;
    studentID: string;
    pushToken?: string;
  }>,
  eventData: {
    id: string;
    title: string;
    date: any;
  },
  penaltyConfig: {
    type: 'absence' | 'late' | 'misconduct';
    severity: 'low' | 'medium' | 'high';
    consequences: string;
    deadline: Date;
  },
  adminId: string
) => {
  const results = [];

  // Loop through each missing student
  for (const student of students) {
    try {
      const penaltyId = await createPenalty({
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.date,
        studentId: student.id,
        studentName: student.name,
        studentPushToken: student.pushToken,
        type: penaltyConfig.type,
        severity: penaltyConfig.severity,
        consequences: penaltyConfig.consequences,
        deadline: penaltyConfig.deadline,
        createdBy: adminId,
      });

      results.push({
        studentId: student.id,
        studentName: student.name,
        success: true,
        penaltyId
      });
    } catch (error) {
      console.error(`Failed to create penalty for ${student.name}:`, error);
      results.push({
        studentId: student.id,
        studentName: student.name,
        success: false,
        error
      });
    }
  }

  // Create announcement record for admin tracking
  await addDoc(collection(db, 'penaltyAnnouncements'), {
    eventId: eventData.id,
    eventTitle: eventData.title,
    message: penaltyConfig.consequences,
    consequences: penaltyConfig.consequences,
    deadline: Timestamp.fromDate(penaltyConfig.deadline),
    targetStudents: students.map(s => s.id),
    sentBy: adminId,
    sentAt: serverTimestamp(),
    totalRecipients: students.length,
    successfulDeliveries: results.filter(r => r.success).length,
    type: penaltyConfig.type,
    severity: penaltyConfig.severity,
  });

  console.log(`Bulk penalties complete: ${results.filter(r => r.success).length}/${students.length} successful`);
  return results;
};

// Get all penalties for a student
export const getStudentPenalties = async (studentId: string) => {
  try {
    const q = query(
      collection(db, 'penalties'),
      where('studentId', '==', studentId)
    );

    const snapshot = await getDocs(q);
    const penalties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by created date (newest first)
    penalties.sort((a: any, b: any) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });

    return penalties;
  } catch (error) {
    console.error('Error fetching student penalties:', error);
    throw error;
  }
};

// Update penalty status (completed or excused)
export const updatePenaltyStatus = async (
  penaltyId: string,
  status: 'completed' | 'excused',
  notes?: string
) => {
  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }

    if (notes) {
      updateData.notes = notes;
    }

    await updateDoc(doc(db, 'penalties', penaltyId), updateData);

    // Also update in user's penalties array
    // Note: In production, you might want to use a Cloud Function for this
    console.log(`Penalty ${penaltyId} marked as ${status}`);

    return true;
  } catch (error) {
    console.error('Error updating penalty status:', error);
    throw error;
  }
};

// Get student's push token from Firestore
export const getStudentPushToken = async (studentId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', studentId));
    return userDoc.data()?.expoPushToken || '';
  } catch (error) {
    console.error('Error fetching push token:', error);
    return '';
  }
};