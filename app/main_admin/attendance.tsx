import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context/AuthContext';
import { db } from "../../lib/firebaseConfig";
import { attendanceStyles } from '../../styles/main-admin/attendanceStyles';

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  qrExpiration?: string | null;
  isActive?: boolean;
}

interface AttendanceRecord {
  studentName: string;
  studentID: string;
  yearLevel: string;
  block: string;
  course: string;
  gender: string;
  timestamp?: string;
  location?: {
    isWithinRadius: boolean;
    distance?: number;
    accuracy?: number;
  };
}

const TextInput = ({
  style,
  value,
  onChangeText,
  placeholder,
  ...props
}: {
  style?: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  [key: string]: any;
}) => (
  <RNTextInput
    style={[attendanceStyles.modernFormInput, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#94a3b8"
    {...props}
  />
);

export default function MainAdminAttendance() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
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

 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 10 items per page
  const [paginatedBlocks, setPaginatedBlocks] = useState<[string, AttendanceRecord[]][]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const isValidDate = (dateString: any): boolean => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  };

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
          };
        });
        setEvents(eventsList);
      } catch (error) {
        console.error('Error fetching events:', error);
        Alert.alert('Error', 'Failed to load events');
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
        };
      });
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, []);

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
      Alert.alert("Info", "Attendance is already stopped for this event");
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

      // Update local state
      const updatedEvent = {
        ...selectedEvent,
        isActive: false,
        qrExpiration: now
      };
      setSelectedEvent(updatedEvent);

      // Update in events list
      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? updatedEvent : e
      ));

      setShowStopConfirmModal(false);

      Alert.alert("Success", "Attendance stopped successfully!");

    } catch (error) {
      console.error('Error stopping attendance:', error);
      Alert.alert("Error", "Failed to stop attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateEventQRCode = (event: Event) => {
    if (!event) return;

    // Generate static QR value ONCE - doesn't change on re-renders
    const qrData = JSON.stringify({
      type: 'attendance',
      eventId: event.id,
      eventTitle: event.title,
      generatedAt: new Date().toISOString(), // Fixed at generation time
      expiresAt: event.qrExpiration && isValidDate(event.qrExpiration)
        ? event.qrExpiration
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      usesManualExpiration: !!(event.qrExpiration && isValidDate(event.qrExpiration)),
      eventLocation: event.coordinates
    });

    setQrValue(qrData); // Store in state
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
      Alert.alert("Error", "Please enter a valid date and time");
      return;
    }

    const expirationDate = new Date(customExpiration);
    const now = new Date();

    if (expirationDate <= now) {
      Alert.alert("Error", "Expiration date must be in the future");
      return;
    }

    try {
      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        qrExpiration: customExpiration,
        isActive: true
      });

      // Regenerate QR with new expiration
      const updatedEvent = {
        ...selectedEvent,
        qrExpiration: customExpiration,
        isActive: true
      };

      // Generate new QR value
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

      // Update events list
      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? updatedEvent : e
      ));

      Alert.alert("Success", "Expiration date set successfully!");
      setShowExpirationModal(false);
      setCustomExpiration('');

    } catch (error) {
      console.error('Error setting expiration:', error);
      Alert.alert("Error", "Failed to set expiration date");
    }
  };

  const clearManualExpiration = async () => {
    if (!selectedEvent) return;

    try {
      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        qrExpiration: null
      });

      Alert.alert("Success", "Expiration date cleared!");

      const updatedEvent = { ...selectedEvent, qrExpiration: null };
      setSelectedEvent(updatedEvent as Event);

      // Update in events list
      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? updatedEvent : e
      ));

    } catch (error) {
      console.error('Error clearing expiration:', error);
      Alert.alert("Error", "Failed to clear expiration date");
    }
  };

  const fetchAttendanceRecords = async (eventId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        if (eventData.attendees && Array.isArray(eventData.attendees)) {
          setAttendanceRecords(eventData.attendees);
          // Reset to first page when new records are loaded
          setCurrentPage(1);
        } else {
          setAttendanceRecords([]);
        }
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
  };

  const formatDate = (dateString: string) => {
    if (!dateString || !isValidDate(dateString)) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString || !isValidDate(dateString)) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  const getQuickExpirationOptions = () => {
    const now = new Date();
    const options = [
      { label: '1 hour', value: new Date(now.getTime() + 60 * 60 * 1000).toISOString() },
      { label: '6 hours', value: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString() },
      { label: '12 hours', value: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString() },
      { label: '24 hours', value: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() },
      { label: '1 week', value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    return options;
  };

  const getFilteredAttendanceRecords = useMemo(() => {
    let filtered = attendanceRecords;

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
  }, [attendanceRecords, selectedYearLevel, selectedBlock]);

  const getStudentsByBlock = useMemo(() => {
    const filteredRecords = getFilteredAttendanceRecords;
    const blocks: { [key: string]: AttendanceRecord[] } = {};

    filteredRecords.forEach(record => {
      const block = record.block || 'No Block';
      if (!blocks[block]) {
        blocks[block] = [];
      }
      blocks[block].push(record);
    });

    Object.keys(blocks).forEach(block => {
      blocks[block].sort((a, b) => a.studentName.localeCompare(b.studentName));
    });

    const sortedBlocks: { [key: string]: AttendanceRecord[] } = {};
    Object.keys(blocks).sort((a, b) => {
      if (a === 'No Block') return 1;
      if (b === 'No Block') return -1;
      return parseInt(a) - parseInt(b);
    }).forEach(key => {
      sortedBlocks[key] = blocks[key];
    });

    return sortedBlocks;
  }, [getFilteredAttendanceRecords]);

  // Apply pagination to blocks
  useEffect(() => {
    const blocksArray = Object.entries(getStudentsByBlock);
    const total = Math.ceil(blocksArray.length / itemsPerPage);
    setTotalPages(total || 1);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBlocks(blocksArray.slice(startIndex, endIndex));
  }, [getStudentsByBlock, currentPage, itemsPerPage]);

  const availableBlocks = useMemo(() => {
    const uniqueBlocks = [...new Set(attendanceRecords.map(record => record.block).filter(Boolean))];
    return uniqueBlocks.slice(0, 6); // Limit to 6 blocks
  }, [attendanceRecords]);

  const availableYearLevels = useMemo(() => {
    return [...new Set(attendanceRecords.map(record => record.yearLevel).filter(Boolean))];
  }, [attendanceRecords]);

  const isCurrentQRExpired = selectedEvent ? isQRCodeExpired(selectedEvent) : false;

  const stats = useMemo(() => ({
    total: getFilteredAttendanceRecords.length,
    verified: getFilteredAttendanceRecords.filter(r => r.location?.isWithinRadius).length,
    blocksCount: availableBlocks.length
  }), [getFilteredAttendanceRecords, availableBlocks]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={[attendanceStyles.paginationContainer, isMobile && attendanceStyles.paginationContainerMobile]}>
        <TouchableOpacity
          style={[attendanceStyles.paginationButton, currentPage === 1 && attendanceStyles.paginationButtonDisabled]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={16} color={currentPage === 1 ? '#cbd5e1' : '#0ea5e9'} />
          <Text style={[attendanceStyles.paginationButtonText, currentPage === 1 && attendanceStyles.paginationButtonTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>

        <View style={attendanceStyles.pageInfo}>
          <Text style={attendanceStyles.pageInfoText}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[attendanceStyles.paginationButton, currentPage === totalPages && attendanceStyles.paginationButtonDisabled]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={[attendanceStyles.paginationButtonText, currentPage === totalPages && attendanceStyles.paginationButtonTextDisabled]}>
            Next
          </Text>
          <Feather name="chevron-right" size={16} color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const isExpired = isQRCodeExpired(item);
    const isActive = item.isActive !== false && !isExpired;

    return (
      <TouchableOpacity
        style={[attendanceStyles.eventItem, isMobile && attendanceStyles.eventItemMobile]}
        onPress={() => generateEventQRCode(item)}
      >
        <View style={attendanceStyles.eventItemContent}>
          <Text style={[attendanceStyles.eventItemName, isMobile && attendanceStyles.eventItemNameMobile]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={attendanceStyles.eventItemBadges}>
            {item.qrExpiration && isValidDate(item.qrExpiration) && (
              <View style={[
                attendanceStyles.eventItemExpBadge,
                isExpired && attendanceStyles.eventItemExpBadgeExpired
              ]}>
                <Feather name="clock" size={10} color={isExpired ? "#dc2626" : "#d97706"} />
                <Text style={[
                  attendanceStyles.eventItemExpText,
                  isExpired && attendanceStyles.eventItemExpTextExpired
                ]}>
                  {isExpired ? 'Expired' : 'QR'}
                </Text>
              </View>
            )}
            {isActive && (
              <View style={attendanceStyles.eventItemActiveBadge}>
                <Feather name="check-circle" size={10} color="#16a34a" />
                <Text style={attendanceStyles.eventItemActiveText}>Active</Text>
              </View>
            )}
          </View>
        </View>

        {formatShortDate(item.date) && (
          <Text style={attendanceStyles.eventItemDate} numberOfLines={1}>
            {formatShortDate(item.date)}
          </Text>
        )}

        <View style={attendanceStyles.eventItemFooter}>
          <Text style={attendanceStyles.eventItemLocation} numberOfLines={1}>
            <Feather name="map-pin" size={10} color="#64748b" /> {item.location}
          </Text>
          {item.coordinates && (
            <View style={attendanceStyles.eventItemLocBadge}>
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
      <View style={attendanceStyles.blockSection}>
        <View style={attendanceStyles.blockHeader}>
          <Text style={attendanceStyles.blockTitle}>Block {block}</Text>
          <Text style={attendanceStyles.blockCount}>{students.length}</Text>
        </View>
        {students.map((record, index) => (
          <View key={index} style={[attendanceStyles.attendanceItem, isMobile && attendanceStyles.attendanceItemMobile]}>
            <View style={attendanceStyles.studentRow}>
              <View style={attendanceStyles.studentInfo}>
                <Text style={[attendanceStyles.studentName, isMobile && attendanceStyles.studentNameMobile]} numberOfLines={1}>
                  {record.studentName}
                </Text>
                <Text style={attendanceStyles.studentId}>{record.studentID}</Text>
              </View>
              {record.location && (
                <View style={[
                  attendanceStyles.locationBadge,
                  record.location.isWithinRadius ? attendanceStyles.locationBadgeValid : attendanceStyles.locationBadgeInvalid
                ]}>
                  <Feather
                    name={record.location.isWithinRadius ? "check" : "x"}
                    size={10}
                    color={record.location.isWithinRadius ? "#16a34a" : "#dc2626"}
                  />
                  <Text style={[
                    attendanceStyles.locationBadgeText,
                    record.location.isWithinRadius ? attendanceStyles.locationBadgeTextValid : attendanceStyles.locationBadgeTextInvalid
                  ]}>
                    {record.location.isWithinRadius ? 'Verified' : 'Too Far'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={attendanceStyles.studentDetails} numberOfLines={1}>
              {record.course} • Year {record.yearLevel}
            </Text>
            <Text style={attendanceStyles.timestamp}>
              {formatDate(record.timestamp || new Date().toISOString())}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const styles = attendanceStyles;

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#14203d', '#06080b']}
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

          <TouchableOpacity
            style={[styles.profileButton, isMobile && styles.profileButtonMobile]}
            onPress={() => router.push('/main_admin/profile')}
          >
            {userData?.photoURL ? (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={[styles.profileInitials, isMobile && styles.profileInitialsMobile]}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
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
            <Feather name="calendar" size={isMobile ? 10 : 12} color="#94a3b8" />
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

      {/* Stats Grid */}
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#0ea5e9' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#0ea5e915' }]}>
            <Feather name="users" size={isMobile ? 16 : 20} color="#0ea5e9" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.total}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Total</Text>
        </View>

        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#16a34a' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#16a34a15' }]}>
            <Feather name="check-circle" size={isMobile ? 16 : 20} color="#16a34a" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.verified}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Verified</Text>
        </View>

        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#f59e0b' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#f59e0b15' }]}>
            <Feather name="grid" size={isMobile ? 16 : 20} color="#f59e0b" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.blocksCount}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Blocks</Text>
        </View>
      </View>

      {/* Main Content - Scrollable */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
          {/* Left Grid - QR Code Generator */}
          <View style={[styles.leftGrid, isMobile && styles.leftGridMobile]}>
            <View style={[styles.leftHeader, isMobile && styles.leftHeaderMobile]}>
              <Text style={[styles.leftTitle, isMobile && styles.leftTitleMobile]}>QR Code Generator</Text>
            </View>

            {/* Event Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Select Event</Text>
              <TouchableOpacity
                style={[styles.eventSelector, isMobile && styles.eventSelectorMobile]}
                onPress={() => setShowEventModal(true)}
              >
                {selectedEvent ? (
                  <Text style={[styles.eventSelectorText, isMobile && styles.eventSelectorTextMobile]} numberOfLines={1}>
                    {selectedEvent.title}
                  </Text>
                ) : (
                  <Text style={styles.eventSelectorPlaceholder}>Tap to select an event</Text>
                )}
                <Feather name="chevron-down" size={20} color="#64748b" style={styles.eventSelectorIcon} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <>
                <View style={[styles.qrContainer, isMobile && styles.qrContainerMobile]}>
                  {/* Event Info */}
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventName, isMobile && styles.eventNameMobile]} numberOfLines={1}>
                      {selectedEvent.title}
                    </Text>

                    {formatDate(selectedEvent.date) && (
                      <View style={styles.eventDetails}>
                        <Feather name="calendar" size={12} color="#64748b" />
                        <Text style={styles.eventDetailText}>{formatDate(selectedEvent.date)}</Text>
                      </View>
                    )}

                    <View style={styles.eventDetails}>
                      <Feather name="map-pin" size={12} color="#64748b" />
                      <Text style={styles.eventDetailText}>{selectedEvent.location}</Text>
                    </View>

                    {selectedEvent.coordinates && (
                      <View style={styles.locationVerificationBadge}>
                        <Feather name="shield" size={12} color="#16a34a" />
                        <Text style={styles.locationVerificationText}>Location Verification</Text>
                      </View>
                    )}

                    {/* QR Status with Time Left */}
                    <View style={[
                      styles.statusBadge,
                      isCurrentQRExpired ? styles.statusBadgeExpired : styles.statusBadgeActive
                    ]}>
                      {isCurrentQRExpired ? (
                        <>
                          <Feather name="x-circle" size={12} color="#dc2626" />
                          <Text style={[styles.statusBadgeText, styles.statusBadgeTextExpired]}>
                            QR Expired
                          </Text>
                        </>
                      ) : (
                        <>
                          <Feather name="check-circle" size={12} color="#16a34a" />
                          <Text style={[styles.statusBadgeText, styles.statusBadgeTextActive]}>
                            {timeLeft ? `Expires in ${timeLeft}` : 'QR Active'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* QR Code or Expired Message */}
                  {!isCurrentQRExpired ? (
                    <>
                      <View style={styles.qrCodeContainer}>
                        {qrValue ? ( // Check if qrValue exists
                          <QRCode
                            value={qrValue} // Use the static state variable
                            size={isMobile ? 160 : 200}
                            color="#1E293B"
                            backgroundColor="#FFFFFF"
                          />
                        ) : (
                          <ActivityIndicator size="large" color="#0ea5e9" />
                        )}
                      </View>
                      <View style={styles.qrInfo}>
                        <Text style={styles.qrHint}>Scan this QR code for attendance</Text>
                        {selectedEvent.coordinates && (
                          <Text style={styles.qrHint}>
                            Location verification required
                          </Text>
                        )}
                      </View>
                    </>
                  ) : (
                    <View style={styles.expiredContainer}>
                      <Feather name="x-circle" size={48} color="#dc2626" style={styles.expiredIcon} />
                      <Text style={styles.expiredText}>QR Code Expired</Text>
                      <Text style={styles.expiredSubtext}>Generate a new code to continue</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={[styles.actionButtons, isMobile && styles.actionButtonsMobile]}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary, isMobile && styles.actionButtonMobile]}
                    onPress={() => setShowExpirationModal(true)}
                  >
                    <Feather name="clock" size={16} color="#ffffff" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary, isMobile && styles.actionButtonTextMobile]}>
                      Set Expiration
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger, isMobile && styles.actionButtonMobile]}
                    onPress={stopAttendance}
                  >
                    <Feather name="stop-circle" size={16} color="#ffffff" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary, isMobile && styles.actionButtonTextMobile]}>
                      Stop Attendance
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary, isMobile && styles.actionButtonMobile]}
                    onPress={clearSelection}
                  >
                    <Feather name="refresh-cw" size={16} color="#475569" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary, isMobile && styles.actionButtonTextMobile]}>
                      Change Event
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Right Grid - Attendance Records */}
          {selectedEvent && (
            <View style={[styles.rightGrid, isMobile && styles.rightGridMobile]}>
              <View style={[styles.rightHeader, isMobile && styles.rightHeaderMobile]}>
                <View>
                  <Text style={[styles.rightTitle, isMobile && styles.rightTitleMobile]}>Attendance Records</Text>
                  <Text style={styles.recordCount}>
                    {getFilteredAttendanceRecords.length} attendees 
                    {getFilteredAttendanceRecords.length > itemsPerPage && ` (Page ${currentPage}/${totalPages})`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={refreshAttendance}
                  disabled={refreshing}
                >
                  <Feather
                    name="refresh-cw"
                    size={18}
                    color={refreshing ? "#94a3b8" : "#0ea5e9"}
                  />
                </TouchableOpacity>
              </View>

              {/* Filters */}
              <View style={styles.filtersContainer}>
                <Text style={[styles.filterLabel, isMobile && styles.filterLabelMobile]}>Year Level</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedYearLevel === 'all' && styles.filterChipActive,
                      isMobile && styles.filterChipMobile
                    ]}
                    onPress={() => {
                      setSelectedYearLevel('all');
                      setCurrentPage(1);
                    }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedYearLevel === 'all' && styles.filterChipTextActive,
                      isMobile && styles.filterChipTextMobile
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {availableYearLevels.map(yearLevel => (
                    <TouchableOpacity
                      key={yearLevel}
                      style={[
                        styles.filterChip,
                        selectedYearLevel === yearLevel && styles.filterChipActive,
                        isMobile && styles.filterChipMobile
                      ]}
                      onPress={() => {
                        setSelectedYearLevel(yearLevel);
                        setCurrentPage(1);
                      }}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedYearLevel === yearLevel && styles.filterChipTextActive,
                        isMobile && styles.filterChipTextMobile
                      ]}>
                        Year {yearLevel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.filterLabel, isMobile && styles.filterLabelMobile]}>Block</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedBlock === 'all' && styles.filterChipActive,
                      isMobile && styles.filterChipMobile
                    ]}
                    onPress={() => {
                      setSelectedBlock('all');
                      setCurrentPage(1);
                    }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedBlock === 'all' && styles.filterChipTextActive,
                      isMobile && styles.filterChipTextMobile
                    ]}>
                      All Blocks
                    </Text>
                  </TouchableOpacity>
                  {availableBlocks.map(block => (
                    <TouchableOpacity
                      key={block}
                      style={[
                        styles.filterChip,
                        selectedBlock === block && styles.filterChipActive,
                        isMobile && styles.filterChipMobile
                      ]}
                      onPress={() => {
                        setSelectedBlock(block);
                        setCurrentPage(1);
                      }}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedBlock === block && styles.filterChipTextActive,
                        isMobile && styles.filterChipTextMobile
                      ]}>
                        Block {block}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Attendance List */}
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
                      <Feather name="users" size={isMobile ? 32 : 40} color="#cbd5e1" />
                    </View>
                    <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>
                      {attendanceRecords.length === 0 ? 'No attendance records yet' : 'No students match the selected filters'}
                    </Text>
                    {attendanceRecords.length === 0 && (
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Students will appear here once they scan the QR code
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Event Selection Modal */}
      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather name="calendar" size={isMobile ? 16 : 20} color="#0ea5e9" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                    Select Event
                  </Text>
                  <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>
                    Choose an event to generate QR code
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowEventModal(false)}
                style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
              >
                <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0ea5e9" />
                  <Text style={[styles.loadingText, isMobile && styles.loadingTextMobile]}>Loading events...</Text>
                </View>
              ) : events.length === 0 ? (
                <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                  <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                    <Feather name="calendar" size={isMobile ? 32 : 40} color="#cbd5e1" />
                  </View>
                  <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No events available</Text>
                </View>
              ) : (
                events.map(item => renderEventItem({ item }))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Stop Confirmation Modal */}
      <Modal
        visible={showStopConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStopConfirmModal(false)}
      >
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
              <TouchableOpacity
                onPress={() => setShowStopConfirmModal(false)}
                style={styles.modernModalCloseButton}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={[styles.modernModalContent, { paddingTop: 0 }]}>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 }}>
                This will immediately expire the QR code. Students will no longer be able to mark their attendance for this event.
              </Text>

              <View style={styles.modernFormActions}>
                <TouchableOpacity
                  style={styles.modernCancelButton}
                  onPress={() => setShowStopConfirmModal(false)}
                >
                  <Text style={styles.modernCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modernSubmitButton, { backgroundColor: '#ef4444' }]}
                  onPress={confirmStopAttendance}
                >
                  <Feather name="stop-circle" size={18} color="#ffffff" />
                  <Text style={styles.modernSubmitButtonText}>Stop Attendance</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Expiration Modal - LARGER SIZE */}
      <Modal
        visible={showExpirationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpirationModal(false)}
      >
        <View style={styles.modernModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <View style={[styles.expirationModalContainer, isMobile && styles.expirationModalContainerMobile]}>
              <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
                <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                  <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                    <Feather name="clock" size={isMobile ? 16 : 20} color="#f59e0b" />
                  </View>
                  <View style={styles.modernModalTitleContainer}>
                    <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                      Set QR Expiration
                    </Text>
                    <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>
                      For: {selectedEvent?.title}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowExpirationModal(false)}
                  style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
                >
                  <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={[styles.expirationModalContent, isMobile && styles.expirationModalContentMobile]}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Quick Options</Text>
                <View style={styles.expirationOptions}>
                  {getQuickExpirationOptions().map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.expirationOption, isMobile && styles.expirationOptionMobile]}
                      onPress={() => setCustomExpiration(option.value)}
                    >
                      <Text style={[styles.expirationOptionText, isMobile && styles.expirationOptionTextMobile]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Custom Date & Time</Text>
                <TextInput
                  placeholder="YYYY-MM-DDTHH:MM"
                  value={customExpiration}
                  onChangeText={setCustomExpiration}
                />

                <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                  <TouchableOpacity
                    style={[styles.modernCancelButton, isMobile && styles.modernCancelButtonMobile]}
                    onPress={() => setShowExpirationModal(false)}
                  >
                    <Text style={[styles.modernCancelButtonText, isMobile && styles.modernCancelButtonTextMobile]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modernSubmitButton,
                      !customExpiration && styles.modernSubmitButtonDisabled,
                      isMobile && styles.modernSubmitButtonMobile
                    ]}
                    onPress={setManualExpiration}
                    disabled={!customExpiration}
                  >
                    <Feather name="check" size={isMobile ? 16 : 18} color="#ffffff" />
                    <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
                      Set Expiration
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}