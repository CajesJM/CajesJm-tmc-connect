import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from "../../../lib/firebaseConfig";
import type { QRCodeData } from '../../../lib/types';
import { attendanceStyles, DEFAULT_BLOCKS, DEFAULT_YEAR_LEVELS } from '../../styles/attendanceStyles';

export default function AttendanceScreen() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');

  const [showExpirationModal, setShowExpirationModal] = useState<boolean>(false);
  const [customExpiration, setCustomExpiration] = useState<string>('');

  const isValidDate = (dateString: any): boolean => {
    if (!dateString) return false;

    if (typeof dateString === 'string' && dateString.includes(' at ') && dateString.includes(' UTC')) {
      return true;
    }

    if (typeof dateString === 'string' && dateString.includes('T') && dateString.includes('Z')) {
      try {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      } catch (error) {
        return false;
      }
    }
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
            ...eventData,
            date: isValidDate(eventData.date) ? eventData.date : '',
            qrExpiration: isValidDate(eventData.qrExpiration) ? eventData.qrExpiration : null
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
          ...eventData,
          date: isValidDate(eventData.date) ? eventData.date : '',
          qrExpiration: isValidDate(eventData.qrExpiration) ? eventData.qrExpiration : null
        };
      });
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, []);

  const isQRCodeExpired = (event: any): boolean => {
    if (!event) return true;

    let expirationTime: Date;

    if (event.qrExpiration && isValidDate(event.qrExpiration)) {
      expirationTime = new Date(event.qrExpiration);
    } else {
      expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);
    }

    if (isNaN(expirationTime.getTime())) {
      return true;
    }

    const now = new Date();
    return now > expirationTime;
  };

  const generateEventQRCode = (event: any) => {
    if (!event) return;

    let expirationTime: Date;

    if (event.qrExpiration && isValidDate(event.qrExpiration)) {
      expirationTime = new Date(event.qrExpiration);
    } else {
      expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);
    }

    if (isNaN(expirationTime.getTime())) {
      expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const qrContent: QRCodeData = {
      type: 'attendance',
      eventId: event.id,
      eventTitle: event.title,
      timestamp: new Date().toISOString(),
      expiresAt: expirationTime.toISOString(),
      usesManualExpiration: !!(event.qrExpiration && isValidDate(event.qrExpiration)),
      eventLocation: event.coordinates // Include location coordinates in QR code
    };

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
      setSelectedEvent(updatedEvent);

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
    if (!dateString) return null;

    if (dateString.includes('T') && dateString.includes('Z')) {
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch (error) {
        return null;
      }
    }

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return null;
    }

    return null;
  };

  const getTimeRemaining = (expiresAt: string) => {
    if (!expiresAt || !isValidDate(expiresAt)) return 'No expiration set';

    const now = new Date();
    const expiration = new Date(expiresAt);

    if (isNaN(expiration.getTime())) return 'Invalid expiration';

    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    const remainingMins = diffMins % 60;

    if (diffDays > 0) {
      return `${diffDays}d ${remainingHours}h ${remainingMins}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`;
    }
    return `${diffMins} minutes`;
  };

  const refreshAttendance = () => {
    if (selectedEvent) {
      fetchAttendanceRecords(selectedEvent.id);
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

  const getYearLevels = () => {
    const yearLevels = [...new Set(attendanceRecords.map(record => record.yearLevel))];
    return yearLevels.sort();
  };

  const getBlocks = () => {
    const blocks = [...new Set(attendanceRecords
      .map(record => record.block)
      .filter(block => block != null && block !== '' && block !== undefined)
    )];

    return blocks.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      return a.toString().localeCompare(b.toString());
    });
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
    const blocks: { [key: string]: any[] } = {};

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

    const sortedBlocks: { [key: string]: any[] } = {};
    Object.keys(blocks).sort((a, b) => {
      if (a === 'No Block') return 1;
      if (b === 'No Block') return -1;
      return parseInt(a) - parseInt(b);
    }).forEach(key => {
      sortedBlocks[key] = blocks[key];
    });

    return sortedBlocks;
  };

  const yearLevels = getYearLevels();
  const blocks = getBlocks();
  const filteredRecords = getFilteredAttendanceRecords();
  const studentsByBlock = getStudentsByBlock();

  const isCurrentQRExpired = selectedEvent ? isQRCodeExpired(selectedEvent) : false;

  return (
    <ScrollView style={attendanceStyles.container} contentContainerStyle={attendanceStyles.contentContainer}>
      <Text style={attendanceStyles.title}>Attendance Management</Text>

      <View style={attendanceStyles.card}>
        <Text style={attendanceStyles.cardTitle}>Event QR Code Generator</Text>

        <View style={attendanceStyles.inputContainer}>
          <Text style={attendanceStyles.label}>Select Event</Text>
          <TouchableOpacity onPress={() => setShowEventModal(true)}>
            <View style={attendanceStyles.input}>
              <Text style={selectedEvent ? attendanceStyles.inputText : attendanceStyles.placeholderText}>
                {selectedEvent ? selectedEvent.title : 'Tap to select an event'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {selectedEvent ? (
          <View style={attendanceStyles.qrContainer}>
            <Text style={attendanceStyles.eventName}>{selectedEvent.title}</Text>

            {formatDate(selectedEvent.date) && (
              <Text style={attendanceStyles.eventDate}>
                {formatDate(selectedEvent.date)}
              </Text>
            )}

            <Text style={attendanceStyles.eventLocation}>
              <Icon name="map-marker" size={16} color="#1e6dffff" />{selectedEvent.location}
            </Text>

            {/* Location Verification Status */}
            {selectedEvent.coordinates && (
              <View style={attendanceStyles.locationVerificationBadge}>
                <Text style={attendanceStyles.locationVerificationText}>
                  <Icon name="map-marker-check" size={16} color="#10B981" /> Location Verification Enabled
                </Text>
                <Text style={attendanceStyles.locationDetails}>
                  Radius: {selectedEvent.coordinates.radius}m • 
                  {selectedEvent.coordinates.latitude.toFixed(6)}, {selectedEvent.coordinates.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            <View style={[
              attendanceStyles.qrStatus,
              isCurrentQRExpired ? attendanceStyles.qrStatusExpired : attendanceStyles.qrStatusActive
            ]}>
              {isCurrentQRExpired ? (
                <>
                  <Text style={attendanceStyles.qrStatusTitle}><Icon name="close" size={16} color="#DC2626" /> QR CODE EXPIRED</Text>
                  <Text style={attendanceStyles.qrStatusText}>
                    This QR code is no longer working. Students cannot scan it.
                  </Text>
                  {selectedEvent.qrExpiration && isValidDate(selectedEvent.qrExpiration) && (
                    <Text style={attendanceStyles.qrStatusNote}>
                      Expired on: {formatDate(selectedEvent.qrExpiration)}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={attendanceStyles.qrStatusTitle}>
                    {selectedEvent.qrExpiration ? (
                      <>
                        <Icon name="check-circle" size={16} color="#10B981" /> MANUALLY CONTROLLED
                      </>
                    ) : (
                      <>
                        <Icon name="check-circle" size={16} color="#10B981" /> ACTIVE QR CODE
                      </>
                    )}
                  </Text>
                  <Text style={attendanceStyles.qrStatusText}>
                    {selectedEvent.qrExpiration && isValidDate(selectedEvent.qrExpiration)
                      ? `Expires: ${formatDate(selectedEvent.qrExpiration)}`
                      : 'No expiration set (default 24 hours)'
                    }
                  </Text>
                  {selectedEvent.qrExpiration && isValidDate(selectedEvent.qrExpiration) && (
                    <Text style={attendanceStyles.qrStatusNote}>
                      Time remaining: {getTimeRemaining(selectedEvent.qrExpiration)}
                    </Text>
                  )}
                </>
              )}
            </View>

            {!isCurrentQRExpired ? (
              <>
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
                  size={200}
                  color="#1E293B"
                  backgroundColor="#FFFFFF"
                />
                <Text style={attendanceStyles.codeHint}>Scan this QR code for attendance</Text>
                {selectedEvent.coordinates && (
                  <Text style={attendanceStyles.locationHint}>
                    <Icon name="map-marker" size={16} color="#1e6dffff" /> Location verification required ({selectedEvent.coordinates.radius}m radius)
                  </Text>
                )}
              </>
            ) : (
              <View style={attendanceStyles.expiredQRPlaceholder}>
                <Text style={attendanceStyles.expiredQRText}><Icon name="cancel" size={48} color="#DC2626" /></Text>
                <Text style={attendanceStyles.expiredQRTitle}>QR Code Expired</Text>
                <Text style={attendanceStyles.expiredQRDescription}>
                  This QR code is no longer valid for scanning
                </Text>
              </View>
            )}

            <Text style={attendanceStyles.eventId}>Event ID: {selectedEvent.id.substring(0, 8)}...</Text>
          </View>
        ) : (
          <View style={attendanceStyles.placeholderQR}>
            <Text style={attendanceStyles.placeholderText}>
              Select an event to generate QR code
            </Text>
          </View>
        )}

        {selectedEvent && (
          <View style={attendanceStyles.expirationManagement}>
            <Text style={attendanceStyles.managementTitle}>QR Expiration Control</Text>

            <View style={attendanceStyles.managementButtons}>
              <TouchableOpacity
                style={[attendanceStyles.managementButton, attendanceStyles.setExpirationButton]}
                onPress={() => setShowExpirationModal(true)}
              >
                <Text style={attendanceStyles.managementButtonText}>
                  {selectedEvent.qrExpiration ? 'Change Expiration' : 'Set Expiration'}
                </Text>
              </TouchableOpacity>

              {selectedEvent.qrExpiration && (
                <TouchableOpacity
                  style={[attendanceStyles.managementButton, attendanceStyles.clearExpirationButton]}
                  onPress={clearManualExpiration}
                >
                  <Text style={attendanceStyles.managementButtonText}>Clear Expiration</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={attendanceStyles.managementNote}>
              {selectedEvent.qrExpiration && isValidDate(selectedEvent.qrExpiration)
                ? 'QR code expiration is manually controlled'
                : 'QR code uses default 24-hour expiration'
              }
            </Text>
          </View>
        )}

        <View style={attendanceStyles.buttonContainer}>
          {selectedEvent && (
            <TouchableOpacity
              style={[attendanceStyles.button, attendanceStyles.refreshButton]}
              onPress={refreshAttendance}
            >
              <Text style={attendanceStyles.buttonText}>Refresh Attendance</Text>
            </TouchableOpacity>
          )}

          {selectedEvent && (
            <TouchableOpacity
              style={[attendanceStyles.button, attendanceStyles.clearButton]}
              onPress={clearSelection}
            >
              <Text style={attendanceStyles.buttonText}>Change Event</Text>
            </TouchableOpacity>
          )}
        </View>

        {attendanceRecords.length > 0 && (
          <View style={attendanceStyles.attendanceContainer}>
            <View style={attendanceStyles.attendanceHeader}>
              <Text style={attendanceStyles.attendanceTitle}>
                📊 Attendance Records ({filteredRecords.length})
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={attendanceStyles.filterContainer}
                contentContainerStyle={attendanceStyles.filterContainerContent}
              >
                <Text style={attendanceStyles.filterLabel}>Year Level:</Text>
                <TouchableOpacity
                  style={[
                    attendanceStyles.filterButton,
                    selectedYearLevel === 'all' && attendanceStyles.filterButtonActive
                  ]}
                  onPress={() => setSelectedYearLevel('all')}
                >
                  <Text style={[
                    attendanceStyles.filterButtonText,
                    selectedYearLevel === 'all' && attendanceStyles.filterButtonTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {DEFAULT_YEAR_LEVELS.map(yearLevel => (
                  <TouchableOpacity
                    key={yearLevel}
                    style={[
                      attendanceStyles.filterButton,
                      selectedYearLevel === yearLevel && attendanceStyles.filterButtonActive
                    ]}
                    onPress={() => setSelectedYearLevel(yearLevel)}
                  >
                    <Text style={[
                      attendanceStyles.filterButtonText,
                      selectedYearLevel === yearLevel && attendanceStyles.filterButtonTextActive
                    ]}>
                      Year {yearLevel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={attendanceStyles.filterContainer}
                contentContainerStyle={attendanceStyles.filterContainerContent}
              >
                <Text style={attendanceStyles.filterLabel}>Block:</Text>
                <TouchableOpacity
                  style={[
                    attendanceStyles.filterButton,
                    selectedBlock === 'all' && attendanceStyles.filterButtonActive
                  ]}
                  onPress={() => setSelectedBlock('all')}
                >
                  <Text style={[
                    attendanceStyles.filterButtonText,
                    selectedBlock === 'all' && attendanceStyles.filterButtonTextActive
                  ]}>
                    All Blocks
                  </Text>
                </TouchableOpacity>

                {DEFAULT_BLOCKS.map(block => (
                  <TouchableOpacity
                    key={block}
                    style={[
                      attendanceStyles.filterButton,
                      selectedBlock === block && attendanceStyles.filterButtonActive
                    ]}
                    onPress={() => setSelectedBlock(block)}
                  >
                    <Text style={[
                      attendanceStyles.filterButtonText,
                      selectedBlock === block && attendanceStyles.filterButtonTextActive
                    ]}>
                      Block {block}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {Object.keys(studentsByBlock).length > 0 ? (
              <View style={attendanceStyles.blocksContainer}>
                {Object.entries(studentsByBlock).map(([block, students]) => (
                  <View key={block} style={attendanceStyles.blockSection}>
                    <View style={attendanceStyles.blockHeader}>
                      <Text style={attendanceStyles.blockTitle}>🧩 Block {block}</Text>
                      <Text style={attendanceStyles.blockCount}>{students.length} students</Text>
                    </View>
                    <View style={attendanceStyles.studentsList}>
                      {students.map((record, index) => (
                        <View key={index} style={attendanceStyles.attendanceItem}>
                          <View style={attendanceStyles.studentHeader}>
                            <Text style={attendanceStyles.studentName}>{record.studentName}</Text>
                            <Text style={attendanceStyles.studentId}>ID: {record.studentID}</Text>
                            {record.location && (
                              <View style={[
                                attendanceStyles.locationBadge,
                                record.location.isWithinRadius ? attendanceStyles.locationValid : attendanceStyles.locationInvalid
                              ]}>
                                <Text style={attendanceStyles.locationBadgeText}>
                                  {record.location.isWithinRadius ? '📍 Verified' : '📍 Too Far'}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={attendanceStyles.studentDetails}>
                            🎓 {record.course} • 📚 Year {record.yearLevel} • 🧩 Block {record.block}
                          </Text>
                          <Text style={attendanceStyles.studentDetails}>
                            👤 {record.gender}
                          </Text>

                          {record.location && (
                            <View style={attendanceStyles.locationDetailsContainer}>
                              <Text style={attendanceStyles.locationDetailsText}>
                                <Icon name="map-marker" size={16} color="#1e6dffff" /> {record.location.distance?.toFixed(0)}m away • 
                                Accuracy: {record.location.accuracy?.toFixed(0)}m
                                {!record.location.isWithinRadius && ' ⚠️'}
                              </Text>
                            </View>
                          )}
                          <Text style={attendanceStyles.timestamp}>
                            <Icon name="alarm" size={16} color="#666" /> {formatDate(record.timestamp || new Date().toISOString())}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={attendanceStyles.noRecords}>
                <Text style={attendanceStyles.noRecordsText}>
                  No students found for the selected filters
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedEvent && attendanceRecords.length === 0 && (
          <View style={attendanceStyles.noAttendance}>
            <Text style={attendanceStyles.noAttendanceText}>No attendance records yet</Text>
            <Text style={attendanceStyles.noAttendanceSubtext}>
              Students will appear here after scanning the QR code
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={attendanceStyles.modalOverlay}>
          <View style={attendanceStyles.modalContent}>
            <Text style={attendanceStyles.modalTitle}>Select Event</Text>

            {loading ? (
              <Text style={attendanceStyles.loadingText}>Loading events...</Text>
            ) : events.length === 0 ? (
              <Text style={attendanceStyles.noEventsText}>No events available</Text>
            ) : (
              <ScrollView style={attendanceStyles.eventsList}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={attendanceStyles.eventItem}
                    onPress={() => generateEventQRCode(event)}
                  >
                    <Text style={attendanceStyles.eventItemName}>{event.title}</Text>

                    {formatDate(event.date) && (
                      <Text style={attendanceStyles.eventItemDate}>
                        {formatDate(event.date)}
                      </Text>
                    )}
                    <Text style={attendanceStyles.eventItemLocation}>
                      <Icon name="map-marker" size={16} color="#1e6dffff" />{event.location}
                    </Text>

                    {/* Event Location Verification Status */}
                    {event.coordinates && (
                      <View style={attendanceStyles.eventLocationBadge}>
                        <Text style={attendanceStyles.eventLocationBadgeText}>
                          <Icon name="map-marker-check" size={14} color="#10B981" /> Location Verification
                        </Text>
                      </View>
                    )}

                    {event.qrExpiration && isValidDate(event.qrExpiration) && (
                      <View style={attendanceStyles.eventExpirationBadge}>
                        <Text style={attendanceStyles.eventExpirationText}>
                          <Icon name="alarm" size={16} color="#666" /> Expires: {formatDate(event.qrExpiration)}
                        </Text>
                      </View>
                    )}
                    <Text style={attendanceStyles.eventItemDescription}>
                      {event.description || 'No description available'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[attendanceStyles.modalButton, attendanceStyles.cancelButton]}
              onPress={() => setShowEventModal(false)}
            >
              <Text style={attendanceStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showExpirationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExpirationModal(false)}
      >
        <View style={attendanceStyles.modalOverlay}>
          <View style={attendanceStyles.modalContent}>
            <Text style={attendanceStyles.modalTitle}>Set QR Expiration</Text>
            <Text style={attendanceStyles.modalSubtitle}>
              For event: {selectedEvent?.title}
            </Text>

            <Text style={attendanceStyles.optionLabel}>Quick Options:</Text>
            <View style={attendanceStyles.quickOptions}>
              {getQuickExpirationOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={attendanceStyles.quickOption}
                  onPress={() => setCustomExpiration(option.value)}
                >
                  <Text style={attendanceStyles.quickOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={attendanceStyles.optionLabel}>Custom Date & Time:</Text>
            <Text style={attendanceStyles.inputHint}>
              Format: YYYY-MM-DDTHH:MM (e.g., {new Date().getFullYear()}-12-31T23:59)
            </Text>
            <View style={attendanceStyles.customInputContainer}>
              <Text style={attendanceStyles.customInput}>
                {customExpiration || 'No date selected'}
              </Text>
            </View>

            <View style={attendanceStyles.modalButtonRow}>
              <TouchableOpacity
                style={[attendanceStyles.modalButton, attendanceStyles.cancelButton]}
                onPress={() => setShowExpirationModal(false)}
              >
                <Text style={attendanceStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[attendanceStyles.modalButton, attendanceStyles.confirmButton]}
                onPress={setManualExpiration}
                disabled={!customExpiration}
              >
                <Text style={attendanceStyles.modalButtonText}>Set Expiration</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}