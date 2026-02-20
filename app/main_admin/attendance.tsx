import {
  Feather
} from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { db } from "../../lib/firebaseConfig";

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  coordinates?: any;
  qrExpiration?: string | null;
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  mainContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventSelector: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  eventSelectorPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#94a3b8',
  },
  eventSelectorIcon: {
    marginLeft: 8,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventInfo: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  statusBadgeExpired: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadgeTextActive: {
    color: '#16a34a',
  },
  statusBadgeTextExpired: {
    color: '#dc2626',
  },
  qrCodeContainer: {
    marginVertical: 20,
  },
  qrInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  qrHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  expiredContainer: {
    alignItems: 'center',
    padding: 20,
  },
  expiredIcon: {
    marginBottom: 12,
  },
  expiredText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    textAlign: 'center',
  },
  expiredSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonPrimary: {
    backgroundColor: '#0ea5e9',
  },
  actionButtonSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#475569',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  attendanceList: {
    maxHeight: 400,
  },
  blockSection: {
    marginBottom: 16,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  blockCount: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  attendanceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  studentId: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  locationBadgeValid: {
    backgroundColor: '#dcfce7',
  },
  locationBadgeInvalid: {
    backgroundColor: '#fee2e2',
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  locationBadgeTextValid: {
    color: '#16a34a',
  },
  locationBadgeTextInvalid: {
    color: '#dc2626',
  },
  studentDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  eventsList: {
    maxHeight: 400,
  },
  eventItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  eventItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventItemDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  expirationModalContent: {
    padding: 20,
  },
  expirationOption: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 8,
  },
  expirationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  customInput: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#0ea5e9',
  },
  modalButtonSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
  },
  modalButtonTextSecondary: {
    color: '#475569',
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  expirationBadgeText: {
    fontSize: 11,
    color: '#d97706',
    marginLeft: 4,
  },
  locationVerificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  locationVerificationText: {
    fontSize: 11,
    color: '#16a34a',
    marginLeft: 4,
  },
});

export default function MainAdminAttendance() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [showExpirationModal, setShowExpirationModal] = useState<boolean>(false);
  const [customExpiration, setCustomExpiration] = useState<string>('');

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
        };
      });
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, []);

  const isQRCodeExpired = (event: Event | null): boolean => {
    if (!event || !event.qrExpiration) return false;

    try {
      const expirationTime = new Date(event.qrExpiration);
      const now = new Date();
      return now > expirationTime;
    } catch (error) {
      return false;
    }
  };

  const generateEventQRCode = (event: Event) => {
    if (!event) return;

    let expirationTime: Date;

    if (event.qrExpiration && isValidDate(event.qrExpiration)) {
      expirationTime = new Date(event.qrExpiration);
    } else {
      expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);
    }

    setSelectedEvent(event);
    setShowEventModal(false);
    fetchAttendanceRecords(event.id);
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
        qrExpiration: customExpiration
      });

      Alert.alert("Success", "Expiration date set successfully!");
      setShowExpirationModal(false);
      setCustomExpiration('');

      const updatedEvent = { ...selectedEvent, qrExpiration: customExpiration };
      setSelectedEvent(updatedEvent);

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
    setAttendanceRecords([]);
    setSelectedYearLevel('all');
    setSelectedBlock('all');
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

  const getFilteredAttendanceRecords = () => {
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
  };

  const getStudentsByBlock = () => {
    const filteredRecords = getFilteredAttendanceRecords();
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
  };

  const yearLevels = [...new Set(attendanceRecords.map(record => record.yearLevel))].sort();
  const blocks = [...new Set(attendanceRecords.map(record => record.block).filter(Boolean))].sort();
  const filteredRecords = getFilteredAttendanceRecords();
  const studentsByBlock = getStudentsByBlock();

  const isCurrentQRExpired = selectedEvent ? isQRCodeExpired(selectedEvent) : false;

  const DEFAULT_YEAR_LEVELS = ['1', '2', '3', '4'];
  const DEFAULT_BLOCKS = ['1', '2', '3', '4', '5', '6'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Management</Text>
        <Text style={styles.headerSubtitle}>
          Generate QR codes and monitor real-time attendance
        </Text>
      </View>

      <View style={styles.mainContent}>
        {/* QR Code Generator Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QR Code Generator</Text>

          {/* Event Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Event</Text>
            <TouchableOpacity 
              style={styles.eventSelector}
              onPress={() => setShowEventModal(true)}
            >
              {selectedEvent ? (
                <Text style={styles.eventSelectorText}>{selectedEvent.title}</Text>
              ) : (
                <Text style={styles.eventSelectorPlaceholder}>Tap to select an event</Text>
              )}
              <Feather name="chevron-down" size={20} color="#64748b" style={styles.eventSelectorIcon} />
            </TouchableOpacity>
          </View>

          {selectedEvent && (
            <View style={styles.qrContainer}>
              {/* Event Info */}
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{selectedEvent.title}</Text>
                
                {formatDate(selectedEvent.date) && (
                  <View style={styles.eventDetails}>
                    <Feather name="calendar" size={14} color="#64748b" />
                    <Text style={styles.eventDetailText}>{formatDate(selectedEvent.date)}</Text>
                  </View>
                )}

                <View style={styles.eventDetails}>
                  <Feather name="map-pin" size={14} color="#64748b" />
                  <Text style={styles.eventDetailText}>{selectedEvent.location}</Text>
                </View>

                {selectedEvent.coordinates && (
                  <View style={styles.locationVerificationBadge}>
                    <Feather name="shield" size={12} color="#16a34a" />
                    <Text style={styles.locationVerificationText}>Location Verification</Text>
                  </View>
                )}

                {/* QR Status */}
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
                        QR Active
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* QR Code or Expired Message */}
              {!isCurrentQRExpired ? (
                <>
                  <View style={styles.qrCodeContainer}>
                    <QRCode
                      value={JSON.stringify({
                        type: 'attendance',
                        eventId: selectedEvent.id,
                        eventTitle: selectedEvent.title,
                        timestamp: new Date().toISOString(),
                        expiresAt: selectedEvent.qrExpiration && isValidDate(selectedEvent.qrExpiration)
                          ? selectedEvent.qrExpiration
                          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        usesManualExpiration: !!(selectedEvent.qrExpiration && isValidDate(selectedEvent.qrExpiration)),
                        eventLocation: selectedEvent.coordinates 
                      })}
                      size={180}
                      color="#1E293B"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                  <View style={styles.qrInfo}>
                    <Text style={styles.qrHint}>Scan this QR code for attendance</Text>
                    {selectedEvent.coordinates && (
                      <Text style={styles.qrHint}>
                        Location verification required within radius
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
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {selectedEvent && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => setShowExpirationModal(true)}
                >
                  <Feather name="clock" size={16} color="#ffffff" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                    Set Expiration
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={clearSelection}
                >
                  <Feather name="refresh-cw" size={16} color="#475569" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                    Change Event
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Attendance Records Card */}
        {selectedEvent && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attendance Records</Text>

            {/* Stats */}
            <View style={styles.attendanceStats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{filteredRecords.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {filteredRecords.filter(r => r.location?.isWithinRadius).length}
                </Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {blocks.length}
                </Text>
                <Text style={styles.statLabel}>Blocks</Text>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
              <Text style={styles.sectionTitle}>Year Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedYearLevel === 'all' && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedYearLevel('all')}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedYearLevel === 'all' && styles.filterChipTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {DEFAULT_YEAR_LEVELS.map(yearLevel => (
                  <TouchableOpacity
                    key={yearLevel}
                    style={[
                      styles.filterChip,
                      selectedYearLevel === yearLevel && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedYearLevel(yearLevel)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedYearLevel === yearLevel && styles.filterChipTextActive
                    ]}>
                      Year {yearLevel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionTitle}>Block</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedBlock === 'all' && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedBlock('all')}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedBlock === 'all' && styles.filterChipTextActive
                  ]}>
                    All Blocks
                  </Text>
                </TouchableOpacity>
                {DEFAULT_BLOCKS.map(block => (
                  <TouchableOpacity
                    key={block}
                    style={[
                      styles.filterChip,
                      selectedBlock === block && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedBlock(block)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedBlock === block && styles.filterChipTextActive
                    ]}>
                      Block {block}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Attendance List */}
            <ScrollView style={styles.attendanceList}>
              {Object.keys(studentsByBlock).length > 0 ? (
                Object.entries(studentsByBlock).map(([block, students]) => (
                  <View key={block} style={styles.blockSection}>
                    <View style={styles.blockHeader}>
                      <Text style={styles.blockTitle}>Block {block}</Text>
                      <Text style={styles.blockCount}>{students.length} students</Text>
                    </View>
                    {students.map((record, index) => (
                      <View key={index} style={styles.attendanceItem}>
                        <View style={styles.studentHeader}>
                          <Text style={styles.studentName}>{record.studentName}</Text>
                          <Text style={styles.studentId}>{record.studentID}</Text>
                          {record.location && (
                            <View style={[
                              styles.locationBadge,
                              record.location.isWithinRadius ? styles.locationBadgeValid : styles.locationBadgeInvalid
                            ]}>
                              <Feather 
                                name={record.location.isWithinRadius ? "check" : "x"} 
                                size={10} 
                                color={record.location.isWithinRadius ? "#16a34a" : "#dc2626"} 
                              />
                              <Text style={[
                                styles.locationBadgeText,
                                record.location.isWithinRadius ? styles.locationBadgeTextValid : styles.locationBadgeTextInvalid
                              ]}>
                                {record.location.isWithinRadius ? 'Verified' : 'Too Far'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.studentDetails}>
                          {record.course} • Year {record.yearLevel}
                        </Text>
                        <Text style={styles.timestamp}>
                          {formatDate(record.timestamp || new Date().toISOString())}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="users" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyStateText}>
                    {attendanceRecords.length === 0 
                      ? 'No attendance records yet' 
                      : 'No students match the selected filters'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Event Selection Modal */}
      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Feather name="loader" size={24} color="#64748b" />
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="calendar" size={48} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>No events available</Text>
              </View>
            ) : (
              <ScrollView style={styles.eventsList}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventItem}
                    onPress={() => generateEventQRCode(event)}
                  >
                    <Text style={styles.eventItemName}>{event.title}</Text>
                    
                    {formatDate(event.date) && (
                      <View style={styles.eventItemDetails}>
                        <Feather name="calendar" size={14} color="#64748b" />
                        <Text style={styles.eventItemDetailText}>{formatDate(event.date)}</Text>
                      </View>
                    )}

                    <View style={styles.eventItemDetails}>
                      <Feather name="map-pin" size={14} color="#64748b" />
                      <Text style={styles.eventItemDetailText}>{event.location}</Text>
                    </View>

                    {event.coordinates && (
                      <View style={styles.locationVerificationBadge}>
                        <Feather name="shield" size={12} color="#16a34a" />
                        <Text style={styles.locationVerificationText}>Location Verification</Text>
                      </View>
                    )}

                    {event.qrExpiration && isValidDate(event.qrExpiration) && (
                      <View style={styles.expirationBadge}>
                        <Feather name="clock" size={12} color="#d97706" />
                        <Text style={styles.expirationBadgeText}>
                          Expires: {formatDate(event.qrExpiration)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Expiration Modal */}
      <Modal
        visible={showExpirationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExpirationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set QR Expiration</Text>
              <TouchableOpacity onPress={() => setShowExpirationModal(false)}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.expirationModalContent}>
              <Text style={styles.sectionTitle}>For Event: {selectedEvent?.title}</Text>

              <Text style={styles.sectionTitle}>Quick Options</Text>
              {getQuickExpirationOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.expirationOption}
                  onPress={() => setCustomExpiration(option.value)}
                >
                  <Text style={styles.expirationOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionTitle}>Custom Date & Time</Text>
              <TextInput
                style={styles.customInput}
                placeholder="YYYY-MM-DDTHH:MM"
                value={customExpiration}
                onChangeText={setCustomExpiration}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowExpirationModal(false)}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={setManualExpiration}
                  disabled={!customExpiration}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Set Expiration
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}