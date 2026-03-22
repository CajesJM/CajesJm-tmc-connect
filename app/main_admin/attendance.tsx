import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import {
  collection, doc, getDoc, getDocs, onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where, writeBatch
} from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import QRCode from 'react-native-qrcode-svg';
import PenaltyAnnouncementModal from '../../components/PenaltyAnnouncementModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from "../../lib/firebaseConfig";
import { createAttendanceStyles } from '../../styles/main-admin/attendanceStyles';

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

interface PenaltyStatus {
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  sentAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  completedBy?: string;
  cancelledBy?: string;
}

const FormTextInput = ({
  style,
  value,
  onChangeText,
  placeholder,
  inputStyle,
  ...props
}: {
  style?: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  inputStyle?: any;
  [key: string]: any;
}) => (
  <RNTextInput
    style={[inputStyle, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#94a3b8"
    {...props}
  />
);

interface Event {
  id: string;
  title: string;
  location: string;
  date: string | { seconds: number; nanoseconds: number };
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  qrExpiration?: string | null;
  isActive?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

interface AttendanceRecord {
  studentName: string;
  studentID: string;
  yearLevel: string;
  block: string;
  course: string;
  gender: string;
  timestamp?: string | { seconds: number; nanoseconds: number };
  role?: string;
  location?: {
    isWithinRadius: boolean;
    distance?: number;
    accuracy?: number;
  };
}
interface PenaltyRecord {
  eventId: string;
  eventTitle: string;
  status: 'pending' | 'paid';
  paidAt?: string;
  paidBy?: string;
  amount?: number;
  createdAt: string;
}
interface Student {
  id: string;
  name: string;
  studentID: string;
  yearLevel: string;
  block: string;
  course: string;
  role?: string;
}

export default function MainAdminAttendance() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDark } = useTheme();

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  const styles = useMemo(
    () => createAttendanceStyles(colors, isDark, isMobile, isTablet, isDesktop),
    [colors, isDark, isMobile, isTablet, isDesktop]
  );

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const qrWrapperRef = useRef<View>(null);
  const qrCodeRef = useRef<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [showExpirationModal, setShowExpirationModal] = useState<boolean>(false);
  const [customExpiration, setCustomExpiration] = useState<string>('');
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
  const [isCustomDatePickerVisible, setCustomDatePickerVisible] = useState(false);
  const [customExpirationDate, setCustomExpirationDate] = useState<Date | null>(null);
  const [quickOptions, setQuickOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedBlocks, setPaginatedBlocks] = useState<[string, AttendanceRecord[]][]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [eventItemsPerPage] = useState(5);

  const [students, setStudents] = useState<Student[]>([]);
  const [mode, setMode] = useState<'qr' | 'receipt'>('qr');
  const [searchQuery, setSearchQuery] = useState('');

  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [paidStudentIds, setPaidStudentIds] = useState<Set<string>>(new Set());
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [sentPenaltyEvents, setSentPenaltyEvents] = useState<Set<string>>(new Set());
  const [penaltyDetails, setPenaltyDetails] = useState<{ [eventId: string]: { studentIds: string[], sentAt: string } }>({});
  const [completedStudentIds, setCompletedStudentIds] = useState<Set<string>>(new Set());
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [selectedEventForAction, setSelectedEventForAction] = useState<Event | null>(null);



  // Pagination for missing list
  const [missingPage, setMissingPage] = useState(1);
  const missingItemsPerPage = 10;

  const isValidDate = (dateString: any): boolean => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  };


  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        console.log('Fetching students from Firestore...');
        const snapshot = await getDocs(collection(db, 'users'));
        console.log('Students snapshot size:', snapshot.size);

        const studentsList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((student: any) => {
            const role = (student.role || 'student').toString().toLowerCase().trim();
            return role === 'student';
          }) as Student[];

        console.log('Filtered students list (students only):', studentsList.length);
        console.log('Students docs:', studentsList.map(s => ({ name: s.name, role: s.role, studentID: s.studentID })));
        setStudents(studentsList);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);



  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsCollection = collection(db, 'events');
        const eventSnapshot = await getDocs(eventsCollection);

        const eventsList = eventSnapshot.docs.map(doc => {
          const eventData = doc.data();
          return {
            id: doc.id,
            title: eventData.title || '',
            location: eventData.location || '',
            date: eventData.date || '',
            coordinates: eventData.coordinates || null,
            qrExpiration: eventData.qrExpiration || null,
            isActive: eventData.isActive !== false,
            status: eventData.status || 'approved',
          };
        });
        setEvents(eventsList);
      } catch (error) {
        console.error('Error fetching events:', error);
        showAlert('Error', 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();


    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const updatedEvents = snapshot.docs.map(doc => {
        const eventData = doc.data();
        return {
          id: doc.id,
          title: eventData.title || '',
          location: eventData.location || '',
          date: eventData.date || '',
          coordinates: eventData.coordinates || null,
          qrExpiration: eventData.qrExpiration || null,
          isActive: eventData.isActive !== false,
          status: eventData.status || 'approved',
        };
      });
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, []);


  // QR expiration helpers
  const isQRCodeExpired = (event: Event | null): boolean => {
    if (!event) return false;
    if (event.isActive === false) return true;
    if (!event.qrExpiration) return false;
    try {
      const expirationTime = new Date(event.qrExpiration);
      const now = new Date();
      return now > expirationTime;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (showExpirationModal) {
      const now = new Date();
      const options = [
        { label: '1 hour', value: new Date(now.getTime() + 60 * 60 * 1000).toISOString() },
        { label: '6 hours', value: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString() },
        { label: '12 hours', value: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString() },
        { label: '24 hours', value: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() },
        { label: '1 week', value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      ];
      setQuickOptions(options);
    }
  }, [showExpirationModal]);

  useEffect(() => {
    if (!selectedEvent) return;

    const fetchPenaltyStatuses = async () => {
      try {
        const penaltiesQuery = query(
          collection(db, 'penalties'),
          where('eventId', '==', selectedEvent.id)
        );

        const penaltiesSnapshot = await getDocs(penaltiesQuery);

        const paidIds = new Set<string>();
        const completedIds = new Set<string>();
        const pendingIds = new Set<string>(); // Track pending penalties

        penaltiesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'paid') {
            paidIds.add(data.studentId);
          } else if (data.status === 'completed') {
            completedIds.add(data.studentId);
          } else if (data.status === 'pending') {
            pendingIds.add(data.studentId);
          }
        });

        setPaidStudentIds(paidIds);
        setCompletedStudentIds(completedIds);

        // Check if any penalties have been sent (pending or paid or completed)
        const hasAnyPenalties = penaltiesSnapshot.size > 0;
        if (hasAnyPenalties && !sentPenaltyEvents.has(selectedEvent.id)) {
          setSentPenaltyEvents(prev => new Set([...prev, selectedEvent.id]));
        }
      } catch (error) {
        console.error('Error fetching penalty statuses:', error);
      }
    };

    fetchPenaltyStatuses();

    // Real-time listener
    const penaltiesQuery = query(
      collection(db, 'penalties'),
      where('eventId', '==', selectedEvent.id)
    );

    const unsubscribe = onSnapshot(penaltiesQuery, (snapshot) => {
      const paidIds = new Set<string>();
      const completedIds = new Set<string>();
      const pendingIds = new Set<string>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'paid') {
          paidIds.add(data.studentId);
        } else if (data.status === 'completed') {
          completedIds.add(data.studentId);
        } else if (data.status === 'pending') {
          pendingIds.add(data.studentId);
        }
      });

      setPaidStudentIds(paidIds);
      setCompletedStudentIds(completedIds);

      // Update sent penalty status if any penalties exist
      const hasAnyPenalties = snapshot.size > 0;
      if (hasAnyPenalties && selectedEvent) {
        setSentPenaltyEvents(prev => new Set([...prev, selectedEvent.id]));
      }
    });

    return () => unsubscribe();
  }, [selectedEvent]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchSentPenalties = async () => {
      try {
        // Query penaltyAnnouncements collection to track what was sent
        const announcementsQuery = query(
          collection(db, 'penaltyAnnouncements'),
          where('sentBy', '==', user.uid)
        );

        const snapshot = await getDocs(announcementsQuery);
        const sentEvents = new Set<string>();
        const details: { [eventId: string]: { studentIds: string[], sentAt: string } } = {};

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.eventId) {
            sentEvents.add(data.eventId);
            details[data.eventId] = {
              studentIds: data.studentIds || [],
              sentAt: data.sentAt
            };
          }
        });

        setSentPenaltyEvents(sentEvents);
        setPenaltyDetails(details);
      } catch (error) {
        console.error('Error fetching sent penalties:', error);
      }
    };

    fetchSentPenalties();

    // Real-time listener
    const announcementsQuery = query(
      collection(db, 'penaltyAnnouncements'),
      where('sentBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
      const sentEvents = new Set<string>();
      const details: { [eventId: string]: { studentIds: string[], sentAt: string } } = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.eventId) {
          sentEvents.add(data.eventId);
          details[data.eventId] = {
            studentIds: data.studentIds || [],
            sentAt: data.sentAt
          };
        }
      });

      setSentPenaltyEvents(sentEvents);
      setPenaltyDetails(details);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Check if penalty was sent for this event
  const hasPenaltyBeenSent = (eventId: string): boolean => {
    return sentPenaltyEvents.has(eventId);
  };

  const hasStudentReceivedPenalty = (studentId: string): boolean => {
    if (!selectedEvent) return false;
    // Check by looking at the penalty status sets
    return paidStudentIds.has(studentId) ||
      completedStudentIds.has(studentId) ||
      (sentPenaltyEvents.has(selectedEvent.id) && missingAttendees.some(s => s.id === studentId));
  };

  // Record that penalties were sent (call this when sending penalty)
  const recordPenaltySent = async (eventId: string, studentIds: string[]) => {
    if (!user?.uid) return;

    try {
      const announcementId = `${eventId}_${user.uid}_${Date.now()}`;
      const announcementRef = doc(db, 'penaltyAnnouncements', announcementId);

      await setDoc(announcementRef, {
        eventId: eventId,
        studentIds: studentIds,
        sentBy: user.uid,
        sentAt: new Date().toISOString(),
        sentAtTimestamp: serverTimestamp(),
        count: studentIds.length
      });

      // Also update the event document to track that penalties were sent
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        penaltiesSent: true,
        penaltiesSentAt: new Date().toISOString(),
        penaltiesSentBy: user.uid,
        penaltiesCount: studentIds.length
      });

      showAlert('Success', `Penalty announcements sent to ${studentIds.length} students.`);
    } catch (error) {
      console.error('Error recording penalty sent:', error);
      showAlert('Error', 'Failed to record penalty announcement.');
    }
  };
  const getEventDateISO = (date: any): string => {
    if (!date) return '';
    if (typeof date === 'object' && date.toDate) {
      return date.toDate().toISOString();
    }
    if (typeof date === 'string') {
      const d = new Date(date);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    }
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toISOString();
    }
    return '';
  };
  const handleSendPenalty = async () => {

    if (!selectedEvent || !user) return;

    const penaltiesQuery = query(
      collection(db, 'penalties'),
      where('eventId', '==', selectedEvent.id)
    );
    const existingPenalties = await getDocs(penaltiesQuery);
    if (existingPenalties.size > 0) {
      showAlert('Already Sent', 'Penalties have already been sent for this event.');
      return;
    }

    if (missingAttendees.length === 0) {
      showAlert('No Students', 'There are no missing students to send penalties to.');
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);
      const studentIds: string[] = [];
      const timestamp = new Date().toISOString();

      for (const student of missingAttendees) {
        const penaltyId = `${selectedEvent.id}_${student.id}`;
        const penaltyRef = doc(db, 'penalties', penaltyId);
        studentIds.push(student.id);

        const penaltyData = {
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          eventDate: getEventDateISO(selectedEvent.date), // ✅ Added
          studentId: student.id,
          studentName: student.name,
          studentID: student.studentID,          // ✅ Add back if needed
          status: 'pending',                     // ✅ Must be 'pending'
          createdAt: timestamp,
          sentBy: user.uid,
          sentAt: timestamp,
          updatedAt: serverTimestamp()
        };

        batch.set(penaltyRef, penaltyData);

        // Also add to user's penalties array
        const userRef = doc(db, 'users', student.id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const existingPenalties = userData.penalties || [];
          existingPenalties.push({
            id: penaltyId,
            eventId: selectedEvent.id,
            eventTitle: selectedEvent.title,
            status: 'pending',
            createdAt: timestamp,
            sentAt: timestamp
          });
          batch.update(userRef, { penalties: existingPenalties });
        }
      }

      // Update event document
      const eventRef = doc(db, 'events', selectedEvent.id);
      batch.update(eventRef, {
        penaltiesSent: true,
        penaltiesSentAt: timestamp,
        penaltiesSentBy: user.uid,
        penaltiesCount: studentIds.length
      });

      await batch.commit();
      setSentPenaltyEvents(prev => new Set([...prev, selectedEvent.id]));
      setShowPenaltyModal(false);
      showAlert('Success', `Penalties sent to ${studentIds.length} students successfully!`);
    } catch (error) {
      console.error('Error sending penalties:', error);
      showAlert('Error', 'Failed to send penalties. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (selectedEvent && selectedEvent.qrExpiration && !isQRCodeExpired(selectedEvent)) {
      const updateTimeLeft = () => {
        const now = new Date();
        const expiration = new Date(selectedEvent.qrExpiration!);
        const diff = expiration.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('Expired');
          const updatedEvent = { ...selectedEvent, isActive: false };
          setSelectedEvent(updatedEvent);
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      };

      updateTimeLeft();
      intervalId = setInterval(updateTimeLeft, 1000);
    } else {
      setTimeLeft('');
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [selectedEvent]);

  const stopAttendance = () => {
    if (!selectedEvent) return;
    if (selectedEvent.isActive === false) {
      showAlert("Info", "Attendance is already stopped for this event");
      return;
    }
    setShowStopConfirmModal(true);
  };

  const confirmStopAttendance = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();

      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        isActive: false,
        qrExpiration: now
      });

      const updatedEvent = {
        ...selectedEvent,
        isActive: false,
        qrExpiration: now
      };
      setSelectedEvent(updatedEvent);

      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? updatedEvent : e
      ));

      setShowStopConfirmModal(false);

      showAlert("Success", "Attendance stopped successfully!");

    } catch (error) {
      console.error('Error stopping attendance:', error);
      showAlert("Error", "Failed to stop attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const generateEventQRCode = (event: Event) => {
    if (!event) return;

    const qrData = JSON.stringify({
      type: 'attendance',
      eventId: event.id,
      eventTitle: event.title,
      generatedAt: new Date().toISOString(),
      expiresAt: event.qrExpiration && isValidDate(event.qrExpiration)
        ? event.qrExpiration
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      usesManualExpiration: !!(event.qrExpiration && isValidDate(event.qrExpiration)),
      eventLocation: event.coordinates
    });

    setQrValue(qrData);
    setSelectedEvent(event);
    setShowEventModal(false);
    fetchAttendanceRecords(event.id);
  };

  const refreshAttendance = async () => {
    if (!selectedEvent) return;

    setRefreshing(true);
    await fetchAttendanceRecords(selectedEvent.id);
    setRefreshing(false);
  };

  const setManualExpiration = async () => {
    if (!selectedEvent || !customExpiration) return;

    if (!isValidDate(customExpiration)) {
      showAlert("Error", "Please enter a valid date and time");
      return;
    }

    const expirationDate = new Date(customExpiration);
    const now = new Date();

    if (expirationDate <= now) {
      showAlert("Error", "Expiration date must be in the future");
      return;
    }

    try {
      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        qrExpiration: customExpiration,
        isActive: true
      });

      const updatedEvent = {
        ...selectedEvent,
        qrExpiration: customExpiration,
        isActive: true
      };

      const newQrData = JSON.stringify({
        type: 'attendance',
        eventId: updatedEvent.id,
        eventTitle: updatedEvent.title,
        generatedAt: new Date().toISOString(),
        expiresAt: customExpiration,
        usesManualExpiration: true,
        eventLocation: updatedEvent.coordinates
      });

      setQrValue(newQrData);
      setSelectedEvent(updatedEvent);
      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? updatedEvent : e
      ));

      setCustomExpirationDate(null);
      setCustomExpiration('');

      showAlert("Success", "Expiration date set successfully!");
      setShowExpirationModal(false);
    } catch (error) {
      console.error('Error setting expiration:', error);
      showAlert("Error", "Failed to set expiration date");
    }
  };


  const clearManualExpiration = async () => {
    if (!selectedEvent) return;

    try {
      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        qrExpiration: null
      });

      showAlert("Success", "Expiration date cleared!");

      const updatedEvent = { ...selectedEvent, qrExpiration: null };
      setSelectedEvent(updatedEvent as Event);

      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? updatedEvent : e
      ));

    } catch (error) {
      console.error('Error clearing expiration:', error);
      showAlert("Error", "Failed to clear expiration date");
    }
  };

  const fetchAttendanceRecords = async (eventId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        console.log('Fetched event:', eventId);
        console.log('Full event data:', JSON.stringify(eventData, null, 2));
        console.log('Attendees array:', eventData.attendees);
        console.log('Attendees type:', typeof eventData.attendees);
        console.log('Is array?', Array.isArray(eventData.attendees));

        if (eventData.attendees && Array.isArray(eventData.attendees) && eventData.attendees.length > 0) {
          const validAttendees = eventData.attendees
            .filter((a: any) => a && (a.studentID || a.studentId))
            .map((a: any) => ({
              ...a,
              studentID: String(a.studentID || a.studentId),
              yearLevel: a.yearLevel || a.year || 'Unknown',
              block: a.block || 'No Block',
              studentName: a.studentName || a.name || 'Unknown'
            }));

          setAttendanceRecords(validAttendees);
          setCurrentPage(1);
        } else {
          console.log('No attendees found for event:', eventId);
          setAttendanceRecords([]);
        }
      } else {
        console.log('Event not found:', eventId);
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceRecords([]);
    }
  };

  const clearSelection = () => {
    setSelectedEvent(null);
    setQrValue('');
    setAttendanceRecords([]);
    setSelectedYearLevel('all');
    setSelectedBlock('all');
    setTimeLeft('');
    setCurrentPage(1);
    setSearchQuery('');
    setMissingPage(1);
  };


  const hasStudentPaid = (studentId: string): boolean => {
    return paidStudentIds.has(studentId);
  };

  const hasStudentCompleted = (studentId: string): boolean => {
    return completedStudentIds.has(studentId);
  };

  const handleMarkAsPaid = async (student: Student) => {
    if (!selectedEvent || !user) return;

    try {
      setProcessingPayment(student.id);

      const penaltyId = `${selectedEvent.id}_${student.id}`;
      const penaltyRef = doc(db, 'penalties', penaltyId);

      const penaltyData = {
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        eventDate: getEventDateISO(selectedEvent.date),
        studentId: student.id,
        studentName: student.name,
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      // Create/update the penalty record
      await setDoc(penaltyRef, penaltyData);

      // Also update the user's profile penalties array
      const userRef = doc(db, 'users', student.id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const existingPenalties = userData.penalties || [];

        // Check if penalty for this event already exists
        const penaltyIndex = existingPenalties.findIndex(
          (p: any) => p.eventId === selectedEvent.id
        );

        let updatedPenalties;
        if (penaltyIndex >= 0) {
          // Update existing penalty to paid
          updatedPenalties = [...existingPenalties];
          updatedPenalties[penaltyIndex] = {
            ...updatedPenalties[penaltyIndex],
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidBy: user.uid,
          };
        } else {
          // Add new penalty record as paid
          updatedPenalties = [
            ...existingPenalties,
            {
              id: penaltyId,
              eventId: selectedEvent.id,
              eventTitle: selectedEvent.title,
              status: 'paid',
              createdAt: new Date().toISOString(),
              paidAt: new Date().toISOString(),
              paidBy: user.uid,
            }
          ];
        }

        await updateDoc(userRef, { penalties: updatedPenalties });
      }

      showAlert('Success', `${student.name} has been marked as paid for ${selectedEvent.title}.`);

      // Optimistically update local state
      setPaidStudentIds(prev => new Set([...prev, student.id]));

    } catch (error) {
      console.error('Error marking as paid:', error);
      showAlert('Error', 'Failed to mark as paid. Please try again.');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleCompletePenalty = async (student: Student, event: Event) => {
    // Fallback: try auth.currentUser if context user is null
    let currentUser = user;
    if (!currentUser && auth.currentUser) {
      console.log('Using auth.currentUser as fallback');
      currentUser = auth.currentUser;
    }
    if (!currentUser) {
      console.error('No user found in context or auth');
      showAlert('Error', 'You must be logged in to perform this action.');
      return;
    }

    console.log('=== Starting handleCompletePenalty ===');
    console.log('Student:', student.name, student.id);
    console.log('Event:', event.id, event.title);
    console.log('User:', currentUser.uid);

    try {
      setProcessingAction(student.id);
      console.log('Processing action set for', student.id);

      // Query for the penalty document using studentId and eventId
      const penaltiesQuery = query(
        collection(db, 'penalties'),
        where('studentId', '==', student.id),
        where('eventId', '==', event.id)
      );
      console.log('Executing query...');
      const snapshot = await getDocs(penaltiesQuery);
      console.log('Query snapshot size:', snapshot.size);

      if (snapshot.empty) {
        console.error('No penalty found for this student and event');
        showAlert('Error', 'Penalty record not found. Please ensure a penalty was sent for this student.');
        setProcessingAction(null);
        setShowCompleteConfirmModal(false);
        setSelectedStudentForAction(null);
        setSelectedEventForAction(null);
        return;
      }

      const penaltyDoc = snapshot.docs[0];
      console.log('Penalty document found:', penaltyDoc.id);
      console.log('Penalty data:', penaltyDoc.data());

      const penaltyRef = doc(db, 'penalties', penaltyDoc.id);
      console.log('Updating penalty document...');

      await updateDoc(penaltyRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: currentUser.uid,
        updatedAt: serverTimestamp()
      });
      console.log('Penalty document updated successfully');

      // Also update user's penalties array
      const userRef = doc(db, 'users', student.id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        console.log('Updating user penalties array...');
        const userData = userDoc.data();
        const existingPenalties = userData.penalties || [];

        const updatedPenalties = existingPenalties.map((p: any) =>
          p.eventId === event.id
            ? { ...p, status: 'completed', completedAt: new Date().toISOString() }
            : p
        );

        await updateDoc(userRef, { penalties: updatedPenalties });
        console.log('User penalties updated');
      }

      // Update local state
      setCompletedStudentIds(prev => new Set([...prev, student.id]));
      console.log('Local state updated');

      showAlert('Success', `${student.name}'s penalty has been marked as completed.`);
      console.log('=== Completed successfully ===');

    } catch (error) {
      console.error('Error in handleCompletePenalty:', error);
      showAlert('Error', 'Failed to complete penalty. Please try again.');
    } finally {
      setProcessingAction(null);
      setShowCompleteConfirmModal(false);
      setSelectedStudentForAction(null);
      setSelectedEventForAction(null);
    }
  };

  const handleCancelCompletion = async (student: Student, event: Event) => {
    let currentUser = user;
    if (!currentUser && auth.currentUser) {
      console.log('Using auth.currentUser as fallback for cancel');
      currentUser = auth.currentUser;
    }
    if (!currentUser) {
      console.error('No user found for cancel');
      showAlert('Error', 'You must be logged in.');
      return;
    }

    try {
      setProcessingAction(student.id);

      const penaltiesQuery = query(
        collection(db, 'penalties'),
        where('studentId', '==', student.id),
        where('eventId', '==', event.id)
      );
      const snapshot = await getDocs(penaltiesQuery);

      if (snapshot.empty) {
        console.error('No penalty found for this student and event');
        showAlert('Error', 'Penalty record not found.');
        return;
      }

      const penaltyDoc = snapshot.docs[0];
      const penaltyRef = doc(db, 'penalties', penaltyDoc.id);

      await updateDoc(penaltyRef, {
        status: 'pending',
        cancelledAt: new Date().toISOString(),
        cancelledBy: currentUser.uid,
        completedAt: null,
        completedBy: null,
        updatedAt: serverTimestamp()
      });

      const userRef = doc(db, 'users', student.id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const existingPenalties = userData.penalties || [];

        const updatedPenalties = existingPenalties.map((p: any) =>
          p.eventId === event.id
            ? { ...p, status: 'pending', cancelledAt: new Date().toISOString() }
            : p
        );

        await updateDoc(userRef, { penalties: updatedPenalties });
      }

      setCompletedStudentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });

      showAlert('Success', `${student.name}'s completion has been cancelled.`);
    } catch (error) {
      console.error('Error cancelling completion:', error);
      showAlert('Error', 'Failed to cancel completion. Please try again.');
    } finally {
      setProcessingAction(null);
      setShowCancelConfirmModal(false);
      setSelectedStudentForAction(null);
      setSelectedEventForAction(null);
    }
  };

  const captureAndSaveQR = async () => {
    if (!qrCodeRef.current) {
      showAlert('Error', 'QR code reference not found');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // Get the SVG as a data URL
        qrCodeRef.current.toDataURL(async (dataUrl: string) => {
          try {
            // Convert the data URL to a blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            // Open a new window with the QR image and event details
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
              <html>
                <head>
                  <title>QR Code - ${selectedEvent?.title || 'Event'}</title>
                  <style>
                    body {
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      min-height: 100vh;
                      margin: 0;
                      font-family: Arial, sans-serif;
                      background: white;
                    }
                    .container {
                      text-align: center;
                      padding: 20px;
                      max-width: 90%;
                    }
                    .qr-image {
                      max-width: 300px;
                      height: auto;
                      border: 1px solid #ccc;
                      padding: 20px;
                      background: white;
                      box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .title {
                      font-size: 24px;
                      margin-bottom: 20px;
                    }
                    .details {
                      margin-top: 20px;
                      color: #666;
                    }
                    @media print {
                      .no-print {
                        display: none;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="title">${selectedEvent?.title || 'Event QR Code'}</div>
                    <img src="${objectUrl}" class="qr-image" />
                    <div class="details">
                      <p>Event: ${selectedEvent?.title}</p>
                      <p>Date: ${selectedEvent?.date ? formatDate(selectedEvent.date) : 'N/A'}</p>
                      <p>Location: ${selectedEvent?.location}</p>
                    </div>
                    <div class="no-print" style="margin-top: 30px;">
                      <button onclick="window.print();">Print / Save as PDF</button>
                      <p style="font-size: 12px;">Use the print dialog to save as PDF or print directly.</p>
                    </div>
                  </div>
                  <script>
                    // Auto‑print after the image loads
                    const img = document.querySelector('.qr-image');
                    if (img.complete) {
                      setTimeout(() => window.print(), 500);
                    } else {
                      img.onload = () => setTimeout(() => window.print(), 500);
                    }
                    // Clean up object URL after printing
                    window.addEventListener('beforeunload', () => URL.revokeObjectURL('${objectUrl}'));
                  </script>
                </body>
              </html>
            `);
              printWindow.document.close();
              showAlert('Print Ready', 'A new window opened. Use the print dialog to save as PDF or print.');
            } else {
              showAlert('Popup Blocked', 'Please allow popups to print the QR code.');
            }
          } catch (err) {
            console.error('Error processing QR:', err);
            showAlert(
              'Download Failed',
              'Could not prepare QR code. Please right‑click on the QR code above and select "Save image as..."'
            );
          }
        });
      } else {
        // Native: save to gallery (unchanged)
        if (Platform.OS === 'ios') {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            showAlert('Permission Denied', 'We need permission to save images to your device.');
            return;
          }
        }

        const dataUrl = await qrCodeRef.current.toDataURL();
        const base64Data = dataUrl.split(',')[1];
        const fileUri = (FileSystem as any).documentDirectory + `qr_${selectedEvent?.id}_${Date.now()}.png`;
        await (FileSystem as any).writeAsStringAsync(fileUri, base64Data, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Event QR Codes', asset, false);
        showAlert('Success', 'QR code saved to your gallery!');
      }
    } catch (error) {
      console.error('Error saving QR:', error);
      showAlert('Error', 'Failed to save QR code. Please try again.');
    }
  };

  const formatDate = (dateValue: string | { seconds: number; nanoseconds: number } | any) => {
    if (!dateValue) return null;

    try {
      let date: Date;

      if (typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === 'string') {
        if (!isValidDate(dateValue)) return null;
        date = new Date(dateValue);
      } else {
        return null;
      }

      if (isNaN(date.getTime())) return null;

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  const getEventStatusBadge = (eventDate: any) => {
    if (!eventDate) return null;

    let date: Date;
    try {
      if (typeof eventDate === 'object' && eventDate?.seconds) {
        date = new Date(eventDate.seconds * 1000);
      } else if (typeof eventDate === 'string') {
        date = new Date(eventDate);
      } else {
        return null;
      }
      if (isNaN(date.getTime())) return null;
    } catch {
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = eventDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'TODAY', color: '#16a34a' };
    if (diffDays === 1) return { text: 'TOMORROW', color: '#2563eb' };
    if (diffDays > 1) return { text: 'UPCOMING', color: '#8b5cf6' };
    return { text: 'PAST', color: '#64748b' };
  };

  const formatShortDate = (dateValue: string | { seconds: number; nanoseconds: number } | any) => {
    if (!dateValue) return null;

    try {
      let date: Date;

      if (typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === 'string') {
        if (!isValidDate(dateValue)) return null;
        date = new Date(dateValue);
      } else {
        return null;
      }

      if (isNaN(date.getTime())) return null;

      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  const formatTime = (timestamp: string | { seconds: number; nanoseconds: number } | undefined) => {
    if (!timestamp) return 'N/A';

    try {
      let date: Date;

      if (typeof timestamp === 'object' && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }

      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDateForWebInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const localDateString = event.target.value;
    if (!localDateString) return;

    try {
      const [datePart, timePart] = localDateString.split('T');
      if (!datePart || !timePart) return;

      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);

      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) return;

      if (year < 2000 || year > 2100) return;
      if (month < 1 || month > 12) return;
      if (day < 1 || day > 31) return;
      if (hours < 0 || hours > 23) return;
      if (minutes < 0 || minutes > 59) return;

      const selectedDate = new Date(year, month - 1, day, hours, minutes);
      if (isNaN(selectedDate.getTime())) return;

      setCustomExpirationDate(selectedDate);
      setCustomExpiration(selectedDate.toISOString());
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  };

  const studentAttendanceRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      if (record.role) {
        return record.role.toString().toLowerCase().trim() === 'student';
      }
      const studentId = String(record.studentID).trim().toLowerCase();
      return students.some(s => String(s.studentID).trim().toLowerCase() === studentId);
    });
  }, [attendanceRecords, students]);

  const getFilteredAttendanceRecords = useMemo(() => {
    let filtered = studentAttendanceRecords;
    if (selectedYearLevel !== 'all') {
      filtered = filtered.filter(record =>
        record.yearLevel?.toString() === selectedYearLevel.toString()
      );
    }
    if (selectedBlock !== 'all') {
      filtered = filtered.filter(record =>
        record.block?.toString() === selectedBlock.toString()
      );
    }
    return filtered;
  }, [studentAttendanceRecords, selectedYearLevel, selectedBlock]);

  const missingAttendees = useMemo(() => {
    if (!students.length) return [];
    if (!studentAttendanceRecords.length) return students;

    const attendedIds = new Set(studentAttendanceRecords.map(r => String(r.studentID).trim().toLowerCase()));
    return students.filter(s => {
      const studentId = String(s.studentID).trim().toLowerCase();
      return !attendedIds.has(studentId);
    });
  }, [studentAttendanceRecords, students]);

  const getFilteredMissing = useMemo(() => {
    let filtered = missingAttendees;
    if (selectedYearLevel !== 'all') {
      filtered = filtered.filter(s => {
        const studentYear = String(s.yearLevel || '');
        return studentYear.includes(selectedYearLevel);
      });
    }
    if (selectedBlock !== 'all') {
      filtered = filtered.filter(s => s.block?.toString() === selectedBlock.toString());
    }
    return filtered;
  }, [missingAttendees, selectedYearLevel, selectedBlock]);

  useEffect(() => {
    console.log('=== DEBUG ATTENDANCE ===');
    console.log('Total attendance records:', attendanceRecords.length);
    console.log('Total students in system:', students.length);
    console.log('Missing attendees count:', missingAttendees.length);
    console.log('Sample attendance record:', attendanceRecords[0]);
    console.log('Sample student:', students[0]);
    console.log('========================');
  }, [attendanceRecords, students, missingAttendees]);

  const filteredAttendedBySearch = useMemo(() => {
    if (!searchQuery.trim()) return getFilteredAttendanceRecords;
    const query = searchQuery.toLowerCase();
    return getFilteredAttendanceRecords.filter(record =>
      record.studentName.toLowerCase().includes(query) ||
      record.studentID.toLowerCase().includes(query)
    );
  }, [getFilteredAttendanceRecords, searchQuery]);

  const filteredMissingBySearch = useMemo(() => {
    if (!searchQuery.trim()) return getFilteredMissing;
    const query = searchQuery.toLowerCase();
    return getFilteredMissing.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.studentID.toLowerCase().includes(query)
    );
  }, [getFilteredMissing, searchQuery]);

  const allYearLevels = useMemo(() => {
    const levels = students.map(s => s.yearLevel).filter(Boolean);
    const normalizedLevels = levels.map(level => {
      const match = String(level).match(/\d+/);
      return match ? match[0] : level;
    });
    return [...new Set(normalizedLevels)];
  }, [students]);

  const allBlocks = useMemo(() => {
    return [...new Set(students.map(s => s.block).filter(Boolean))];
  }, [students]);

  const getStudentsByBlock = useMemo(() => {
    const blocks: { [key: string]: AttendanceRecord[] } = {};
    filteredAttendedBySearch.forEach(record => {
      const block = record.block || 'No Block';
      if (!blocks[block]) blocks[block] = [];
      blocks[block].push(record);
    });
    Object.keys(blocks).forEach(block => {
      blocks[block].sort((a, b) => a.studentName.localeCompare(b.studentName));
    });
    const sortedBlocks: { [key: string]: AttendanceRecord[] } = {};
    Object.keys(blocks)
      .sort((a, b) => {
        if (a === 'No Block') return 1;
        if (b === 'No Block') return -1;
        return parseInt(a) - parseInt(b);
      })
      .forEach(key => {
        sortedBlocks[key] = blocks[key];
      });
    return sortedBlocks;
  }, [filteredAttendedBySearch]);

  useEffect(() => {
    const blocksArray = Object.entries(getStudentsByBlock);
    const total = Math.ceil(blocksArray.length / itemsPerPage);
    setTotalPages(total || 1);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBlocks(blocksArray.slice(startIndex, endIndex));
  }, [getStudentsByBlock, currentPage, itemsPerPage]);

  const totalMissingPages = Math.ceil(filteredMissingBySearch.length / missingItemsPerPage);
  const paginatedMissing = useMemo(() => {
    const start = (missingPage - 1) * missingItemsPerPage;
    return filteredMissingBySearch.slice(start, start + missingItemsPerPage);
  }, [filteredMissingBySearch, missingPage]);

  useEffect(() => {
    setMissingPage(1);
  }, [selectedYearLevel, selectedBlock, searchQuery]);

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'pending': return { backgroundColor: '#f59e0b' };
      case 'approved': return { backgroundColor: '#10b981' };
      case 'rejected': return { backgroundColor: '#ef4444' };
      default: return { backgroundColor: '#64748b' };
    }
  };

  const availableBlocks = useMemo(() => {
    const uniqueBlocks = [...new Set(studentAttendanceRecords.map(record => record.block).filter(Boolean))];
    return uniqueBlocks.sort((a, b) => {
      if (a === 'No Block') return 1;
      if (b === 'No Block') return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [studentAttendanceRecords]);

  const availableYearLevels = useMemo(() => {
    const levels = [...new Set(studentAttendanceRecords.map(record => record.yearLevel).filter(Boolean))];
    return levels.sort((a, b) => parseInt(a) - parseInt(b));
  }, [studentAttendanceRecords]);

  const isCurrentQRExpired = selectedEvent ? isQRCodeExpired(selectedEvent) : false;

  const stats = useMemo(() => ({
    total: getFilteredAttendanceRecords.length,
    verified: getFilteredAttendanceRecords.filter(r => r.location?.isWithinRadius).length,
    blocksCount: availableBlocks.length,
    totalStudents: students.length,
    totalAttended: studentAttendanceRecords.length
  }), [getFilteredAttendanceRecords, availableBlocks, students.length, studentAttendanceRecords.length]);

  const eventStatusStats = useMemo(() => {
    const total = events.length;
    const pending = events.filter(e => e.status === 'pending').length;
    const approved = events.filter(e => e.status === 'approved').length;
    const rejected = events.filter(e => e.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [events]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={[styles.paginationContainer, isMobile && styles.paginationContainerMobile]}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={16} color={currentPage === 1 ? colors.sidebar.text.muted : colors.accent.primary} />
          <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Prev</Text>
        </TouchableOpacity>
        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>{currentPage}/{totalPages}</Text>
        </View>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
          <Feather name="chevron-right" size={16} color={currentPage === totalPages ? colors.sidebar.text.muted : colors.accent.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const generateMissingReceipt = () => {
    if (!selectedEvent) {
      showAlert('No Event', 'Please select an event first.');
      return;
    }
    const list = getFilteredMissing;
    if (list.length === 0) {
      showAlert('No Data', 'There are no missing students to generate a receipt for.');
      return;
    }
    showAlert(
      'Receipt Generated',
      `Event: ${selectedEvent.title}\nMissing students: ${list.length}\nIn a real implementation, a PDF would be created and saved.`
    );
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Missing Students Receipt</title></head>
            <body>
              <h1>${selectedEvent.title}</h1>
              <p>Date: ${formatDate(selectedEvent.date) || 'N/A'}</p>
              <h2>Missing Students</h2>
              <ul>
                ${list.map(s => `<li>${s.name} (${s.studentID})</li>`).join('')}
              </ul>
            </body>
          </html>
        `);
        printWindow.print();
      }
    }
  };

  const totalEventPages = Math.ceil(events.length / eventItemsPerPage);
  const paginatedEvents = useMemo(() => {
    const start = (eventPage - 1) * eventItemsPerPage;
    const end = start + eventItemsPerPage;
    return events.slice(start, end);
  }, [events, eventPage, eventItemsPerPage]);

  const renderEventItem = ({ item }: { item: Event }) => {
    const isExpired = isQRCodeExpired(item);
    const isActive = item.isActive !== false && !isExpired;
    const isApproved = item.status === 'approved';

    return (
      <TouchableOpacity
        style={[styles.eventItem, isMobile && styles.eventItemMobile, !isApproved && { opacity: 0.5 }]}
        onPress={() => {
          if (!isApproved) {
            showAlert('Event Not Approved', `This event is ${item.status}. Only approved events can be used for attendance.`);
            return;
          }
          generateEventQRCode(item);
        }}
        activeOpacity={isApproved ? 0.7 : 1}
      >
        <View style={styles.eventItemContent}>
          <Text style={[styles.eventItemName, isMobile && styles.eventItemNameMobile]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.eventItemBadges}>
            {(() => {
              const dateBadge = getEventStatusBadge(item.date);
              if (dateBadge) {
                return (
                  <View style={[styles.eventItemExpBadge, { backgroundColor: dateBadge.color }]}>
                    <Text style={[styles.eventItemExpText, { color: '#ffffff' }]}>{dateBadge.text}</Text>
                  </View>
                );
              }
              return null;
            })()}
            <View style={[styles.eventItemStatusBadge, getStatusBadgeStyle(item.status)]}>
              <Text style={styles.eventItemStatusText}>{item.status?.toUpperCase() || 'APPROVED'}</Text>
            </View>
            {item.qrExpiration && isValidDate(item.qrExpiration) && (
              <View style={[styles.eventItemExpBadge, isExpired && styles.eventItemExpBadgeExpired]}>
                <Feather name="clock" size={10} color={isExpired ? "#dc2626" : "#d97706"} />
                <Text style={[styles.eventItemExpText, isExpired && styles.eventItemExpTextExpired]}>
                  {isExpired ? 'Expired' : 'QR'}
                </Text>
              </View>
            )}
            {isActive && isApproved && (
              <View style={styles.eventItemActiveBadge}>
                <Feather name="check-circle" size={10} color="#16a34a" />
                <Text style={styles.eventItemActiveText}>Active</Text>
              </View>
            )}
          </View>
        </View>
        {formatShortDate(item.date) && (
          <Text style={styles.eventItemDate} numberOfLines={1}>{formatShortDate(item.date)}</Text>
        )}
        <View style={styles.eventItemFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="map-pin" size={10} color={colors.sidebar.text.secondary} />
            <Text style={[styles.eventItemLocation, { marginLeft: 4 }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          {item.coordinates && (
            <View style={styles.eventItemLocBadge}>
              <Feather name="shield" size={10} color="#16a34a" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderBlockSection = ({ item }: { item: [string, AttendanceRecord[]] }) => {
    const [block, students] = item;
    return (
      <View style={styles.blockSection}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Block {block}</Text>
          <Text style={styles.blockCount}>{students.length}</Text>
        </View>
        {students.map((record, index) => (
          <View key={index} style={[styles.attendanceItem, isMobile && styles.attendanceItemMobile]}>
            <View style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, isMobile && styles.studentNameMobile]} numberOfLines={1}>
                  {record.studentName}
                </Text>
                <Text style={styles.studentId}>{record.studentID}</Text>
              </View>
              <View style={styles.attendanceMeta}>
                {record.location && (
                  <View style={[
                    styles.locationBadge,
                    record.location.isWithinRadius ? styles.locationBadgeValid : styles.locationBadgeInvalid
                  ]}>
                    <Feather name={record.location.isWithinRadius ? "check" : "x"} size={10}
                      color={record.location.isWithinRadius ? "#16a34a" : "#dc2626"} />
                    <Text style={[
                      styles.locationBadgeText,
                      record.location.isWithinRadius ? styles.locationBadgeTextValid : styles.locationBadgeTextInvalid
                    ]}>
                      {record.location.isWithinRadius ? 'Verified' : 'Too Far'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.studentDetails} numberOfLines={1}>
              {record.course} • Year {record.yearLevel}
            </Text>
            <View style={styles.attendanceTimeContainer}>
              <Feather name="clock" size={12} color={colors.sidebar.text.muted} />
              <Text style={styles.attendanceTimeText}>
                Attended at: {formatTime(record.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const headerGradientColors = isDark
    ? ['#0f172a', '#1e293b'] as const
    : ['#1e40af', '#3b82f6'] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={headerGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
      >
        <View style={[styles.headerContent, isMobile && styles.headerContentMobile]}>
          <View>
            <Text style={[styles.greetingText, isMobile && styles.greetingTextMobile]}>Welcome back,</Text>
            <Text style={[styles.userName, isMobile && styles.userNameMobile]}>{userData?.name || 'Admin'}</Text>
            <Text style={[styles.roleText, isMobile && styles.roleTextMobile]}>Attendance Manager</Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, isMobile && styles.profileButtonMobile]} onPress={() => router.push('/main_admin/profile')}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={[styles.profileInitials, isMobile && styles.profileInitialsMobile]}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={[styles.dateSection, isMobile && styles.dateSectionMobile]}>
          <View style={[styles.dateContainer, isMobile && styles.dateContainerMobile]}>
            <Feather name="calendar" size={isMobile ? 10 : 12} color={colors.sidebar.text.muted} />
            <Text style={[styles.dateText, isMobile && styles.dateTextMobile]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: isMobile ? 'short' : 'long',
                year: 'numeric',
                month: isMobile ? 'short' : 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.mainScrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
          {/* Left Grid */}
          <View style={[styles.leftGrid, isMobile && styles.leftGridMobile]}>
            <View style={[styles.leftHeader, isMobile && styles.leftHeaderMobile]}>
              <Text style={[styles.leftTitle, isMobile && styles.leftTitleMobile]}>
                {mode === 'qr' ? 'QR Code Generator' : 'Receipt Generator'}
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Select Event</Text>
              <TouchableOpacity
                style={[styles.eventSelector, isMobile && styles.eventSelectorMobile]}
                onPress={() => { setShowEventModal(true); setEventPage(1); }}
              >
                {selectedEvent ? (
                  <Text style={[styles.eventSelectorText, isMobile && styles.eventSelectorTextMobile]} numberOfLines={1}>
                    {selectedEvent.title}
                  </Text>
                ) : (
                  <Text style={styles.eventSelectorPlaceholder}>Tap to select an event</Text>
                )}
                <Feather name="chevron-down" size={20} color={colors.sidebar.text.secondary} style={styles.eventSelectorIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity style={[styles.modeButton, mode === 'qr' && styles.modeButtonActive]} onPress={() => setMode('qr')}>
                <Feather name="grid" size={16} color={mode === 'qr' ? '#ffffff' : colors.sidebar.text.secondary} />
                <Text style={[styles.modeButtonText, mode === 'qr' && styles.modeButtonTextActive]}>QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modeButton, mode === 'receipt' && styles.modeButtonActive]} onPress={() => setMode('receipt')}>
                <Feather name="file-text" size={16} color={mode === 'receipt' ? '#ffffff' : colors.sidebar.text.secondary} />
                <Text style={[styles.modeButtonText, mode === 'receipt' && styles.modeButtonTextActive]}>Receipt</Text>
              </TouchableOpacity>
            </View>

            {selectedEvent && mode === 'qr' && (
              <>
                <View style={[styles.qrContainer, isMobile && styles.qrContainerMobile]}>
                  {/* Event Header */}
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventName, isMobile && styles.eventNameMobile]} numberOfLines={1}>
                      {selectedEvent.title}
                    </Text>
                    <View style={styles.eventDetailsRow}>

                      <Text style={styles.eventDetailText}>{formatDate(selectedEvent.date)}</Text>
                      <View style={styles.bullet} />
                      <Feather name="map-pin" size={12} color={colors.sidebar.text.secondary} />
                      <Text style={styles.eventDetailText}>{selectedEvent.location}</Text>
                    </View>
                    {selectedEvent.coordinates && (
                      <View style={styles.locationVerificationBadge}>
                        <Feather name="shield" size={12} color="#16a34a" />
                        <Text style={styles.locationVerificationText}>Location Verification Enabled</Text>
                      </View>
                    )}
                  </View>

                  {/* QR Code Frame with ref for capture */}
                  <View ref={qrWrapperRef} style={styles.qrFrame}>
                    <View style={styles.qrCodeWrapper}>
                      {!isCurrentQRExpired ? (
                        <>
                          <QRCode
                            value={qrValue}
                            getRef={(c) => (qrCodeRef.current = c)}
                            size={isMobile ? 180 : 220}
                            color={colors.text}
                            backgroundColor={colors.card}
                          />
                          <View style={styles.qrLabel}>
                            <Feather name="camera" size={12} color={colors.sidebar.text.muted} />
                            <Text style={styles.qrLabelText}>Scan to verify attendance</Text>
                          </View>
                        </>
                      ) : (
                        <View style={styles.expiredOverlay}>
                          <Feather name="x-circle" size={48} color="#dc2626" />
                          <Text style={styles.expiredText}>QR Code Expired</Text>
                          <Text style={styles.expiredSubtext}>Generate a new code to continue</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={styles.qrStatus}>
                    <View style={[styles.statusBadge, isCurrentQRExpired ? styles.statusBadgeExpired : styles.statusBadgeActive]}>
                      {isCurrentQRExpired ? (
                        <>
                          <Feather name="x-circle" size={12} color="#dc2626" />
                          <Text style={[styles.statusBadgeText, styles.statusBadgeTextExpired]}>QR Expired</Text>
                        </>
                      ) : (
                        <>
                          <Feather name="check-circle" size={12} color="#16a34a" />
                          <Text style={[styles.statusBadgeText, styles.statusBadgeTextActive]}>
                            {timeLeft ? `Valid for ${timeLeft}` : 'Active'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Download Button (only if QR active) */}
                  {!isCurrentQRExpired && (
                    <View style={styles.downloadButtonContainer}>
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={captureAndSaveQR}
                        activeOpacity={0.7}
                      >
                        <Feather name="download" size={16} color="#ffffff" />
                        <Text style={styles.downloadButtonText}>Save QR</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Expiration hint */}
                  {selectedEvent.qrExpiration && !isCurrentQRExpired && (
                    <Text style={styles.expirationHint}>
                      Expires: {new Date(selectedEvent.qrExpiration).toLocaleString()}
                    </Text>
                  )}
                </View>
                <View style={[styles.actionButtons, isMobile && styles.actionButtonsMobile]}>
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary, isMobile && styles.actionButtonMobile]} onPress={() => setShowExpirationModal(true)}>
                    <Feather name="clock" size={16} color="#ffffff" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary, isMobile && styles.actionButtonTextMobile]}>Set Expiration</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger, isMobile && styles.actionButtonMobile]} onPress={stopAttendance}>
                    <Feather name="stop-circle" size={16} color="#ffffff" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary, isMobile && styles.actionButtonTextMobile]}>Stop Attendance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary, isMobile && styles.actionButtonMobile]} onPress={clearSelection}>
                    <Feather name="refresh-cw" size={16} color={colors.sidebar.text.secondary} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary, isMobile && styles.actionButtonTextMobile]}>Change Event</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {selectedEvent && mode === 'receipt' && (
              <View style={styles.receiptContainer}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.receiptDate}>{formatDate(selectedEvent.date)}</Text>
                </View>
                <View style={styles.receiptStats}>
                  <View style={styles.receiptStatItem}>
                    <Text style={styles.receiptStatLabel}>Total Students</Text>
                    <Text style={styles.receiptStatValue}>{students.length}</Text>
                  </View>
                  <View style={styles.receiptStatItem}>
                    <Text style={styles.receiptStatLabel}>Attended</Text>
                    <Text style={styles.receiptStatValue}>{attendanceRecords.length}</Text>
                  </View>
                  <View style={styles.receiptStatItem}>
                    <Text style={styles.receiptStatLabel}>Missing</Text>
                    <Text style={styles.receiptStatValue}>{missingAttendees.length}</Text>
                  </View>
                </View>

                {/* Send Penalty Button */}
                <TouchableOpacity
                  style={[
                    styles.generateReceiptButton,
                    {
                      backgroundColor: hasPenaltyBeenSent(selectedEvent.id) ? '#10b981' : '#ef4444',
                      marginBottom: 12
                    },
                    (missingAttendees.length === 0 || hasPenaltyBeenSent(selectedEvent.id)) && { opacity: 0.5 }
                  ]}
                  onPress={() => {
                    if (hasPenaltyBeenSent(selectedEvent.id)) {
                      showAlert('Already Sent', 'Penalties have already been sent for this event.');
                      return;
                    }
                    setShowPenaltyModal(true);
                  }}
                  disabled={missingAttendees.length === 0 || hasPenaltyBeenSent(selectedEvent.id)}
                >
                  <Feather
                    name={hasPenaltyBeenSent(selectedEvent.id) ? "check-circle" : "alert-triangle"}
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.generateReceiptText}>
                    {missingAttendees.length === 0
                      ? 'No Missing Students'
                      : hasPenaltyBeenSent(selectedEvent.id)
                        ? `Penalties Sent (${missingAttendees.length})`
                        : `Send Penalty (${missingAttendees.length})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.generateReceiptButton}
                  onPress={generateMissingReceipt}
                >
                  <Feather name="file-text" size={18} color="#ffffff" />
                  <Text style={styles.generateReceiptText}>Generate PDF Receipt</Text>
                </TouchableOpacity>

                <PenaltyAnnouncementModal
                  visible={showPenaltyModal}
                  onClose={() => {
                    setShowPenaltyModal(false);
                    if (selectedEvent) {
                      fetchAttendanceRecords(selectedEvent.id);
                    }
                  }}
                  onSendPenalty={handleSendPenalty} 
                  eventId={selectedEvent.id}
                  eventTitle={selectedEvent.title}
                  eventDate={selectedEvent.date}     
                  missingStudents={missingAttendees.map(s => ({
                    id: s.id,
                    name: s.name,
                    studentID: s.studentID,
                  }))}
                />
              </View>
            )}

            {!selectedEvent && (
              <View style={styles.noEventMessage}>
                <Feather name="info" size={24} color={colors.sidebar.text.muted} />
                <Text style={styles.noEventText}>
                  Select an event to {mode === 'qr' ? 'generate QR code' : 'view receipt options'}
                </Text>
              </View>
            )}
          </View>

          {/* Right Grid */}
          {selectedEvent && (
            <View style={[styles.rightGrid, isMobile && styles.rightGridMobile]}>
              {mode === 'qr' ? (
                // Attended view
                <>
                  <View style={[styles.rightHeader, isMobile && styles.rightHeaderMobile]}>
                    <View>
                      <Text style={[styles.rightTitle, isMobile && styles.rightTitleMobile]}>Attendance Records</Text>
                      <Text style={styles.recordCount}>
                        {filteredAttendedBySearch.length} attendees
                        {filteredAttendedBySearch.length > itemsPerPage && ` (Page ${currentPage}/${totalPages})`}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.refreshButton} onPress={refreshAttendance} disabled={refreshing}>
                      <Feather name="refresh-cw" size={18} color={refreshing ? colors.sidebar.text.muted : colors.accent.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Search Bar */}
                  <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}>
                    <Feather name="search" size={isMobile ? 14 : 16} color={colors.sidebar.text.secondary} />
                    <FormTextInput
                      inputStyle={styles.searchInput}
                      placeholder="Search by name or ID..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor={colors.sidebar.text.muted}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearButton}>
                        <Feather name="x" size={isMobile ? 14 : 16} color={colors.sidebar.text.secondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Filters */}
                  <View style={styles.filtersContainer}>
                    <Text style={[styles.filterLabel, isMobile && styles.filterLabelMobile]}>Year Level</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                      <TouchableOpacity
                        style={[styles.filterChip, selectedYearLevel === 'all' && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                        onPress={() => { setSelectedYearLevel('all'); setCurrentPage(1); }}
                      >
                        <Text style={[styles.filterChipText, selectedYearLevel === 'all' && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>All</Text>
                      </TouchableOpacity>
                      {availableYearLevels.map(yearLevel => (
                        <TouchableOpacity
                          key={yearLevel}
                          style={[styles.filterChip, selectedYearLevel === yearLevel && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                          onPress={() => { setSelectedYearLevel(yearLevel); setCurrentPage(1); }}
                        >
                          <Text style={[styles.filterChipText, selectedYearLevel === yearLevel && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>Year {yearLevel}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={[styles.filterLabel, isMobile && styles.filterLabelMobile]}>Block</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                      <TouchableOpacity
                        style={[styles.filterChip, selectedBlock === 'all' && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                        onPress={() => { setSelectedBlock('all'); setCurrentPage(1); }}
                      >
                        <Text style={[styles.filterChipText, selectedBlock === 'all' && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>All Blocks</Text>
                      </TouchableOpacity>
                      {availableBlocks.map(block => (
                        <TouchableOpacity
                          key={block}
                          style={[styles.filterChip, selectedBlock === block && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                          onPress={() => { setSelectedBlock(block); setCurrentPage(1); }}
                        >
                          <Text style={[styles.filterChipText, selectedBlock === block && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>Block {block}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Attended List */}
                  <View style={styles.attendanceListContainer}>
                    {paginatedBlocks.length > 0 ? (
                      <>
                        <FlatList
                          data={paginatedBlocks}
                          keyExtractor={(item) => item[0]}
                          renderItem={renderBlockSection}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.attendanceListContent}
                        />
                        {renderPagination()}
                      </>
                    ) : (
                      <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                        <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                          <Feather name="users" size={isMobile ? 32 : 40} color={colors.sidebar.text.muted} />
                        </View>
                        <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>
                          {attendanceRecords.length === 0 ? 'No attendance records yet' : 'No students match the filters/search'}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                // Missing view
                <>
                  <View style={[styles.rightHeader, isMobile && styles.rightHeaderMobile]}>
                    <Text style={[styles.rightTitle, isMobile && styles.rightTitleMobile]}>Missing Students</Text>
                    <Text style={styles.recordCount}>
                      {filteredMissingBySearch.length} students
                      {filteredMissingBySearch.length > missingItemsPerPage && ` (Page ${missingPage}/${totalMissingPages})`}
                    </Text>
                  </View>

                  {/* Search Bar */}
                  <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}>
                    <Feather name="search" size={isMobile ? 14 : 16} color={colors.sidebar.text.secondary} />
                    <FormTextInput
                      inputStyle={styles.searchInput}
                      placeholder="Search by name or ID..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor={colors.sidebar.text.muted}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearButton}>
                        <Feather name="x" size={isMobile ? 14 : 16} color={colors.sidebar.text.secondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Filters */}
                  <View style={styles.filtersContainer}>
                    <Text style={[styles.filterLabel, isMobile && styles.filterLabelMobile]}>Year Level</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                      <TouchableOpacity
                        style={[styles.filterChip, selectedYearLevel === 'all' && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                        onPress={() => { setSelectedYearLevel('all'); setMissingPage(1); }}
                      >
                        <Text style={[styles.filterChipText, selectedYearLevel === 'all' && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>All</Text>
                      </TouchableOpacity>
                      {allYearLevels.length > 0 ? allYearLevels.map(yearLevel => (
                        <TouchableOpacity
                          key={yearLevel}
                          style={[styles.filterChip, selectedYearLevel === yearLevel && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                          onPress={() => { setSelectedYearLevel(yearLevel); setMissingPage(1); }}
                        >
                          <Text style={[styles.filterChipText, selectedYearLevel === yearLevel && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>Year {yearLevel}</Text>
                        </TouchableOpacity>
                      )) : (
                        <Text style={{ color: colors.sidebar.text.muted, fontSize: 12, paddingVertical: 8 }}>No year levels available</Text>
                      )}
                    </ScrollView>

                    <Text style={[styles.filterLabel, isMobile && styles.filterLabelMobile]}>Block</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                      <TouchableOpacity
                        style={[styles.filterChip, selectedBlock === 'all' && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                        onPress={() => { setSelectedBlock('all'); setMissingPage(1); }}
                      >
                        <Text style={[styles.filterChipText, selectedBlock === 'all' && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>All Blocks</Text>
                      </TouchableOpacity>
                      {allBlocks.length > 0 ? allBlocks.map(block => (
                        <TouchableOpacity
                          key={block}
                          style={[styles.filterChip, selectedBlock === block && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                          onPress={() => { setSelectedBlock(block); setMissingPage(1); }}
                        >
                          <Text style={[styles.filterChipText, selectedBlock === block && styles.filterChipTextActive, isMobile && styles.filterChipTextMobile]}>Block {block}</Text>
                        </TouchableOpacity>
                      )) : (
                        <Text style={{ color: colors.sidebar.text.muted, fontSize: 12, paddingVertical: 8 }}>No blocks available</Text>
                      )}
                    </ScrollView>
                  </View>

                  {/* Missing List */}
                  <FlatList
                    data={paginatedMissing}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }: { item: Student }) => {
                      const isPaid = hasStudentPaid(item.id);
                      const isCompleted = hasStudentCompleted(item.id);
                      const isProcessing = processingAction === item.id;
                      const penaltySent = hasPenaltyBeenSent(selectedEvent?.id || '');

                      // Determine button visibility
                      const showCompleteButton = penaltySent && !isCompleted && !isPaid;
                      const showCancelButton = isCompleted;
                      const showPaidButton = isCompleted && !isPaid;

                      return (
                        <View style={[
                          styles.missingStudentItem,
                          isCompleted && { backgroundColor: isDark ? '#064e3b20' : '#d1fae520' },
                          isPaid && { backgroundColor: isDark ? '#1e3a8a20' : '#dbeafe20' }
                        ]}>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                  style={[
                                    styles.studentName,
                                    (isCompleted || isPaid) && {
                                      textDecorationLine: 'line-through',
                                      color: colors.sidebar.text.muted
                                    }
                                  ]}
                                >
                                  {item.name}
                                </Text>
                              </View>
                              <Text style={styles.studentId}>{item.studentID}</Text>

                              {/* Status badges */}
                              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                {isCompleted && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Feather name="check-circle" size={12} color="#10b981" />
                                    <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600' }}>Completed</Text>
                                  </View>
                                )}
                                {isPaid && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Feather name="credit-card" size={12} color="#3b82f6" />
                                    <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '600' }}>Paid</Text>
                                  </View>
                                )}
                                {penaltySent && !isCompleted && !isPaid && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Feather name="alert-circle" size={12} color="#f59e0b" />
                                    <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '600' }}>Penalty Sent</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <Text style={styles.studentBlock}>Block {item.block}</Text>
                          </View>

                          {/* Action Buttons Container */}
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                            {/* Complete Button */}
                            {showCompleteButton && (
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: '#10b981',
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  flex: 0,
                                  justifyContent: 'center',
                                  minWidth: 100,
                                }}
                                onPress={() => {
                                  console.log('Complete button pressed - storing event:', selectedEvent?.id, 'student:', item.id);
                                  setSelectedStudentForAction(item);
                                  setSelectedEventForAction(selectedEvent);
                                  setShowCompleteConfirmModal(true);
                                }}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                  <>
                                    <Feather name="check-circle" size={16} color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                                      Complete
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            )}

                            {/* Cancel Button */}
                            {showCancelButton && (
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: '#ef4444',
                                  paddingHorizontal: 16,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  marginRight: 5,
                                  flex: 0,
                                  justifyContent: 'center',
                                  minWidth: 100,
                                }}
                                onPress={() => {
                                  console.log('Cancel button pressed - storing event:', selectedEvent?.id, 'student:', item.id);
                                  setSelectedStudentForAction(item);
                                  setSelectedEventForAction(selectedEvent);
                                  setShowCancelConfirmModal(true);
                                }}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                  <>
                                    <Feather name="x-circle" size={16} color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                                      Cancel
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            )}

                          </View>
                        </View>
                      );
                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.missingListContent}
                    ListEmptyComponent={
                      <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                        <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                          <Feather name="users" size={isMobile ? 32 : 40} color={colors.sidebar.text.muted} />
                        </View>
                        <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>
                          No missing students match the filters/search
                        </Text>
                      </View>
                    }
                  />

                  {/* Pagination for missing list */}
                  {totalMissingPages > 1 && (
                    <View style={[styles.paginationContainer, isMobile && styles.paginationContainerMobile, { marginTop: 16 }]}>
                      <TouchableOpacity
                        style={[styles.paginationButton, missingPage === 1 && styles.paginationButtonDisabled]}
                        onPress={() => setMissingPage(p => Math.max(1, p - 1))}
                        disabled={missingPage === 1}
                      >
                        <Feather name="chevron-left" size={16} color={missingPage === 1 ? colors.sidebar.text.muted : colors.accent.primary} />
                        <Text style={[styles.paginationButtonText, missingPage === 1 && styles.paginationButtonTextDisabled]}>Prev</Text>
                      </TouchableOpacity>
                      <View style={styles.pageInfo}>
                        <Text style={styles.pageInfoText}>{missingPage}/{totalMissingPages}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.paginationButton, missingPage === totalMissingPages && styles.paginationButtonDisabled]}
                        onPress={() => setMissingPage(p => Math.min(totalMissingPages, p + 1))}
                        disabled={missingPage === totalMissingPages}
                      >
                        <Text style={[styles.paginationButtonText, missingPage === totalMissingPages && styles.paginationButtonTextDisabled]}>Next</Text>
                        <Feather name="chevron-right" size={16} color={missingPage === totalMissingPages ? colors.sidebar.text.muted : colors.accent.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals (unchanged but use theme where appropriate) */}
      <Modal visible={showEventModal} transparent animationType="fade" onRequestClose={() => setShowEventModal(false)}>
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather name="calendar" size={isMobile ? 16 : 20} color={colors.accent.primary} />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>Select Event</Text>
                  <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>Choose an event to generate QR code</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowEventModal(false)} style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}>
                <Feather name="x" size={isMobile ? 18 : 20} color={colors.sidebar.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}
              showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.accent.primary} />
                  <Text style={[styles.loadingText, isMobile && styles.loadingTextMobile]}>Loading events...</Text>
                </View>
              ) : events.length === 0 ? (
                <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                  <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                    <Feather name="calendar" size={isMobile ? 32 : 40} color={colors.sidebar.text.muted} />
                  </View>
                  <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No events available</Text>
                </View>
              ) : (
                <>
                  {paginatedEvents.map(item => renderEventItem({ item }))}
                  {totalEventPages > 1 && (
                    <View style={[styles.paginationContainer, isMobile && styles.paginationContainerMobile, { marginTop: 16 }]}>
                      <TouchableOpacity
                        style={[styles.paginationButton, eventPage === 1 && styles.paginationButtonDisabled]}
                        onPress={() => setEventPage(prev => Math.max(1, prev - 1))}
                        disabled={eventPage === 1}
                      >
                        <Feather name="chevron-left" size={16} color={eventPage === 1 ? colors.sidebar.text.muted : colors.accent.primary} />
                        <Text style={[styles.paginationButtonText, eventPage === 1 && styles.paginationButtonTextDisabled]}>Prev</Text>
                      </TouchableOpacity>
                      <View style={styles.pageInfo}>
                        <Text style={styles.pageInfoText}>{eventPage}/{totalEventPages}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.paginationButton, eventPage === totalEventPages && styles.paginationButtonDisabled]}
                        onPress={() => setEventPage(prev => Math.min(totalEventPages, prev + 1))}
                        disabled={eventPage === totalEventPages}
                      >
                        <Text style={[styles.paginationButtonText, eventPage === totalEventPages && styles.paginationButtonTextDisabled]}>Next</Text>
                        <Feather name="chevron-right" size={16} color={eventPage === totalEventPages ? colors.sidebar.text.muted : colors.accent.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showStopConfirmModal} transparent animationType="fade" onRequestClose={() => setShowStopConfirmModal(false)}>
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, { maxWidth: 400 }]}>
            <View style={styles.modernModalHeader}>
              <View style={styles.modernModalHeaderLeft}>
                <View style={[styles.modernModalIconContainer, { backgroundColor: '#ef444415' }]}>
                  <Feather name="alert-triangle" size={20} color="#ef4444" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={styles.modernModalTitle}>Stop Attendance?</Text>
                  <Text style={styles.modernModalSubtitle}>This action cannot be undone</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowStopConfirmModal(false)} style={styles.modernModalCloseButton}>
                <Feather name="x" size={20} color={colors.sidebar.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modernModalContent, { paddingTop: 0 }]}>
              <Text style={{ fontSize: 14, color: colors.sidebar.text.secondary, marginBottom: 20, lineHeight: 20 }}>
                This will immediately expire the QR code. Students will no longer be able to mark their attendance for this event.
              </Text>
              <View style={styles.modernFormActions}>
                <TouchableOpacity style={styles.modernCancelButton} onPress={() => setShowStopConfirmModal(false)}>
                  <Text style={styles.modernCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernSubmitButton, { backgroundColor: '#ef4444' }]} onPress={confirmStopAttendance}>
                  <Feather name="stop-circle" size={18} color="#ffffff" />
                  <Text style={styles.modernSubmitButtonText}>Stop Attendance</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showExpirationModal} transparent animationType="fade" onRequestClose={() => setShowExpirationModal(false)}>
        <View style={styles.modernModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={[styles.expirationModalContainer, isMobile && styles.expirationModalContainerMobile]}>
              <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
                <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                  <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                    <Feather name="clock" size={isMobile ? 16 : 20} color="#f59e0b" />
                  </View>
                  <View style={styles.modernModalTitleContainer}>
                    <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>Set QR Expiration</Text>
                    <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>For: {selectedEvent?.title}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowExpirationModal(false)} style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}>
                  <Feather name="x" size={isMobile ? 18 : 20} color={colors.sidebar.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={[styles.expirationModalContent, isMobile && styles.expirationModalContentMobile]}
                showsVerticalScrollIndicator={false}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Quick Options</Text>
                <View style={styles.expirationOptions}>
                  {quickOptions.map((option, index) => {
                    const isSelected = customExpiration === option.value;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.expirationOption, isMobile && styles.expirationOptionMobile, isSelected && styles.expirationOptionActive]}
                        onPress={() => setCustomExpiration(option.value)}
                      >
                        <Text style={[styles.expirationOptionText, isMobile && styles.expirationOptionTextMobile, isSelected && styles.expirationOptionTextActive]}>
                          {option.label}
                        </Text>
                        {isSelected && <Feather name="check" size={16} color="#ffffff" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Custom Date & Time</Text>
                <TouchableOpacity style={[styles.modernLocationButton, { marginBottom: 16 }]} onPress={() => setCustomDatePickerVisible(true)}>
                  <Feather name="calendar" size={20} color={colors.accent.primary} />
                  <View style={styles.modernLocationButtonText}>
                    <Text style={styles.modernLocationButtonTitle}>
                      {customExpirationDate
                        ? customExpirationDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Select custom date & time'}
                    </Text>
                    <Text style={styles.modernLocationButtonSubtitle}>{customExpirationDate ? 'Tap to change' : 'Choose expiration date'}</Text>
                  </View>
                </TouchableOpacity>

                {Platform.OS === 'web' ? (
                  <Modal visible={isCustomDatePickerVisible} transparent animationType="fade" onRequestClose={() => setCustomDatePickerVisible(false)}>
                    <View style={styles.modernModalOverlay}>
                      <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile, { maxWidth: 400 }]}>
                        <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
                          <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                            <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                              <Feather name="calendar" size={isMobile ? 16 : 20} color={colors.accent.primary} />
                            </View>
                            <View style={styles.modernModalTitleContainer}>
                              <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>Select Date & Time</Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => setCustomDatePickerVisible(false)} style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}>
                            <Feather name="x" size={isMobile ? 18 : 20} color={colors.sidebar.text.secondary} />
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}>
                          <input
                            type="datetime-local"
                            value={customExpirationDate ? formatDateForWebInput(customExpirationDate) : ''}
                            onChange={handleWebDateChange}
                            min={formatDateForWebInput(new Date())}
                            style={{
                              width: '100%',
                              padding: '12px',
                              fontSize: '16px',
                              borderRadius: '12px',
                              border: `1px solid ${colors.border}`,
                              marginBottom: '12px',
                              backgroundColor: isDark ? colors.card : '#f8fafc',
                              color: colors.text,
                              fontFamily: 'inherit',
                              outline: 'none',
                            }}
                          />
                          <Text style={{ fontSize: 12, color: colors.sidebar.text.muted, marginBottom: 20, textAlign: 'center' }}>
                            Format: YYYY-MM-DD HH:MM (24-hour)
                          </Text>
                          <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                            <TouchableOpacity style={[styles.modernSubmitButton, isMobile && styles.modernSubmitButtonMobile]} onPress={() => setCustomDatePickerVisible(false)}>
                              <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>Confirm</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePickerModal
                    isVisible={isCustomDatePickerVisible}
                    mode="datetime"
                    onConfirm={(date: Date) => { setCustomDatePickerVisible(false); setCustomExpirationDate(date); setCustomExpiration(date.toISOString()); }}
                    onCancel={() => setCustomDatePickerVisible(false)}
                    minimumDate={new Date()}
                    date={customExpirationDate || new Date()}
                  />
                )}

                <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                  <TouchableOpacity style={[styles.modernCancelButton, isMobile && styles.modernCancelButtonMobile]} onPress={() => setShowExpirationModal(false)}>
                    <Text style={[styles.modernCancelButtonText, isMobile && styles.modernCancelButtonTextMobile]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modernSubmitButton, !customExpiration && styles.modernSubmitButtonDisabled, isMobile && styles.modernSubmitButtonMobile]}
                    onPress={setManualExpiration}
                    disabled={!customExpiration}
                  >
                    <Feather name="check" size={isMobile ? 16 : 18} color="#ffffff" />
                    <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>Set Expiration</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Complete Confirmation Modal - MOVED OUTSIDE */}
      <Modal visible={showCompleteConfirmModal} transparent animationType="fade" onRequestClose={() => setShowCompleteConfirmModal(false)}>
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, { maxWidth: 400 }]}>
            <View style={styles.modernModalHeader}>
              <View style={styles.modernModalHeaderLeft}>
                <View style={[styles.modernModalIconContainer, { backgroundColor: '#10b98115' }]}>
                  <Feather name="check-circle" size={20} color="#10b981" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={styles.modernModalTitle}>Complete Penalty?</Text>
                  <Text style={styles.modernModalSubtitle}>This will mark the penalty as resolved</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCompleteConfirmModal(false)} style={styles.modernModalCloseButton}>
                <Feather name="x" size={20} color={colors.sidebar.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modernModalContent, { paddingTop: 0 }]}>
              <Text style={{ fontSize: 14, color: colors.sidebar.text.secondary, marginBottom: 20, lineHeight: 20 }}>
                Are you sure you want to mark <Text style={{ fontWeight: '600', color: colors.text }}>{selectedStudentForAction?.name}</Text>'s penalty as completed?
                This will remove the penalty from their profile.
              </Text>
              <View style={styles.modernFormActions}>
                <TouchableOpacity style={styles.modernCancelButton} onPress={() => setShowCompleteConfirmModal(false)}>
                  <Text style={styles.modernCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modernSubmitButton, { backgroundColor: '#10b981' }]}
                  onPress={() => {
                    if (selectedStudentForAction && selectedEventForAction) {
                      handleCompletePenalty(selectedStudentForAction, selectedEventForAction);
                    } else {
                      console.error('Missing student or event for completion');
                      showAlert('Error', 'Missing data. Please try again.');
                      setShowCompleteConfirmModal(false);
                    }
                  }}
                >
                  <Feather name="check-circle" size={18} color="#ffffff" />
                  <Text style={styles.modernSubmitButtonText}>Confirm Complete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Completion Confirmation Modal - MOVED OUTSIDE */}
      <Modal visible={showCancelConfirmModal} transparent animationType="fade" onRequestClose={() => setShowCancelConfirmModal(false)}>
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, { maxWidth: 400 }]}>
            <View style={styles.modernModalHeader}>
              <View style={styles.modernModalHeaderLeft}>
                <View style={[styles.modernModalIconContainer, { backgroundColor: '#ef444415' }]}>
                  <Feather name="x-circle" size={20} color="#ef4444" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={styles.modernModalTitle}>Cancel Completion?</Text>
                  <Text style={styles.modernModalSubtitle}>This will revert the penalty to pending</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCancelConfirmModal(false)} style={styles.modernModalCloseButton}>
                <Feather name="x" size={20} color={colors.sidebar.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modernModalContent, { paddingTop: 0 }]}>
              <Text style={{ fontSize: 14, color: colors.sidebar.text.secondary, marginBottom: 20, lineHeight: 20 }}>
                Are you sure you want to cancel the completion for <Text style={{ fontWeight: '600', color: colors.text }}>{selectedStudentForAction?.name}</Text>?
                The penalty will reappear on their profile as pending.
              </Text>
              <View style={styles.modernFormActions}>
                <TouchableOpacity style={styles.modernCancelButton} onPress={() => setShowCancelConfirmModal(false)}>
                  <Text style={styles.modernCancelButtonText}>Keep Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modernSubmitButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => {
                    if (selectedStudentForAction && selectedEventForAction) {
                      handleCancelCompletion(selectedStudentForAction, selectedEventForAction);
                    } else {
                      console.error('Missing student or event for cancellation');
                      showAlert('Error', 'Missing data. Please try again.');
                      setShowCancelConfirmModal(false);
                    }
                  }}
                >
                  <Feather name="x-circle" size={18} color="#ffffff" />
                  <Text style={styles.modernSubmitButtonText}>Confirm Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}