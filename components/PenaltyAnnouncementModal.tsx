import { Feather } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebaseConfig';
import { createBulkPenalties } from '../lib/penaltyService';

let DateTimePickerModal: any;
if (Platform.OS !== 'web') {
  DateTimePickerModal = require('react-native-modal-datetime-picker').default;
}

interface Student {
  id: string;
  name: string;
  studentID: string;
}

interface PenaltyAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onSendPenalty?: () => Promise<void>;
  eventId: string;
  eventTitle: string;
  eventDate?: any;                       
  missingStudents: Array<{
    id: string;
    name: string;
    studentID: string;
  }>;
  onPenaltiesSent?: (studentIds: string[]) => void;
}

const showAlert = (title: string, message: string, onPress?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onPress) onPress();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress }]);
  }
};

const createPenaltyAnnouncementModalStyles = (
  colors: any,
  isDark: boolean,
  isMobile: boolean
) => {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 24,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: isDark ? `${colors.background}80` : '#fef2f2', 
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#ef444420', 
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.sidebar.text.secondary,
      marginTop: 2,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      maxHeight: 500,
    },
    scrollContent: {
      padding: 20,
    },
    eventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.border : '#f0f9ff',
      padding: 16,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#e0f2fe',
    },
    eventIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${colors.accent.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    eventDetails: {
      flex: 1,
    },
    eventLabel: {
      fontSize: 12,
      color: colors.accent.primary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    eventText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
      lineHeight: 20,
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    severityContainer: {
      gap: 10,
    },
    severityButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.border,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    severityIndicator: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    severityIndicatorActive: {
      transform: [{ scale: 1.1 }],
    },
    severityTextContainer: {
      flex: 1,
    },
    severityName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    severityLevel: {
      fontSize: 12,
      color: colors.sidebar.text.muted,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    checkIcon: {
      marginLeft: 'auto',
    },
    inputContainer: {
      position: 'relative',
    },
    consequencesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      fontSize: 14,
      color: colors.text,
      minHeight: 120,
      backgroundColor: isDark ? colors.card : '#f8fafc',
      lineHeight: 20,
    },
    charCount: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      fontSize: 11,
      color: colors.sidebar.text.muted,
    },
    deadlineButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: isDark ? colors.card : '#f8fafc',
      gap: 12,
    },
    deadlineIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: `${colors.accent.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deadlineTextContainer: {
      flex: 1,
    },
    deadlineMain: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },
    deadlineSub: {
      fontSize: 12,
      color: colors.accent.primary,
      marginTop: 2,
      fontWeight: '500',
    },
    deadlinePlaceholder: {
      color: colors.sidebar.text.muted,
      fontWeight: '400',
    },
    datePickerWrapper: {
      marginTop: 8,
    },
    webDatePickerContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.accent.primary,
      overflow: 'hidden',
    },
    webPickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      backgroundColor: `${colors.accent.primary}15`,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    webPickerTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accent.primary,
      flex: 1,
      marginLeft: 10,
    },
    confirmDateButton: {
      backgroundColor: colors.accent.primary,
      padding: 14,
      margin: 14,
      marginTop: 0,
      borderRadius: 12,
      alignItems: 'center',
    },
    confirmDateText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    webPickerHint: {
      fontSize: 12,
      color: colors.sidebar.text.secondary,
      padding: 14,
      paddingTop: 0,
      backgroundColor: isDark ? colors.card : '#f8fafc',
      textAlign: 'center',
    },
    summaryCard: {
      backgroundColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sidebar.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    summaryText: {
      fontSize: 14,
      color: colors.text,
    },
    actions: {
      gap: 10,
      marginTop: 10,
    },
    sendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ef4444', 
      paddingVertical: 16,
      borderRadius: 16,
      gap: 10,
    },
    sendButtonDisabled: {
      backgroundColor: colors.sidebar.text.muted,
    },
    sendButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 16,
    },
    cancelButtonText: {
      color: colors.sidebar.text.secondary,
      fontSize: 15,
      fontWeight: '500',
    },
  });
};

const PenaltyAnnouncementModal: React.FC<PenaltyAnnouncementModalProps> = ({
  visible,
  onClose,
  eventId,
  eventTitle,
  eventDate,  
  missingStudents = [],
  onPenaltiesSent,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const isMobile = screenWidth < 640;
  const modalWidth = Math.min(screenWidth * 0.9, 400);

  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [consequences, setConsequences] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sending, setSending] = useState(false);

  const severityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  const severityLabels = {
    low: 'Minor',
    medium: 'Moderate',
    high: 'Severe',
  };

  const styles = useMemo(
    () => createPenaltyAnnouncementModalStyles(colors, isDark, isMobile),
    [colors, isDark, isMobile]
  );

  const handleSendPenalty = async () => {
    if (!consequences.trim()) {
      showAlert('Required Field', 'Please enter consequences or requirements for the students.');
      return;
    }
    if (!deadline) {
      showAlert('Required Field', 'Please select a compliance deadline.');
      return;
    }
    if (!eventId) {
      showAlert('Error', 'No event selected. Please select an event first.');
      return;
    }
    if (missingStudents.length === 0) {
      showAlert('No Recipients', 'There are no missing students to send penalties to.');
      return;
    }

    setSending(true);

    try {
      // Fetch push tokens for all missing students
      const studentsWithTokens = await Promise.all(
        missingStudents.map(async (student) => {
          const userQuery = query(
            collection(db, 'users'),
            where('studentID', '==', student.studentID)
          );
          const userDoc = await getDocs(userQuery);
          const userData = userDoc.docs[0]?.data();

          return {
            ...student,
            pushToken: userData?.expoPushToken || '',
          };
        })
      );

      const results = await createBulkPenalties(
        studentsWithTokens,
        {
          id: eventId,
          title: eventTitle || 'Unknown Event',
          date: eventDate || new Date(),
        },
        {
          type: 'absence',
          severity,
          consequences,
          deadline,
        },
        user?.uid || ''
      );

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      const successfulStudentIds = results
        .filter(r => r.success)
        .map(r => r.studentId);

      if (onPenaltiesSent && successfulStudentIds.length > 0) {
        onPenaltiesSent(successfulStudentIds);
      }

      const alertMessage = failedCount > 0
        ? `✅ ${successCount} of ${missingStudents.length} students notified\n\n⚠️ ${failedCount} failed to receive notification\n\nSeverity: ${severityLabels[severity]} (${severity})\nDeadline: ${formatDeadline(deadline)}`
        : `✅ Successfully notified ${successCount} students\n\nSeverity: ${severityLabels[severity]} (${severity})\nDeadline: ${formatDeadline(deadline)}`;

      showAlert(
        'Penalty Announcements Sent',
        alertMessage,
        () => {
          setConsequences('');
          setDeadline(null);
          setSeverity('medium');
          onClose();
        }
      );

    } catch (error) {
      console.error('Error sending penalties:', error);
      showAlert(
        'Error',
        'Failed to send penalty announcements. Please check your internet connection and try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const formatDeadline = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours}h remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Less than 1 hour';
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { width: modalWidth, maxHeight: '85%' }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIconContainer}>
                <Feather name="alert-triangle" size={20} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Penalty Notice</Text>
                <Text style={styles.modalSubtitle}>
                  {missingStudents.length} student{missingStudents.length !== 1 ? 's' : ''} missing
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={sending}>
              <Feather name="x" size={20} color={colors.sidebar.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.eventCard}>
              <View style={styles.eventIconContainer}>
                <Feather name="calendar" size={20} color={colors.accent.primary} />
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventLabel}>Event</Text>
                <Text style={styles.eventText} numberOfLines={2}>
                  {eventTitle || 'No event selected'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <Feather name="activity" size={14} color={colors.sidebar.text.secondary} /> Severity Level
              </Text>
              <View style={styles.severityContainer}>
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setSeverity(level)}
                    style={[
                      styles.severityButton,
                      severity === level && {
                        backgroundColor: severityColors[level] + '15',
                        borderColor: severityColors[level],
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.severityIndicator,
                        { backgroundColor: severityColors[level] },
                        severity === level && styles.severityIndicatorActive,
                      ]}
                    >
                      <Feather
                        name={level === 'low' ? 'arrow-down' : level === 'high' ? 'arrow-up' : 'minus'}
                        size={12}
                        color="#ffffff"
                      />
                    </View>
                    <View style={styles.severityTextContainer}>
                      <Text
                        style={[
                          styles.severityName,
                          severity === level && {
                            color: severityColors[level],
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {severityLabels[level]}
                      </Text>
                      <Text style={styles.severityLevel}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </View>
                    {severity === level && (
                      <Feather
                        name="check-circle"
                        size={16}
                        color={severityColors[level]}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <Feather name="file-text" size={14} color={colors.sidebar.text.secondary} /> Consequences / Requirements
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  multiline
                  numberOfLines={5}
                  value={consequences}
                  onChangeText={setConsequences}
                  placeholder="Submit a 500-word reflection paper explaining the importance of attendance. Attend the mandatory make-up session scheduled for Friday 3:00 PM at the Library Hall."
                  placeholderTextColor={colors.sidebar.text.muted}
                  style={styles.consequencesInput}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.charCount}>{consequences.length}/500</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <Feather name="clock" size={14} color={colors.sidebar.text.secondary} /> Compliance Deadline
              </Text>

              {!showDatePicker ? (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.deadlineButton,
                    deadline && { borderColor: colors.accent.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.deadlineIconContainer}>
                    <Feather
                      name={deadline ? "check-circle" : "calendar"}
                      size={20}
                      color={deadline ? colors.accent.primary : colors.sidebar.text.secondary}
                    />
                  </View>
                  <View style={styles.deadlineTextContainer}>
                    <Text
                      style={[
                        styles.deadlineMain,
                        !deadline && styles.deadlinePlaceholder,
                      ]}
                    >
                      {deadline ? formatDeadline(deadline) : 'Select deadline date & time'}
                    </Text>
                    {deadline && (
                      <Text style={styles.deadlineSub}>
                        {getTimeRemaining(deadline)}
                      </Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.sidebar.text.muted} />
                </TouchableOpacity>
              ) : (
                <View style={styles.datePickerWrapper}>
                  {Platform.OS === 'web' ? (
                    <View style={styles.webDatePickerContainer}>
                      <View style={styles.webPickerHeader}>
                        <Feather name="calendar" size={18} color={colors.accent.primary} />
                        <Text style={styles.webPickerTitle}>Select Date & Time</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Feather name="x" size={20} color={colors.sidebar.text.secondary} />
                        </TouchableOpacity>
                      </View>
                      <input
                        type="datetime-local"
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedDate = new Date(e.target.value);
                            const now = new Date();
                            if (selectedDate < now) {
                              showAlert('Invalid Date', 'Please select a future date and time.');
                              return;
                            }
                            setDeadline(selectedDate);
                          }
                        }}
                        min={new Date().toISOString().slice(0, 16)}
                        style={{
                          width: '95%',
                          padding: '14px',
                          fontSize: '16px',
                          borderRadius: '10px',
                          border: `2px solid ${colors.border}`,
                          backgroundColor: colors.card,
                          color: colors.text,
                          fontFamily: 'inherit',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.confirmDateButton}
                      >
                        <Text style={styles.confirmDateText}>Confirm Date & Time</Text>
                      </TouchableOpacity>
                      <Text style={styles.webPickerHint}>
                        Select a future date and time, then tap Confirm
                      </Text>
                    </View>
                  ) : (
                    DateTimePickerModal && (
                      <DateTimePickerModal
                        isVisible={showDatePicker}
                        mode="datetime"
                        onConfirm={(date: Date) => {
                          const now = new Date();
                          if (date < now) {
                            showAlert('Invalid Date', 'Please select a future date and time.');
                            return;
                          }
                          setDeadline(date);
                          setShowDatePicker(false);
                        }}
                        onCancel={() => setShowDatePicker(false)}
                        minimumDate={new Date()}
                        date={deadline || new Date()}
                        display="default"
                      />
                    )
                  )}
                </View>
              )}
            </View>

            {(consequences || deadline) && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Penalty Summary</Text>
                <View style={styles.summaryRow}>
                  <Feather name="users" size={14} color={colors.sidebar.text.secondary} />
                  <Text style={styles.summaryText}>
                    {missingStudents.length} recipient{missingStudents.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Feather name="activity" size={14} color={severityColors[severity]} />
                  <Text style={[styles.summaryText, { color: severityColors[severity] }]}>
                    {severityLabels[severity]} severity
                  </Text>
                </View>
                {deadline && (
                  <View style={styles.summaryRow}>
                    <Feather name="clock" size={14} color={colors.accent.primary} />
                    <Text style={styles.summaryText}>
                      Due {formatDeadline(deadline)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleSendPenalty}
                disabled={sending || missingStudents.length === 0}
                style={[
                  styles.sendButton,
                  (sending || missingStudents.length === 0) && styles.sendButtonDisabled,
                ]}
              >
                {sending ? (
                  <>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.sendButtonText}>Sending...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="send" size={18} color="#ffffff" />
                    <Text style={styles.sendButtonText}>
                      Send to {missingStudents.length} Student{missingStudents.length !== 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                disabled={sending}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PenaltyAnnouncementModal;